import React, { useState } from 'react'
import axios from 'axios'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const res = await axios.post(`${API_URL}/api/users/forgot-password`, { email })
      setMessage(res.data.message)
    } catch (err) {
      setError(err.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="row mt-4">
      <div className="col-md-7 offset-md-3">
        <div className="card">
          <h2>Forgot Password</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
