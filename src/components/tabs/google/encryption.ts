/**
 * Token encryption utility
 * 
 * SECURITY NOTE: This provides obfuscation, not true cryptographic security.
 * - The encryption key is derived from vault-specific data
 * - Any plugin running in the same Obsidian instance could theoretically access this
 * - This protects against casual file reading and vault sharing
 * - For true security, tokens should be stored in OS keychain (not available in Obsidian API)
 */

export class TokenEncryption {
  private static readonly ALGORITHM = "AES-GCM";
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  /**
   * Generate a vault-specific encryption key
   * Uses vault ID and app info to create a deterministic but unique key
   */
  private static async getEncryptionKey(vaultId: string): Promise<CryptoKey> {
    // Create a deterministic seed from vault ID
    const encoder = new TextEncoder();
    const data = encoder.encode(vaultId + "obsidian-pmc-plugin-v1");
    
    // Hash the seed
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    
    // Import as AES-GCM key
    return await crypto.subtle.importKey(
      "raw",
      hashBuffer,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false,
      ["encrypt", "decrypt"]
    );
  }

  /**
   * Encrypt a token
   * @param token - The token to encrypt
   * @param vaultId - Unique identifier for the vault
   * @returns Base64-encoded encrypted token with IV prepended
   */
  static async encrypt(token: string, vaultId: string): Promise<string> {
    if (!token) return "";

    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(token);
      
      // Generate random IV
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
      
      // Get encryption key
      const key = await this.getEncryptionKey(vaultId);
      
      // Encrypt
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        key,
        data
      );
      
      // Combine IV + encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64
      return this.arrayBufferToBase64(combined);
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt token");
    }
  }

  /**
   * Decrypt a token
   * @param encryptedToken - Base64-encoded encrypted token with IV
   * @param vaultId - Unique identifier for the vault
   * @returns Decrypted token
   */
  static async decrypt(encryptedToken: string, vaultId: string): Promise<string> {
    if (!encryptedToken) return "";

    try {
      // Decode base64
      const combined = this.base64ToArrayBuffer(encryptedToken);
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, this.IV_LENGTH);
      const encryptedData = combined.slice(this.IV_LENGTH);
      
      // Get encryption key
      const key = await this.getEncryptionKey(vaultId);
      
      // Decrypt
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        encryptedData
      );
      
      // Convert to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt token");
    }
  }

  /**
   * Check if a string is encrypted (base64 format check)
   */
  static isEncrypted(value: string): boolean {
    if (!value) return false;
    // Check if it's base64 and reasonably long for encrypted data
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    return base64Regex.test(value) && value.length > 50;
  }

  /**
   * Convert ArrayBuffer to base64 string
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
   * Convert base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): Uint8Array {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      const charCode = binary.charCodeAt(i);
      bytes[i] = charCode;
    }
    return bytes;
  }
}
