const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Insufficient authorization level',
      });
    }
    next();
  };
};

const enforceBaseScope = (req, res, next) => {
 
  if (req.user.role === 'BASE_COMMANDER' && req.user.baseId) {
   
    req.query.baseId = req.user.baseId.toString();
  }
  
  if (req.user.role === 'LOGISTICS_OFFICER' && req.user.baseId) {
    req.query.baseId = req.user.baseId.toString();
  }
  next();
};

module.exports = { authorizeRoles, enforceBaseScope };
