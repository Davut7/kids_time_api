import { hash, verify } from 'argon2';

export async function generateHash(password: string) {
  const hashedPassword = await hash(password);
  return hashedPassword;
}

export async function verifyHash(password: string, hash: string) {
  return await verify(hash, password);
}
