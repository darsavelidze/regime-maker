import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Explore from './pages/Explore'
import Create from './pages/Create'
import Day from './pages/Day'
import Profile from './pages/Profile'
import UserProfile from './pages/UserProfile'
import Analytics from './pages/Analytics'

function Private({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index element={<Feed />} />
        <Route path="explore" element={<Explore />} />
        <Route path="create" element={<Create />} />
        <Route path="day" element={<Day />} />
        <Route path="profile" element={<Profile />} />
        <Route path="user/:username" element={<UserProfile />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
    </Routes>
  )
}
