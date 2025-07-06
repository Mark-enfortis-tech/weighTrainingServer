const mongoose = require('mongoose');

const userAuthSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Must include a userName']
  },
  userId: {
    type: Number,
    unique: true // ensures no duplicates
  },
  password: {
    type: String,
    required: [true, 'Must include a password']
  },
}, { collection: 'userAuthCollection' });

/**
 * Pre-save hook to auto-generate a unique user_id starting from 1000.
 */
userAuthSchema.pre('save', async function (next) {
  if (!this.userId) {
    const lastEntry = await mongoose.model('userAuthModel').findOne().sort('-userId').exec();
    this.userId = lastEntry ? lastEntry.userId + 1 : 1000;
  }
  next();
});

const UserAuthData = mongoose.model('userAuthModel', userAuthSchema);
module.exports = UserAuthData;
