import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth()

  return (
    <nav className="navbar">
      <Link to="/"><h1>AuthStack</h1></Link>
      <div className="nav-links">
        <Link to="/about">About</Link>
        {isAuthenticated ? (
          <>
            <span style={{ color: '#fff' }}>{user?.email}</span>
            <Link to="/profile">Profile</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/signup">Signup</Link>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
