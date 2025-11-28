import { EncryptionUtil } from '../../src/utils/encryption.util';

describe('EncryptionUtil', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await EncryptionUtil.hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await EncryptionUtil.hashPassword(password);
      const hash2 = await EncryptionUtil.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await EncryptionUtil.hashPassword(password);
      const isMatch = await EncryptionUtil.comparePassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await EncryptionUtil.hashPassword(password);
      const isMatch = await EncryptionUtil.comparePassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });
  });
});
