import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import axios from 'axios'

const VerifyEmail = () => {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const token = new URLSearchParams(useLocation().search).get('token')
  const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000'

  useEffect(() => {
    if (!token) {
      setError('No verification token found.')
      setLoading(false)
      return
    }

    axios.get(`${API_URL}/api/users/verify-email?token=${token}`)
      .then(res => {
        setMessage('Email verified successfully! You can now log in.')
        setLoading(false)
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Verification failed.')
        setLoading(false)
      })
  }, [token, API_URL])

  return (
    <div className="row mt-4">
      <div className="col-md-7 offset-md-3">
        <div className="card">
          <h2>Email Verification</h2>
          {loading && <p>Verifying your email...</p>}
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          {message && <Link to="/login" className="btn mt-2">Go to Login</Link>}
        </div>
      </div>
    </div>
  )
}

export default VerifyEmail
