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
      const token = data.access_token;

      if (token) {
        try {
          // Store access token (implicit flow - no refresh token available)
          this.settings.accessToken = token;
          this.settings.refreshToken = ""; // Clear any old refresh token

          // Set expiry based on expires_in or user setting
          const expiresIn = data.expires_in ? parseInt(data.expires_in) : 3600;
          this.settings.tokenExpiryDate = Date.now() + (expiresIn * 1000);

          await this.saveSettings();
          this.settingTab?.display();
          new Notice("Google calendar connected (tokens expire in 1 hour - will need manual reconnection)");
        } catch (error) {
          console.error("Failed to save access token:", error);
          new Notice("Failed to secure access token");
        }
      } else {
        new Notice(
          `Connection failed: ${data.error || "No token found in response"}`,
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
