const BASE = '/api'

export async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Ошибка сервера')
  if (data.error) throw new Error(data.error)
  return data
}

export async function post(path, body = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Ошибка сервера')
  if (data.error) throw new Error(data.error)
  return data
}

export function auth(user, extra = {}) {
  return { user: user.username, password: user.password, ...extra }
}
