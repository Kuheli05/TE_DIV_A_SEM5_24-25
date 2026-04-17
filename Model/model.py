from flask import Flask, request, jsonify
from pymongo import MongoClient
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import pickle
from dotenv import load_dotenv
import os
from bson.objectid import ObjectId

# Set up logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

app = Flask(__name__)

# MongoDB setup
mongo_uri = os.getenv('DB_CONNECTION')
client = MongoClient(mongo_uri)
db = client['TaskMan']
timers_collection = db['timers']

# Constants
MODEL_FILENAME = 'universal_activity_model.pkl'
PERIOD_STATS_FILENAME = 'period_stats.pkl'
# type of ml : supervised , unsupervised, reinforcement . Here we are using supervised learning (smart git copilot)
# what is supervised learning : Supervised learning is the machine learning task of learning a function that maps an input to an output based on example input-output pairs.
# okie bro , 

# unsupervised laerning : Unsupervised learning is a type of machine learning that looks for previously undetected patterns in a data set with no pre-existing labels and with a minimum of human supervision

# example for unsupervised learning  simple one please: clustering of data points based on their similarity (fine fine) 
# 
# reinforcement learning : Reinforcement learning is an area of machine learning concerned with how software agents ought to take actions in an environment in order to maximize the notion of cumulative reward.
# example for reinforcement learning : training a robot to walk by rewarding it for every step it takes without falling down
# ha 

def get_all_user_data():
    """Fetch timer data for all users from MongoDB."""
    try:
        all_data = list(timers_collection.find())
        logger.info(f"Retrieved {len(all_data)} records from MongoDB")
        return all_data
    except Exception as e:
        logger.error(f"Error fetching data from MongoDB: {str(e)}")
        return None
#  this is how we define funcitons in python, 
# yes bhai, kar de 


def prepare_universal_data(all_data):
    """Prepare data from all users for training."""
    if not all_data:
        return None, None, None
    
    df = pd.DataFrame(all_data)

    # step one : collect the data
    # step two : clean the data 
    # step three : prepare the data for training
    # step four : train the model
    
    # Convert startTime to datetime and extract features
    df['hour'] = pd.to_datetime(df['startTime']).dt.hour
    df['day_of_week'] = pd.to_datetime(df['startTime']).dt.dayofweek
    
    # Define time periods
    df['time_period'] = pd.cut(
        df['hour'], 
        bins=[0, 6, 12, 18, 24], 
        labels=['night', 'morning', 'afternoon', 'evening'],
        right=False
    )
    
    # Calculate global statistics for each time period
    period_stats = df.groupby('time_period').agg({
        'duration': ['sum', 'mean', 'count']
    }).reset_index()
    period_stats.columns = ['time_period', 'total_duration', 'avg_duration', 'activity_count']
    
    # Prepare features and target
    X = df[['hour', 'day_of_week', 'duration']]
    y = df['time_period']
    
    return X, y, period_stats

def train_universal_model(X, y):
    """Train and evaluate a universal model using data from all users.""" 
    if X is None or y is None:
        return None, None, None
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Train model ( what is this )  
    # but kal ye log maam ko kya batayenge 
    # tho ye hi bata de bhai short me, 

    # hamara hi example de. :)
    model = RandomForestClassifier(n_estimators=100, random_state=42) 
    model.fit(X_train, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    report = classification_report(y_test, y_pred)
    
    return model, accuracy, report

def save_model_and_stats(model, period_stats):
    """Save the trained model and period statistics."""
    if model is None or period_stats is None:
        return False
    
    try:
        with open(MODEL_FILENAME, 'wb') as file:
            pickle.dump(model, file)
        with open(PERIOD_STATS_FILENAME, 'wb') as file:
            pickle.dump(period_stats, file)
        return True
    except Exception as e:
        logger.error(f"Error saving model or stats: {str(e)}")
        return False

def load_model_and_stats():
    """Load the trained model and period statistics."""
    try:
        with open(MODEL_FILENAME, 'rb') as file:
            model = pickle.load(file)
        with open(PERIOD_STATS_FILENAME, 'rb') as file:
            period_stats = pickle.load(file)
        return model, period_stats
    except FileNotFoundError:
        return None, None

def suggest_work_time(time_period, period_stats):
    """Return a suggestion based on the predicted time period and  statistics."""
    if period_stats is None:
        return "No data available for suggestions."
    
    stats = period_stats[period_stats['time_period'] == time_period].iloc[0]
    
    base_suggestions = {
        "morning": "Morning (6 AM - 12 PM)",
        "afternoon": "Afternoon (12 PM - 6 PM)",
        "evening": "Evening (6 PM - 12 AM)",
        "night": "Night (12 AM - 6 AM)"
    }
    
    suggestion = f"Based on  user data, the {base_suggestions[time_period]} is a productive time. "
    suggestion += f"User completes an average of {stats['activity_count']:.0f} tasks "
    suggestion += f"with an average duration of {stats['avg_duration']:.0f} minutes during this period."
    
    return suggestion

@app.route('/train_universal_model', methods=['POST'])
def train_universal_model_endpoint():
    """Train and save a universal model using data from all users."""
    all_data = get_all_user_data()
    if not all_data:
        return jsonify({'error': 'Could not retrieve data from MongoDB'}), 500
    
    X, y, period_stats = prepare_universal_data(all_data)
    if X is None:
        return jsonify({'error': 'Insufficient data for training'}), 400
    
    model, accuracy, report = train_universal_model(X, y)
    model_saved = save_model_and_stats(model, period_stats)
    
    if not model_saved:
        return jsonify({'error': 'Failed to save model'}), 500
    
    return jsonify({
        'message': 'Universal model trained successfully',
        'accuracy': accuracy,
        'classification_report': report,
        'period_stats': period_stats.to_dict(orient='records')
    })

@app.route('/predict_activity', methods=['POST'])
def predict_activity():
    """Predict the best time period for a new activity using the universal model."""
    new_activity = request.json.get('newActivity')
    if not new_activity:
        return jsonify({'error': 'Missing newActivity in the request'}), 400
    
    model, period_stats = load_model_and_stats()
    if model is None:
        return jsonify({'error': 'No trained model found'}), 404
    
    # Prepare new activity data
    startTime = pd.to_datetime(new_activity['startTime'])
    hour = startTime.hour
    day_of_week = startTime.dayofweek
    duration = new_activity['duration']
    
    # Make prediction
    predicted_period = model.predict([[hour, day_of_week, duration]])[0]
    suggestion = suggest_work_time(predicted_period, period_stats)
    
    return jsonify({
        'predicted_period': predicted_period,
        'suggestion': suggestion
    })

if __name__ == '__main__':
    app.run(debug=True)