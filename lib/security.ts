import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_KEY || 'equiwings-default-secret-key-256';

export const SecurityService = {
  encrypt: (data: any): string => {
    try {
      const ciphertext = CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
      return ciphertext;
    } catch (error) {
      console.error('Encryption failed:', error);
      return '';
    }
  },

  decrypt: (ciphertext: string): any => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
      const decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return decryptedData;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }
};
