const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'predict-frank-secret';
const TOKEN_EXPIRY_MS = 6 * 60 * 60 * 1000; // 6 hours

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value) {
  value = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = value.length % 4;
  if (padding) {
    value += '='.repeat(4 - padding);
  }
  return Buffer.from(value, 'base64').toString();
}

function signToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const tokenPayload = { ...payload, exp: Math.floor((now + TOKEN_EXPIRY_MS) / 1000) };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  return `${data}.${signature}`;
}

function verifyToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }
  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature.length !== expectedSignature.length) {
    throw new Error('Invalid signature');
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid signature');
  }

  const payloadJson = base64UrlDecode(encodedPayload);
  const payload = JSON.parse(payloadJson);
  if (payload.exp && Date.now() / 1000 > payload.exp) {
    throw new Error('Token expired');
  }
  return payload;
}

function authenticateRequest(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return null;
  }
  const token = header.substring('Bearer '.length);
  try {
    return verifyToken(token);
  } catch (error) {
    return null;
  }
}

module.exports = {
  signToken,
  verifyToken,
  authenticateRequest
};
