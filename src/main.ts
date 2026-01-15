import {
  DEFAULT_SETTINGS,
  PMCPluginSetting,
  PMCPluginSettingType,
} from "components/setting";
import { Notice, Plugin } from "obsidian";
import { EditorEventSuggestion } from "components/event-suggestion";
import { TokenExchangeService } from "components/tabs/google/token-exchange-backend";

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

      if (code) {
        try {
          new Notice("Exchanging code for tokens...");
          
          const tokenResponse = await TokenExchangeService.exchangeCodeForTokens(
            this.settings.clientId,
            code
          );

          this.settings.accessToken = tokenResponse.access_token;
          this.settings.refreshToken = tokenResponse.refresh_token || "";

          const expiresIn = tokenResponse.expires_in || 3600;
          this.settings.tokenExpiryDate = Date.now() + (expiresIn * 1000);

          await this.saveSettings();
          this.settingTab?.display();
          new Notice("Google calendar connected with long-lasting tokens");
        } catch (error) {
          console.error("Failed to exchange code:", error);
          new Notice("Failed to complete authentication");
        }
      } else {
        new Notice("Connection failed: no code received");
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
