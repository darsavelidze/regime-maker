const BASE = '/api'

// Deduplicate identical concurrent GET requests
const _inflight = new Map()

export async function get(path) {
  if (_inflight.has(path)) return _inflight.get(path)
  const p = fetch(`${BASE}${path}`).then(async res => {
    const data = await res.json()
    _inflight.delete(path)
    if (!res.ok) throw new Error(data.detail || 'Ошибка сервера')
    if (data.error) throw new Error(data.error)
    return data
  }).catch(err => { _inflight.delete(path); throw err })
  _inflight.set(path, p)
  return p
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
