const crypto = require('crypto');

const SECRET = process.env.JWT_SECRET || 'TECHSTORE_APP_SECURE_KEY_2026_!@#$';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored) return false;
  if (stored.includes(':')) {
    const [salt, key] = stored.split(':');
    const keyBuffer = Buffer.from(key, 'hex');
    const derived = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derived);
  }
  return stored === password; // fallback caso haja registros legados
}

function generateToken(user) {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    nome: user.nome,
    tipo: user.tipo,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 dias
  });
  const b64 = Buffer.from(payload).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url');
  return `${b64}.${signature}`;
}

function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [b64, signature] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(b64).digest('base64url');
    if (signature !== expected) return null;
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch (e) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token de autenticação não fornecido.' });
  }
  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ erro: 'Token inválido ou expirado.' });
  }
  req.user = user;
  next();
}

function adminOnly(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user?.tipo !== 'admin') {
      return res.status(403).json({ erro: 'Acesso restrito. Permissões de administrador necessárias.' });
    }
    next();
  });
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authMiddleware,
  adminOnly
};

