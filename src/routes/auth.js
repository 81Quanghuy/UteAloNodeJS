const router = require('express').Router();
const AuthoController = require('../app/controllers/AuthController');
const AuthoMiddleware = require('../app/middlewares/AuthMiddleware');

router.post('/otp/set-password', AuthoMiddleware.isAuth, AuthoController.sendOTP);
router.post('/otp/register', AuthoController.sendOTPverify);

// REFRESH ACCESS_TOKEN
router.post('/refresh', AuthoController.refreshToken);

// REGISTER
router.post('/register', AuthoController.register);

// LOGIN
router.post('/login', AuthoController.login);

// Get link forgot password
router.post('/password-reset', AuthoController.sendLinkForgottenPassword);

// Reset password from link
router.post('/password-reset/:userId/:token', AuthoController.resetPassword);

// Change password
router.put('/change-password', AuthoMiddleware.isAuth, AuthoController.changePassword);
// set password
router.put('/set-password', AuthoMiddleware.isAuth, AuthoController.setPassword);

module.exports = router;
