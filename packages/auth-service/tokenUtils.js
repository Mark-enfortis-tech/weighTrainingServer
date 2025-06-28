const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(403).send('Token is required');

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not set!');
      return res.status(500).send('Server misconfiguration');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res.status(403).send('Invalid or expired token');
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    console.error('Unexpected error in verifyToken:', error);
    return res.status(500).send('Internal server error during token verification');
  }
}

module.exports = { verifyToken };


