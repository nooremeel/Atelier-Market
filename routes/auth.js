const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth');
const User = require('../models/user');
const router = express.Router();

router.post(
    '/login',

    [
        body('email')
            .isEmail()
            .withMessage('Please enter a valid email address.')
            .normalizeEmail(),
        body('password')
            .trim()
    ],
    authController.postLogin
);

router.post('/signup', [
    check('email')
        .isEmail()
        .withMessage('The email you entered is invalid, please enter a valid email')
        .custom((value, { req }) => {
            return User.findOne({ email: value })
                .then(userDoc => {
                    if (userDoc) {
                        return Promise.reject('Email already exists')
                    }
                })
        }).normalizeEmail(),
    body('password')
        .isStrongPassword()
        .withMessage('Please make sure your password has at least 8 characters, At least 1 uppercase letter, At least 1 lowercase letter, At least 1 number, and At least 1 symbol')
        .trim(),
    body('confirmPassword')
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error('Password does not match');
            }
            return true
        }).trim()



], authController.postSignup);

router.post('/logout', authController.postLogout);

router.post('/reset-password', authController.postReset);

router.get('/reset-password/:token', authController.getResetToken);

router.post('/change-password', authController.postChangePassword);

module.exports = router;