const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const BlacklistedToken = require('../models/BlacklistedToken')
const redis = require('../config/redis')
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email')

const signToken = (userId) => jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '15m' })

const signRefreshToken = (userId) => jwt.sign({ id: userId }, process.env.REFRESH_SECRET, { expiresIn: '7d' })

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/api/auth',
  })
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required.' })
    if (password.length < 8) return res.status(400).json({ error: 'Password min 8 chars.' })

    const exists = await User.findOne({ email: email.toLowerCase() })
    if (exists) return res.status(409).json({ error: 'Email already registered.' })

    const user = await User.create({ name, email: email.toLowerCase(), password })
    const verifyToken = user.generateEmailVerificationToken()
    await user.save({ validateBeforeSave: false })

    try { await sendVerificationEmail(user.email, verifyToken) } catch (e) { console.error('Email failed:', e.message) }

    const accessToken = signToken(user._id)
    const refreshToken = signRefreshToken(user._id)
    setRefreshCookie(res, refreshToken)

    res.status(201).json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
      accessToken,
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' })
    if (user.isLocked()) return res.status(423).json({ error: 'Account locked. Try again in 15 min.' })

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      await user.incrementLoginAttempts()
      return res.status(401).json({ error: 'Invalid credentials.' })
    }

    await user.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } })

    const accessToken = signToken(user._id)
    const refreshToken = signRefreshToken(user._id)
    setRefreshCookie(res, refreshToken)

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified },
      accessToken,
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const logout = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (token) {
      const hash = crypto.createHash('sha256').update(token).digest('hex')
      await BlacklistedToken.create({ tokenHash: hash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
      try { await redis.setex(`bl_${hash}`, 7 * 24 * 60 * 60, '1') } catch (e) {}
    }
    res.clearCookie('refreshToken', { path: '/api/auth' })
    res.json({ message: 'Logged out.' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken
    if (!token) return res.status(401).json({ error: 'No refresh token.' })

    const hash = crypto.createHash('sha256').update(token).digest('hex')

    const blacklisted = await BlacklistedToken.findOne({ tokenHash: hash })
    if (blacklisted) {
      res.clearCookie('refreshToken', { path: '/api/auth' })
      return res.status(401).json({ error: 'Token revoked.' })
    }

    try {
      const r = await redis.get(`bl_${hash}`)
      if (r) {
        res.clearCookie('refreshToken', { path: '/api/auth' })
        return res.status(401).json({ error: 'Token revoked.' })
      }
    } catch (e) {}

    let decoded
    try {
      decoded = jwt.verify(token, process.env.REFRESH_SECRET)
    } catch (e) {
      await BlacklistedToken.create({ tokenHash: hash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
      res.clearCookie('refreshToken', { path: '/api/auth' })
      return res.status(401).json({ error: 'Invalid refresh token.' })
    }

    await BlacklistedToken.create({ tokenHash: hash, expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) })
    try { await redis.setex(`bl_${hash}`, 7 * 24 * 60 * 60, '1') } catch (e) {}

    const user = await User.findById(decoded.id)
    if (!user) return res.status(401).json({ error: 'User not found.' })

    const newAccessToken = signToken(user._id)
    const newRefreshToken = signRefreshToken(user._id)
    setRefreshCookie(res, newRefreshToken)

    res.json({ accessToken: newAccessToken })
  } catch (error) {
    console.error('Refresh error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const getMe = async (req, res) => {
  res.json({ user: req.user })
}

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query
    if (!token) return res.status(400).json({ error: 'Token required.' })

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({ emailVerificationToken: hashed, emailVerificationExpires: { $gt: Date.now() } })
    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' })

    user.isEmailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save({ validateBeforeSave: false })

    res.json({ message: 'Email verified.' })
  } catch (error) {
    console.error('Verify email error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email required.' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (user) {
      const resetToken = user.generatePasswordResetToken()
      await user.save({ validateBeforeSave: false })
      try { await sendPasswordResetEmail(user.email, resetToken) } catch (e) { console.error('Email failed:', e.message) }
    }

    res.json({ message: 'If that email exists, a reset link was sent.' })
  } catch (error) {
    console.error('Forgot password error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body
    if (!token || !password) return res.status(400).json({ error: 'Token and password required.' })
    if (password.length < 8) return res.status(400).json({ error: 'Password min 8 chars.' })

    const hashed = crypto.createHash('sha256').update(token).digest('hex')
    const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } })
    if (!user) return res.status(400).json({ error: 'Invalid or expired token.' })

    user.password = password
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()

    res.json({ message: 'Password reset successfully.' })
  } catch (error) {
    console.error('Reset password error:', error)
    res.status(500).json({ error: 'Server error.' })
  }
}

module.exports = { register, login, logout, refresh, getMe, verifyEmail, forgotPassword, resetPassword }
