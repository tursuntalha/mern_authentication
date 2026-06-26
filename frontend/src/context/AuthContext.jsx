import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext()

const API_URL = process.env.REACT_APP_SERVER_URL || 'http://localhost:8000'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [accessToken, setAccessToken] = useState(null)
  const [loading, setLoading] = useState(true)

  const storeUser = useCallback((userData, token) => {
    setUser(userData)
    setAccessToken(token)
  }, [])

  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_URL}/api/users/logout`, {}, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        withCredentials: true,
      })
    } catch (e) {}
    setUser(null)
    setAccessToken(null)
  }, [accessToken])

  const refreshToken = useCallback(async () => {
    try {
      const res = await axios.post(`${API_URL}/api/users/refresh`, {}, { withCredentials: true })
      const newToken = res.data.accessToken
      setAccessToken(newToken)
      const userRes = await axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${newToken}` },
        withCredentials: true,
      })
      setUser(userRes.data.user)
      return newToken
    } catch (e) {
      setUser(null)
      setAccessToken(null)
      return null
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      const urlToken = new URLSearchParams(window.location.search).get('token')
      if (urlToken) {
        try {
          const res = await axios.get(`${API_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${urlToken}` },
            withCredentials: true,
          })
          storeUser(res.data.user, urlToken)
          window.history.replaceState({}, document.title, window.location.pathname)
          setLoading(false)
          return
        } catch (e) {}
      }

      const token = await refreshToken()
      if (!token) setLoading(false)
      else setLoading(false)
    }
    init()
  }, [storeUser, refreshToken])

  const value = { user, accessToken, loading, isAuthenticated: !!user, storeUser, logout, refreshToken, API_URL }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext
