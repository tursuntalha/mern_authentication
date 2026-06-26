import React from 'react'
import { useAuth } from '../context/AuthContext'

const Profile = () => {
  const { user } = useAuth()

  if (!user) return <div className="text-center mt-5"><h3>Loading...</h3></div>

  return (
    <div className="row mt-4">
      <div className="col-md-7 offset-md-3">
        <div className="card">
          <h2>Profile</h2>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          <p><strong>Email Verified:</strong> {user.isEmailVerified ? '✓ Yes' : '✗ No'}</p>
          <p><strong>Account created:</strong> {new Date(user.date || user.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )
}

export default Profile
