import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Welcome = () => {
  const { isAuthenticated } = useAuth()

  return (
    <div className="text-center mt-5">
      <h1>Welcome to AuthStack</h1>
      <p className="mt-3 mb-3" style={{ fontSize: '1.2rem', color: '#666' }}>
        A deep dive into secure web authentication.
      </p>
      <p>Every security decision comes with a WHY.</p>
      {!isAuthenticated && (
        <div className="mt-4">
          <Link to="/register" className="btn" style={{ marginRight: '1rem' }}>Get Started</Link>
          <Link to="/login" className="btn" style={{ background: '#6c757d' }}>Sign In</Link>
        </div>
      )}
    </div>
  )
}

export default Welcome
