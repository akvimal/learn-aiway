import bcrypt from 'bcrypt';
import { env } from '../config/env.config';

export class EncryptionUtil {
  static async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(env.BCRYPT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
