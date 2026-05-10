import bcrypt from 'bcryptjs';

export class PasswordUtils {
  private static SALT_ROUNDS = 12; // High cost factor for production security

  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  static async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}