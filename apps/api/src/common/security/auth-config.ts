const DEVELOPMENT_AUTH_ENVS = new Set(['development', 'test']);
const DEFAULT_DEVELOPMENT_JWT_SECRET = 'vargani-jwt-secret-key-2024';

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (secret && secret !== DEFAULT_DEVELOPMENT_JWT_SECRET) {
    return secret;
  }

  if (DEVELOPMENT_AUTH_ENVS.has(process.env.NODE_ENV || 'development')) {
    return secret || DEFAULT_DEVELOPMENT_JWT_SECRET;
  }

  throw new Error('JWT_SECRET must be set to a strong, non-default value outside development and test environments.');
}

export function isDevelopmentAuthEnabled(): boolean {
  return DEVELOPMENT_AUTH_ENVS.has(process.env.NODE_ENV || 'development');
}

export function getJwtExpiry(): string {
  return process.env.JWT_EXPIRES_IN || '8h';
}
