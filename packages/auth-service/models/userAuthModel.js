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
  userRole: {
    type: String,
    required: [true, 'Must include a userRole']
  },
  
  password: {
    type: String,
    required: [true, 'Must include a password']
  },
}, { collection: 'userAuthCollection' });

/**
 * Pre-save hook to auto-generate a unique userId starting from 1000.
 */
userAuthSchema.pre('save', async function (next) {
  if (!this.userId) {
    const lastEntry = await mongoose.model('userAuthModel').findOne().sort('-userId').exec();
    this.userId = lastEntry ? lastEntry.userId + 1 : 1000;
    console.log(`Assigned new userId: ${this.userId} for userName: ${this.userName}`);
  } else {
    console.log(`Existing userId: ${this.userId} for userName: ${this.userName}`);
  }
  next();
});


const UserAuthData = mongoose.model('userAuthModel', userAuthSchema);
module.exports = UserAuthData;
