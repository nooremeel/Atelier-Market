exports.getCsrfToken = (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
};

exports.getMe = (req, res) => {
    if (!req.session.isLoggedIn || !req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    const { _id, name, email, role, avatar, phone, address, sellerProfile, favourites, defaultPaymentMethod, savedCard, createdAt } = req.user;
    res.json({ user: { _id, name, email, role, avatar, phone, address, sellerProfile, favourites, defaultPaymentMethod: defaultPaymentMethod || 'card', savedCard: savedCard || null, createdAt } });
};
