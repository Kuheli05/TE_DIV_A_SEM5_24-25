import pandas as pd
from flask import Flask, request, jsonify
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib

app = Flask(__name__)

# Dummy data for demonstration (Replace with your data retrieval logic)
def get_user_data(user_id):
    # This function should retrieve user-specific data from your database
    # Example data frame creation
    data = {
        'hour': [8, 9, 10, 11, 12, 13, 14],
        'day_of_week': [0, 1, 2, 3, 4, 5, 6],  # 0=Monday, 6=Sunday
        'duration': [30, 45, 60, 30, 120, 60, 90],
        'activity_period': [0, 1, 0, 1, 1, 0, 1]  # 0=Not Ideal, 1=Ideal
    }
    return pd.DataFrame(data)

def prepare_user_data(df):
    X = df[['hour', 'day_of_week', 'duration']]
    y = df['activity_period']
    return X, y

def train_model(user_id):
    # Get user data
    user_data = get_user_data(user_id)
    
    # Prepare data
    X, y = prepare_user_data(user_data)

    # Split data into train and test sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train Random Forest model
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)

    # Save the model
    model_file = f'model_{user_id}.pkl'
    joblib.dump(model, model_file)
    print(f'Model saved to {model_file}')  # Add this line to log the model saving


def load_model(user_id):
    try:
        return joblib.load(f'model_{user_id}.pkl')
    except FileNotFoundError:
        return None

@app.route('/train_activity_model', methods=['POST'])
def train_activity_model():
    user_id = request.json.get('userId')
    if not user_id:
        return jsonify({'error': 'Missing userId in the request'}), 400
    
    # Train model for the specified user
    train_model(user_id)
    return jsonify({'message': f'Model trained for user {user_id}'}), 200

@app.route('/predict_activity', methods=['POST'])
def predict_user_activity():
    user_id = request.json.get('userId')
    new_activity = request.json.get('newActivity')
 
    if not user_id or not new_activity:
        return jsonify({'error': 'Missing userId or newActivity in the request'}), 400

    # Load the trained model
    model = load_model(user_id)
    if model is None:
        return jsonify({'error': 'No trained model found for user'}), 404

    # Prepare new activity data
    startTime = pd.to_datetime(new_activity['startTime'])
    hour = startTime.hour
    day_of_week = startTime.dayofweek
    duration = new_activity['duration']

    # Make prediction
    predicted_period = model.predict([[hour, day_of_week, duration]])[0]

    # Return the predicted period as JSON
    return jsonify({'predicted_period': predicted_period}), 200

if __name__ == '__main__':
    app.run(debug=True)
