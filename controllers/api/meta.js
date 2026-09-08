exports.getCsrfToken = (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
};

exports.getMe = (req, res) => {
    if (!req.session.isLoggedIn || !req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ user: { _id: req.user._id, email: req.user.email } });
};
