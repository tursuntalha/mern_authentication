require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const passport = require('passport')
const connectDB = require('./config/db')
const { apiLimiter } = require('./middleware/rateLimiter')

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(passport.initialize())

require('./config/passport')(passport)

app.get('/', (req, res) => {
  res.json({ message: 'AuthStack API - Secure Authentication', version: '1.0.0' })
})

app.use('/api/users', apiLimiter, require('./routes/api/users'))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

connectDB()

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
  console.log(`AuthStack API running on port ${PORT}`)
})
