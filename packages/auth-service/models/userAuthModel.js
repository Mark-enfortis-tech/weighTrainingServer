const mongoose = require('mongoose');

const userAuthSchema = new mongoose.Schema({
  user_name: {
    type: String,
    required: [true, 'Must include a user_name']
  },
  user_id: {
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
  if (!this.user_id) {
    const lastEntry = await mongoose.model('userAuthModel').findOne().sort('-user_id').exec();
    this.user_id = lastEntry ? lastEntry.user_id + 1 : 1000;
  }
  next();
});

const UserAuthData = mongoose.model('userAuthModel', userAuthSchema);
module.exports = UserAuthData;
