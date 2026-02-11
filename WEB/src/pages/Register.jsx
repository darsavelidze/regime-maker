import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { post } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const nav = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await post('/sign_up/', { username, password })
      login(username, password)
      nav('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <span className="logo">RegimeMaker</span>
        <form onSubmit={submit}>
          <input className="input" placeholder="Имя пользователя" value={username}
            onChange={e => setUsername(e.target.value)} required />
          <input className="input" type="password" placeholder="Пароль" value={password}
            onChange={e => setPassword(e.target.value)} required />
          <button className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="auth-switch">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </div>
    </div>
  )
}
