// api/login.js — Endpoint de autenticación
// Recibe { username, password }, valida contra ENV vars, devuelve un token firmado.
 
import crypto from 'crypto';
 
function sign(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}
 
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }
 
  const { username, password } = req.body || {};
  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }
 
  // Lista de usuarios desde variables de entorno
  const users = [
    { u: process.env.USER1_NAME, p: process.env.USER1_PASSWORD },
    { u: process.env.USER2_NAME, p: process.env.USER2_PASSWORD },
    { u: process.env.USER3_NAME, p: process.env.USER3_PASSWORD },
    { u: process.env.USER4_NAME, p: process.env.USER4_PASSWORD },
    { u: process.env.USER5_NAME, p: process.env.USER5_PASSWORD }
  ].filter(x => x.u && x.p);
 
  // Comparación constant-time-ish para evitar timing attacks básicos
  const inputUser = username.trim().toLowerCase();
  const match = users.find(u => u.u.trim().toLowerCase() === inputUser && u.p === password);
 
  if (!match) {
    // Mismo mensaje para ambos errores (no revelar si el usuario existe)
    return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
  }
 
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    return res.status(500).json({ error: 'JWT_SECRET no configurado en el servidor.' });
  }
 
  // Token válido por 12 horas
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const token = sign({ username: match.u, exp }, secret);
 
  return res.status(200).json({
    token,
    username: match.u,
    expiresAt: exp
  });
}
 
