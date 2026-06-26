import React, { useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import axios from 'axios'

const ResetPassword = () => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const history = useHistory()
  const token = new URLSearchParams(useLocation().search).get('token')

  const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password min 8 chars'); return }
    setLoading(true)

    try {
      const res = await axios.post(`${API_URL}/api/users/reset-password`, { token, password })
      setMessage(res.data.message)
      setTimeout(() => history.push('/login'), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="row mt-4">
        <div className="col-md-7 offset-md-3">
          <div className="card"><h2>Invalid Link</h2><p>This reset link is invalid or expired.</p></div>
        </div>
      </div>
    )
  }

  return (
    <div className="row mt-4">
      <div className="col-md-7 offset-md-3">
        <div className="card">
          <h2>Reset Password</h2>
          {error && <div className="alert alert-danger">{error}</div>}
          {message && <div className="alert alert-success">{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>New Password (min 8 characters)</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
