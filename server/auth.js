const jwt = require('jsonwebtoken');

// Signs the APPLICATION JWT (not the GitHub access token) after a
// successful OAuth login. This is what gets stored in the `token` cookie.
function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Protects any route it's attached to. Reads the JWT from the HttpOnly
// `token` cookie (never from the request body/query), verifies it, and
// attaches the decoded identity to req.user. Anything invalid/missing -> 401.
function verifyJWT(req, res, next) {
  const token = req.cookies && req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, name }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = { generateToken, verifyJWT };
