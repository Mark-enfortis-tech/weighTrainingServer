const mongoose = require('mongoose');

const userAuthSchema = new mongoose.Schema({
  user_name: {
    type: String,
    required: ['Must include a user_name']
  },
  password: {
    type: String,
    required: ['Must include a password']
  },
  role: {
    type: String
  },
}, {collection: 'userAuthCollection'});

const UserAuth = mongoose.model('userAuthModel', userAuthSchema);
module.exports = UserAuth;