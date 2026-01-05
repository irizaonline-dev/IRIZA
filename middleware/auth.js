const jwt = require('jsonwebtoken');

function auth(requiredRole) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    if (!token) return res.status(401).json({ message: 'No token' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
      req.user = payload;
      if (requiredRole && payload.role !== requiredRole) return res.status(403).json({ message: 'Forbidden' });
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  };
}

module.exports = auth;
