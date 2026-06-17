const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  // Get the token from the request header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, not authorized' });
  }

  try {
    const token = authHeader.split(' ')[1]; // get the part after "Bearer "
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify it
    req.user = decoded; // attach user info to the request
    next(); // allow the request to continue
  } catch (error) {
    res.status(401).json({ message: 'Token is invalid' });
  }
};

module.exports = { protect };