module.exports = (...allowedRoles) => {
    const roles = Array.isArray(allowedRoles[0]) ? allowedRoles[0] : allowedRoles;
    return (req, res, next) => {
        if (!req.session.isLoggedIn || !req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const userRole = req.user.role || 'customer';
        if (!roles.includes(userRole)) {
            return res.status(403).json({
                message: `Forbidden: Access restricted to [${roles.join(', ')}] role(s)`
            });
        }
        next();
    };
};
