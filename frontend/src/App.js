import React from 'react'
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Signup from './components/Signup'
import Login from './components/Login'
import Profile from './components/Profile'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import VerifyEmail from './components/VerifyEmail'
import Welcome from './components/Welcome'
import About from './components/About'
import Footer from './components/Footer'
import './App.css'

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { isAuthenticated, loading } = useAuth()
  return (
    <Route {...rest} render={(props) =>
      loading ? <div className="text-center mt-5"><h3>Loading...</h3></div> :
      isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
    } />
  )
}

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <div className="text-center mt-5"><h3>Loading...</h3></div>

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <Switch>
          <Route exact path="/" component={Welcome} />
          <Route path="/signup" render={(props) => !isAuthenticated ? <Signup {...props} /> : <Redirect to="/profile" />} />
          <Route path="/login" render={(props) => !isAuthenticated ? <Login {...props} /> : <Redirect to="/profile" />} />
          <Route path="/about" component={About} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/verify-email" component={VerifyEmail} />
          <PrivateRoute path="/profile" component={Profile} />
        </Switch>
      </div>
      <Footer />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  )
}

export default App
