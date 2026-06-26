const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const Schema = mongoose.Schema

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  date: { type: Date, default: Date.now },
})

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

UserSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now()
}

UserSchema.methods.incrementLoginAttempts = async function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } })
  }
  const updates = { $inc: { loginAttempts: 1 } }
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 15 * 60 * 1000 }
  }
  return this.updateOne(updates)
}

UserSchema.methods.generateEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString('hex')
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex')
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000
  return token
}

UserSchema.methods.generatePasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex')
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex')
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000
  return token
}

module.exports = mongoose.model('User', UserSchema)
