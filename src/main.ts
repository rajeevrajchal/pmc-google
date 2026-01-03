import {
  DEFAULT_SETTINGS,
  PMCPluginSetting,
  PMCPluginSettingType,
} from "components/setting";
import { Notice, Plugin } from "obsidian";
import "./style.css";
import { EditorEventSuggestion } from "components/event-suggestion";
import { TokenManager } from "components/tabs/google/token-manager";
import { TokenExpiryOption } from "components/tabs/google/types";
import { TokenEncryption } from "components/tabs/google/encryption";
import { GoogleAuth } from "components/tabs/google/auth";

export default class PMCPlugin extends Plugin {
  settings: PMCPluginSettingType;
  settingTab: PMCPluginSetting | null = null;
  editorSuggestion: EditorEventSuggestion | null = null;

  async onload() {
    await this.loadSettings();

    //register settings tab
    this.settingTab = new PMCPluginSetting(this.app, this);
    this.addSettingTab(this.settingTab);

    //google oauth callback handler - now handles authorization code
    this.registerObsidianProtocolHandler("pick-meeting-token", async (data) => {
      // New flow: authorization code
      if (data.code) {
        try {
          if (!this.settings.clientSecret) {
            new Notice("❌ Client secret not configured. Please add it in settings.");
            return;
          }

          new Notice("Exchanging authorization code for tokens...");

          const tokens = await GoogleAuth.exchangeCodeForTokens(
            data.code,
            this.settings.clientId,
            this.settings.clientSecret
          );

          // Store tokens (will be encrypted in saveSettings)
          this.settings.accessToken = tokens.accessToken;
          this.settings.refreshToken = tokens.refreshToken;
          this.settings.accessTokenExpiresAt = Date.now() + (tokens.expiresIn * 1000);

          // Calculate and store token expiry date based on user settings
          const expiryOption = (this.settings.tokenExpiry ||
            "1week") as TokenExpiryOption;
          this.settings.tokenExpiryDate =
            TokenManager.calculateExpiryDate(expiryOption);

          await this.saveSettings();
          this.settingTab?.display();
          new Notice("✅ Google Calendar connected!");
        } catch (error) {
          console.error("Token exchange failed:", error);
          new Notice(`❌ Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }
      // Legacy flow: direct access token (for backwards compatibility)
      else if (data.access_token) {
        this.settings.accessToken = data.access_token;

        // Calculate and store token expiry date based on user settings
        const expiryOption = (this.settings.tokenExpiry ||
          "1week") as TokenExpiryOption;
        this.settings.tokenExpiryDate =
          TokenManager.calculateExpiryDate(expiryOption);

        await this.saveSettings();
        this.settingTab?.display();
        new Notice("✅ Google Calendar connected! (Legacy mode - consider reconnecting for better security)");
      } else {
        new Notice(
          `❌ Connection failed: ${data.error || "No authorization code or token found"}`,
        );
      }
    });

    //register editor suggestion
    this.editorSuggestion = new EditorEventSuggestion(this.app, this);
    this.registerEditorSuggest(this.editorSuggestion);
  }

  onunload() {}

  async loadSettings() {
    const loadedData = (await this.loadData()) as Partial<PMCPluginSettingType>;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

    // Decrypt tokens if encryption is enabled
    if (this.settings.encryptionEnabled && this.settings.accessToken) {
      try {
        const vaultId = this.getVaultId();
        
        // Check if tokens are encrypted (will fail decrypt if not)
        if (TokenEncryption.isEncrypted(this.settings.accessToken)) {
          this.settings.accessToken = await TokenEncryption.decrypt(
            this.settings.accessToken,
            vaultId
          );
        }

        if (this.settings.refreshToken && TokenEncryption.isEncrypted(this.settings.refreshToken)) {
          this.settings.refreshToken = await TokenEncryption.decrypt(
            this.settings.refreshToken,
            vaultId
          );
        }

        if (this.settings.clientSecret && TokenEncryption.isEncrypted(this.settings.clientSecret)) {
          this.settings.clientSecret = await TokenEncryption.decrypt(
            this.settings.clientSecret,
            vaultId
          );
        }
      } catch (error) {
        console.error("Failed to decrypt tokens:", error);
        new Notice("⚠️ Failed to decrypt tokens. You may need to reconnect.");
        // Clear invalid tokens
        this.settings.accessToken = "";
        this.settings.refreshToken = "";
        this.settings.clientSecret = "";
      }
    }
  }

  async saveSettings() {
    const settingsToSave = { ...this.settings };

    // Encrypt tokens if encryption is enabled
    if (this.settings.encryptionEnabled) {
      try {
        const vaultId = this.getVaultId();

        if (settingsToSave.accessToken) {
          settingsToSave.accessToken = await TokenEncryption.encrypt(
            settingsToSave.accessToken,
            vaultId
          );
        }

        if (settingsToSave.refreshToken) {
          settingsToSave.refreshToken = await TokenEncryption.encrypt(
            settingsToSave.refreshToken,
            vaultId
          );
        }

        if (settingsToSave.clientSecret) {
          settingsToSave.clientSecret = await TokenEncryption.encrypt(
            settingsToSave.clientSecret,
            vaultId
          );
        }
      } catch (error) {
        console.error("Failed to encrypt tokens:", error);
        new Notice("⚠️ Failed to encrypt tokens. Saving unencrypted.");
      }
    }

    await this.saveData(settingsToSave);
  }

  /**
   * Get a unique identifier for the current vault
   * Used as encryption key seed
   */
  private getVaultId(): string {
    // Use vault name and creation time as unique identifier
    return `${this.app.vault.getName()}-${this.app.vault.adapter.getName()}`;
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  async getValidAccessToken(): Promise<string> {
    // Check if access token needs refresh
    if (
      this.settings.refreshToken &&
      this.settings.clientSecret &&
      TokenManager.needsAccessTokenRefresh(this.settings.accessTokenExpiresAt)
    ) {
      try {
        const refreshed = await TokenManager.refreshAccessToken(
          this.settings.refreshToken,
          this.settings.clientId,
          this.settings.clientSecret
        );

        this.settings.accessToken = refreshed.accessToken;
        this.settings.accessTokenExpiresAt = refreshed.expiresAt;
        await this.saveSettings();

        console.log("Access token refreshed successfully");
      } catch (error) {
        console.error("Failed to refresh access token:", error);
        new Notice("⚠️ Failed to refresh access token. Please reconnect in settings.");
        throw error;
      }
    }

    return this.settings.accessToken;
  }
}
