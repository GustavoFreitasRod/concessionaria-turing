import crypto from 'crypto'

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized + '==='.slice((normalized.length + 3) % 4)
  return Buffer.from(padded, 'base64').toString('utf8')
}

function sign(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function createAuthToken(payload, secret, expiresInSeconds = 60 * 60 * 8) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds

  const payloadWithExp = {
    ...payload,
    exp,
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payloadWithExp))
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret)

  return `${encodedHeader}.${encodedPayload}.${signature}`
}

export function verifyAuthToken(token, secret) {
  if (!token || typeof token !== 'string') return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [encodedHeader, encodedPayload, receivedSignature] = parts
  const expectedSignature = sign(`${encodedHeader}.${encodedPayload}`, secret)

  if (receivedSignature !== expectedSignature) return null

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload))
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      return null
    }
    return payload
  } catch {
    return null
  }
}
