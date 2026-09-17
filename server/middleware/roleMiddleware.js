const requireRole = (allowedRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. This action requires the ${roles.join(' or ')} role.`,
        userRole: req.user.role,
      });
    }

    next();
  };
};

module.exports = {
  requireRole,
};
