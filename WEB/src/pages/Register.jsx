import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { post } from '../api'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'

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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6">
          <div className="text-center mb-8">
            <span className="text-4xl font-black">IN</span>
          </div>
          
          <form onSubmit={submit} className="space-y-4">
            <Input
              placeholder="Имя пользователя"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <Button className="w-full" disabled={loading}>
              {loading ? 'Создание...' : 'Зарегистрироваться'}
            </Button>
          </form>
          
          {error && (
            <p className="text-destructive text-sm text-center mt-4">{error}</p>
          )}
          
          <div className="text-center mt-6 text-sm text-muted-foreground">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Войти
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
