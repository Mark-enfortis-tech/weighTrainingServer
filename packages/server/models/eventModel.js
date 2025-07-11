const mongoose = require('mongoose');


const eventSchema = new mongoose.Schema({
  userId: {
    type: Number,
    required: [true, 'Must include a user_id']
  },
  date: {
    type: Date,
    required: [true, 'Must include a date']
  },
  exerType: {
    type: String,
    required: [true, 'Must include an exercise type']
  },
  set: {
    type: Number,
    required: [true, 'Must include a set number']
  },
  weight: {
    type: Number,
    required: [true, 'Must include a weight value']
  },
  plannedReps: {
    type: Number,
    required: [true, 'Must include a planned reps value']
  },
  actualReps: {
    type: Number
  },
}, { collection: 'eventCollection' });

// Pre-save hook to strip time from date
eventSchema.pre('save', function (next) {
  if (this.date instanceof Date) {
    this.date.setUTCHours(0, 0, 0, 0);
  }
  next();
});


const EventData = mongoose.model('eventModel', eventSchema);
module.exports = EventData;
