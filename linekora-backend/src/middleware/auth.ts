import type { Request, Response, NextFunction } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';

/**
 * Firebase ID token verification.
 *
 * Verifies the `Authorization: Bearer <token>` header as a Firebase ID token
 * against Firebase's public signing keys (JWKS). No service-account secret is
 * required — only the public Firebase project ID.
 */
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'linekora-7dd3e';

const jwks = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

export interface AuthUser {
  uid: string;
  email?: string | null;
  name?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** DB user record of the authenticated caller (attached after requireAuth). */
      dbUser?: {
        id: string;
        role: string | null;
        firebaseUid: string | null;
        displayName: string | null;
      } | null;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: missing Bearer token' });
  }
  const token = header.slice('Bearer '.length);
  try {
    const { payload } = await jwtVerify(token, jwks, {
      issuer: `https://securetoken.google.com/${PROJECT_ID}`,
      audience: PROJECT_ID,
    });
    if (!payload.sub) {
      throw new Error('Token has no subject (sub)');
    }
    req.user = {
      uid: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      name: typeof payload.name === 'string' ? payload.name : null,
    };
    next();
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    return res.status(401).json({ error: 'Unauthorized: invalid or expired token' });
  }
}