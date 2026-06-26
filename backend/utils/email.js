const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

const sendEmail = async ({ to, subject, html }) => {
  return transporter.sendMail({
    from: `"AuthStack" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
    to, subject, html,
  })
}

const sendVerificationEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/verify-email?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Verify your email - AuthStack',
    html: `<h1>Email Verification</h1><p>Click <a href="${url}">here</a> to verify. Link expires in 24h.</p>`,
  })
}

const sendPasswordResetEmail = async (email, token) => {
  const url = `${process.env.CLIENT_URL}/reset-password?token=${token}`
  return sendEmail({
    to: email,
    subject: 'Password Reset - AuthStack',
    html: `<h1>Password Reset</h1><p>Click <a href="${url}">here</a> to reset. Link expires in 1h.</p>`,
  })
}

module.exports = { sendVerificationEmail, sendPasswordResetEmail }
