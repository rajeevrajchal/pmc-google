import { CryptoUtil } from "./tabs/google/crypto-util";
import { PMCPluginSettingType } from "./setting";

/**
 * Type for encrypted field keys
 */
type EncryptedFieldKey = "clientId" | "accessToken";

/**
 * Utility class for encrypting and decrypting plugin settings
 * Provides field-level encryption for sensitive data in data.json
 */
export class SettingsEncryption {
  /**
   * List of sensitive fields that should be encrypted
   */
  private static readonly ENCRYPTED_FIELDS: EncryptedFieldKey[] = [
    "clientId",
    "accessToken",
  ];

  /**
   * Marker to identify encrypted values
   * This helps distinguish between encrypted and plain text values
   */
  private static readonly ENCRYPTION_PREFIX = "enc:";

  /**
   * Encrypt sensitive fields in settings before saving
   * @param settings - The settings object to encrypt
   * @param vaultId - Unique identifier for the vault (typically the vault name)
   * @returns Settings object with encrypted sensitive fields
   */
  static async encryptSettings(
    settings: PMCPluginSettingType,
    vaultId: string,
  ): Promise<PMCPluginSettingType> {
    const encrypted = { ...settings };

    for (const field of this.ENCRYPTED_FIELDS) {
      const value = encrypted[field];

      // Only encrypt if value exists and is not already encrypted
      if (value && typeof value === "string" && value.length > 0) {
        if (!this.isEncrypted(value)) {
          try {
            const encryptedValue = await CryptoUtil.encrypt(value, vaultId);
            encrypted[field] = this.ENCRYPTION_PREFIX + encryptedValue;
          } catch (error) {
            console.error(`Failed to encrypt field ${String(field)}:`, error);
            // Keep original value if encryption fails
          }
        }
      }
    }

    return encrypted;
  }

  /**
   * Decrypt sensitive fields in settings after loading
   * @param settings - The settings object to decrypt
   * @param vaultId - Unique identifier for the vault (must match the one used for encryption)
   * @returns Settings object with decrypted sensitive fields
   */
  static async decryptSettings(
    settings: PMCPluginSettingType,
    vaultId: string,
  ): Promise<PMCPluginSettingType> {
    const decrypted = { ...settings };

    for (const field of this.ENCRYPTED_FIELDS) {
      const value = decrypted[field];

      // Only decrypt if value exists and is encrypted
      if (value && typeof value === "string" && this.isEncrypted(value)) {
        const encryptedValue = value.substring(this.ENCRYPTION_PREFIX.length);
        const decryptedValue = await CryptoUtil.decrypt(
          encryptedValue,
          vaultId,
        );
        decrypted[field] = decryptedValue;
      }
    }

    return decrypted;
  }

  /**
   * Check if a value is encrypted (has the encryption prefix)
   * @param value - The value to check
   * @returns true if the value is encrypted
   */
  private static isEncrypted(value: string): boolean {
    return value.startsWith(this.ENCRYPTION_PREFIX);
  }

  /**
   * Migrate existing unencrypted settings to encrypted format
   * This should be called once during plugin initialization
   * @param settings - The settings object that may have unencrypted values
   * @param vaultId - Unique identifier for the vault (typically the vault name)
   * @returns Migrated settings with encrypted sensitive fields
   */
  static async migrateToEncrypted(
    settings: PMCPluginSettingType,
    vaultId: string,
  ): Promise<{ settings: PMCPluginSettingType; migrated: boolean }> {
    let migrated = false;

    for (const field of this.ENCRYPTED_FIELDS) {
      const value = settings[field];

      // Check if field has a value and is not encrypted
      if (
        value &&
        typeof value === "string" &&
        value.length > 0 &&
        !this.isEncrypted(value)
      ) {
        migrated = true;
        break;
      }
    }

    if (migrated) {
      const encryptedSettings = await this.encryptSettings(settings, vaultId);
      return { settings: encryptedSettings, migrated: true };
    }

    return { settings, migrated: false };
  }
}
