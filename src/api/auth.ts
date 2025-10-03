import bcrypt from 'bcryptjs-react';

const JWT_SECRET = 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = 24 * 60 * 60 * 1000;

export interface TokenPayload {
  user_id: string;
  email: string;
  role: 'user' | 'admin';
  exp: number;
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: Omit<TokenPayload, 'exp'>): string => {
  const tokenData: TokenPayload = {
    ...payload,
    exp: Date.now() + JWT_EXPIRES_IN
  };

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(tokenData));
  const signature = btoa(simpleHash(header + '.' + body + JWT_SECRET));

  return `${header}.${body}.${signature}`;
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const [header, body, signature] = parts;
    const expectedSignature = btoa(simpleHash(header + '.' + body + JWT_SECRET));

    if (signature !== expectedSignature) {
      throw new Error('Invalid token signature');
    }

    const payload: TokenPayload = JSON.parse(atob(body));

    if (payload.exp < Date.now()) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const extractTokenFromHeader = (authHeader: string | null): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
};

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}
