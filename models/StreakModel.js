import mongoose from 'mongoose';

const streakSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  streakCount: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastCompleted: { type: Date },
  completedDates: [{ type: Date }], 
  breakDates: [{ type: Date }], 
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Streak', streakSchema);
