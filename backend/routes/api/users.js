const express = require('express')
const router = express.Router()
const { requireAuth } = require('../../middleware/authMiddleware')
const { loginLimiter } = require('../../middleware/rateLimiter')

const {
  register, login, logout, refresh, getMe,
  verifyEmail, forgotPassword, resetPassword,
} = require('../../controllers/authController')

router.post('/register', register)
router.post('/login', loginLimiter, login)
router.post('/logout', requireAuth, logout)
router.post('/refresh', refresh)
router.get('/me', requireAuth, getMe)
router.get('/verify-email', verifyEmail)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.get('/current', requireAuth, getMe)

module.exports = router
