import {
  DEFAULT_SETTINGS,
  PMCPluginSetting,
  PMCPluginSettingType,
} from "components/setting";
import { Notice, Plugin } from "obsidian";
import { EditorEventSuggestion } from "components/event-suggestion";
import { TokenManager } from "components/tabs/google/token-manager";
import { TokenExchangeService } from "components/tabs/google/token-exchange";
import { GOOGLE_OAUTH_CALLBACK_URL } from "components/tabs/google/types";
import { TokenExpiryOption } from "components/tabs/google/types";

export default class PMCPlugin extends Plugin {
  settings: PMCPluginSettingType;
  settingTab: PMCPluginSetting | null = null;
  editorSuggestion: EditorEventSuggestion | null = null;

  async onload() {
    await this.loadSettings();

    //register settings tab
    this.settingTab = new PMCPluginSetting(this.app, this);
    this.addSettingTab(this.settingTab);

    //google oauth callback handler
    this.registerObsidianProtocolHandler("pick-meeting-token", async (data) => {
      const code = data.code;
      const token = data.access_token; // Fallback for old implicit flow

      if (code) {
        // New authorization code flow
        try {
          const tokenResponse = await TokenExchangeService.exchangeCodeForTokens(
            this.settings.clientId,
            code,
            GOOGLE_OAUTH_CALLBACK_URL
          );

          // Store both access and refresh tokens
          this.settings.accessToken = tokenResponse.access_token;
          this.settings.refreshToken = tokenResponse.refresh_token || "";

          // Calculate and store token expiry date
          const expiryOption = (this.settings.tokenExpiry ||
            "unlimited") as TokenExpiryOption;
          this.settings.tokenExpiryDate =
            TokenManager.calculateExpiryDate(expiryOption);

          await this.saveSettings();
          this.settingTab?.display();
          new Notice("Google calendar connected with refresh token");
        } catch (error) {
          console.error("Failed to exchange authorization code:", error);
          new Notice("Failed to complete authentication");
        }
      } else if (token) {
        // Fallback for old implicit flow (no refresh token)
        try {
          this.settings.accessToken = token;
          this.settings.refreshToken = ""; // No refresh token in implicit flow

          const expiryOption = (this.settings.tokenExpiry ||
            "unlimited") as TokenExpiryOption;
          this.settings.tokenExpiryDate =
            TokenManager.calculateExpiryDate(expiryOption);

          await this.saveSettings();
          this.settingTab?.display();
          new Notice("Google calendar connected (no refresh token - please reconnect for auto-refresh)");
        } catch (error) {
          console.error("Failed to save access token:", error);
          new Notice("Failed to secure access token");
        }
      } else {
        new Notice(
          `Connection failed: ${data.error || "No authorization code or token found"}`,
        );
      }
    });

    //register editor suggestion
    this.editorSuggestion = new EditorEventSuggestion(this.app, this);
    this.registerEditorSuggest(this.editorSuggestion);
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
