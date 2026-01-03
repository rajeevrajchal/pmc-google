/**
 * Encryption utility for securing sensitive data like Client ID and Access Tokens
 * Uses Web Crypto API with AES-GCM encryption
 */

export class CryptoUtil {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly SALT_LENGTH = 16;

  /**
   * Generate a deterministic key from a passphrase using PBKDF2
   * The passphrase is derived from the vault path to be unique per vault
   */
  private static async deriveKey(
    passphrase: string,
    salt: Uint8Array,
  ): Promise<CryptoKey> {
    // Import the passphrase as a key
    const encoder = new TextEncoder();
    const passphraseKey = await crypto.subtle.importKey(
      "raw",
      encoder.encode(passphrase),
      { name: "PBKDF2" },
      false,
      ["deriveKey"],
    );

    // Derive a key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt as BufferSource,
        iterations: 100000,
        hash: "SHA-256",
      },
      passphraseKey,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ["encrypt", "decrypt"],
    );

    return derivedKey;
  }

  /**
   * Generate a vault-specific passphrase
   * This creates a unique passphrase for each Obsidian vault
   */
  private static getVaultPassphrase(): string {
    // Use a combination of vault identifier and a static secret
    // In production, you might want to use app.vault.adapter.basePath or similar
    const vaultId = window.location.pathname || "obsidian-vault";
    const staticSecret = "pmc-plugin-secret-v1"; // Static component
    return `${vaultId}-${staticSecret}`;
  }

  /**
   * Encrypt a string value
   * @param plaintext - The plain text to encrypt
   * @returns Base64 encoded encrypted string with salt and IV prepended
   */
  static async encrypt(plaintext: string): Promise<string> {
    if (!plaintext) {
      return "";
    }

    try {
      // Generate random salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Derive encryption key
      const passphrase = this.getVaultPassphrase();
      const key = await this.deriveKey(passphrase, salt);

      // Encrypt the plaintext
      const encoder = new TextEncoder();
      const encodedText = encoder.encode(plaintext);

      const encryptedData = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        encodedText,
      );

      // Combine salt + iv + encrypted data
      const combined = new Uint8Array(
        salt.length + iv.length + encryptedData.byteLength,
      );
      combined.set(salt, 0);
      combined.set(iv, salt.length);
      combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

      // Convert to base64 for storage
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error("Encryption error:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  /**
   * Decrypt an encrypted string
   * @param encryptedText - Base64 encoded encrypted string with salt and IV
   * @returns Decrypted plain text
   */
  static async decrypt(encryptedText: string): Promise<string> {
    if (!encryptedText) {
      return "";
    }

    try {
      // Convert from base64
      const combined = this.base64ToArrayBuffer(encryptedText);

      // Extract salt, IV, and encrypted data
      const salt = combined.slice(0, this.SALT_LENGTH);
      const iv = combined.slice(
        this.SALT_LENGTH,
        this.SALT_LENGTH + this.IV_LENGTH,
      );
      const encryptedData = combined.slice(this.SALT_LENGTH + this.IV_LENGTH);

      // Derive decryption key
      const passphrase = this.getVaultPassphrase();
      const key = await this.deriveKey(passphrase, salt);

      // Decrypt the data
      const decryptedData = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        key,
        encryptedData,
      );

      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (error) {
      console.error("Decryption error:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private static arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = "";
    const len = buffer.byteLength;
    for (let i = 0; i < len; i++) {
      const byte = buffer[i];
      if (byte !== undefined) {
        binary += String.fromCharCode(byte);
      }
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to Uint8Array
   */
  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Check if a string appears to be encrypted (base64 format with sufficient length)
   */
  static isEncrypted(value: string): boolean {
    if (!value) return false;

    // Check if it's base64 and has minimum length for salt + iv + some data
    const minLength = Math.ceil(((this.SALT_LENGTH + this.IV_LENGTH + 16) * 4) / 3);
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;

    return value.length >= minLength && base64Regex.test(value);
  }
}
