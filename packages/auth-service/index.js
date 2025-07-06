console.log("starting auth-service");
const express = require('express');
const fs = require('fs');
const https = require('https');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { userAuth} = require('./models/userAuthModel');
const { verifyToken } = require('./tokenUtils');  // Import only the token function
const mongoose = require('mongoose');

var path = require('path');

require('dotenv').config({ path: path.resolve(__dirname, '../server/config.env') });


// Private key for signing JWT
const JWT_SECRET = process.env.JWT_SECRET;

console.log('JWT_SECRET: ', JWT_SECRET);

// Sign Up route
const UserAuth = require('./models/userAuthModel'); // Adjust the path as needed
const { removeListener } = require('process');

console.log(`PID: ${process.pid}`);


const TTL_accessToken = '1h';
// const TTL_accessToken = '2m';
// const TTL_refreshToken = '7d';
const TTL_refreshToken = '9h';

// Store refresh tokens (in-memory or use a DB in production)
const refreshTokens = new Set();

// set up the service
const app = express();
app.use(express.json());


// start initialization
let HTTPS_PORT = 443;
(async () => {
  console.log("loading configuration...");
  try {

    console.log("configuration complete, starting auth service... ");
    const retVal = await initializeApp();

      // Start HTTPS server
      https.createServer(options, app).listen(HTTPS_PORT, () => {
        console.log(`Auth service is running on https://localhost:${HTTPS_PORT}`);
      });

    // if (retVal) {
    //   // continue
    //   console.log("configuration complete, starting auth service... ");

    //   // Start HTTPS server
    //   https.createServer(options, app).listen(HTTPS_PORT, () => {
    //     console.log(`Auth service is running on https://localhost:${HTTPS_PORT}`);
    //   });

    // } else {
    //   // handle missing config case
    //   console.log('unable to load configurations');
    //   process.exit(1);
    // }
  } catch (err) {
    console.error('App initialization failed', err);
    process.exit(1);
  }
})();


// moved to initializeApp()
// connect to database
// const DB = process.env.DATABASE_CMD_HIST.replace('<PASSWORD>', process.env.DATABASE_CMD_HIST_PASSWORD);
// mongoose.connect(DB, {
// }).then(con => {
//   console.log(con.connection);
//   console.log('DB connection successful')
// });

async function initializeApp() {
  console.log("starting index.js");
  console.log("running inializeApp()");;
  console.log(`node environment: ${process.env.NODE_ENV}`);

  let DB = null;

  if (process.env.NODE_ENV === 'development') {
    DB = process.env.WTDB_NO_AUTH;  // e.g. "mongodb://127.0.0.1:27017/vctrDB"
  } else {
    DB = process.env.WTDB.replace('<PASSWORD>', process.env.WTDB_PASSWORD);
  }

  console.log('DB connection string:', DB);

  try {
    await mongoose.connect(DB, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('DB connection successful');
  } catch (err) {
    console.error('DB connection error:', err);
    throw err; // rethrow if you want to stop app startup
  }

  // const config = await fetchServerConfigs(); // returns a single object or null

  // if (config) {
  //   HTTPS_PORT = config.https_port;
  //   console.log(`Configuration set:, HTTPS_PORT: ${HTTPS_PORT}`);
  //   console.log(`Auth-service started, waiting for client login on port: ${HTTPS_PORT}`);
  //   return true; // export this or whatever you want
  // } else {
  //   console.error('No configs found in database');
  //   return false;
  // }
}

// Signup route (admin-only access)
app.post('/signup', async (req, res) => {
  const { userName, password } = req.body;
  console.log(`auth-service new user signup attempt for ${userName}`);

  if (!userName || !password) {
    return res.status(400).send('userName and password are required');
  }

  const existingUser = await UserAuth.findOne({ userName: userName });
  if (existingUser) {
    return res.status(400).send('userName already exists');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new UserAuth({ user_name: userName, password: hashedPassword });
  await newUser.save();

  console.log(`auth-service new user ${userName} signed up`);
  res.status(201).send('User created successfully');
});




// Login route
app.post('/login', async (req, res) => {
  const { userName, password} = req.body;
  console.log(`auth-service login attempt from ${userName}`);

  const user = await UserAuth.findOne({ user_name: userName });
  if (!user) return res.status(400).send('Invalid userName');

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).send('Incorrect password');

  const payload = { userName };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  console.log(`auth-service user ${userName} logged in, tokens transmitted`);
  const userRole = user.role;
  console.log(`user role: ${userRole}`);
  
  res.json({ accessToken, refreshToken, userRole });
});

// Token refresh endpoint
app.post('/token', (req, res) => {
  const { refreshToken } = req.body;
  console.log('/token endpoint accessed');

  if (!refreshToken || !refreshTokens.has(refreshToken)) return res.sendStatus(403);

  jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'myrefreshsecret', (err, user) => {
    if (err) return res.status(403).send('Invalid or expired refresh token');

    refreshTokens.delete(refreshToken); // Rotate the token

    const payload = { userName: user.userName };
    const newAccessToken = generateAccessToken(payload);

    let newRefreshToken = refreshToken;
    if (shouldRenewRefreshToken(refreshToken)) {
      newRefreshToken = generateRefreshToken(payload);
    } else {
      refreshTokens.add(refreshToken); // Re-add current token
    }

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  });
});


// Change Password route
app.post('/change-password',  async (req, res) => {
  const { userName, password } = req.body;
  console.log(`auth-service change password attempt from ${userName} `);

  const user = await UserAuth.findOne({ user_name: userName });
  if (!user) {
    return res.status(400).send('Invalid userName');
  }

  const match = await bcrypt.compare(password, user.password);
  if (match) {
    return res.status(400).send('New password matches old password');
  }

  const hashedNewPassword = await bcrypt.hash(password, 10);
  user.password = hashedNewPassword;
  await user.save();

  console.log(`auth-service user ${userName} password changed`);

  res.send('Password changed successfully');
});



// Read your SSL certificates
const options = {
  key: fs.readFileSync('certs/key.pem'),
  cert: fs.readFileSync('certs/cert.pem'),
};




// Helper functions
function generateAccessToken(user) {
  console.log("access token generated ");
  return jwt.sign(user, process.env.JWT_SECRET || 'mysecretkey', { expiresIn: TTL_accessToken });
}


function generateRefreshToken(user) {
  console.log("refresh token generated ");
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET || 'myrefreshsecret', { expiresIn: TTL_refreshToken });
  refreshTokens.add(refreshToken);
  return refreshToken;
}

function shouldRenewRefreshToken(refreshToken) {
  const decoded = jwt.decode(refreshToken);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  const ttl = decoded.exp - now;
  return ttl < (8 * 60 * 60); // Less than 8 hours
}



