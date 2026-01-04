import {
  DEFAULT_SETTINGS,
  PMCPluginSetting,
  PMCPluginSettingType,
} from "components/setting";
import { Notice, Plugin } from "obsidian";
import { EditorEventSuggestion } from "components/event-suggestion";
import { TokenManager } from "components/tabs/google/token-manager";
import { TokenExpiryOption } from "components/tabs/google/types";
import { SettingsEncryption } from "components/settings-encryption";

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
          // Store the access token (will be encrypted automatically by saveSettings)
          this.settings.accessToken = token;

          // Calculate and store token expiry date based on user settings
          const expiryOption = (this.settings.tokenExpiry ||
            "unlimited") as TokenExpiryOption;
          this.settings.tokenExpiryDate =
            TokenManager.calculateExpiryDate(expiryOption);

          await this.saveSettings();
          this.settingTab?.display();
          new Notice("✅ Google Calendar Connected!");
        } catch (error) {
          console.error("Failed to save access token:", error);
          new Notice("❌ Failed to secure access token");
        }
      } else {
        new Notice(
          `❌ Connection failed: ${data.error || "No token found in response"}`,
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
    const mergedSettings = Object.assign({}, DEFAULT_SETTINGS, loadedData);

    // Decrypt sensitive fields after loading
    this.settings = await SettingsEncryption.decryptSettings(mergedSettings);

    // Migrate existing unencrypted settings to encrypted format
    const { settings: migratedSettings, migrated } =
      await SettingsEncryption.migrateToEncrypted(this.settings);

    if (migrated) {
      this.settings = migratedSettings;
      await this.saveSettings();
    }
  }

  async saveSettings() {
    // Encrypt sensitive fields before saving
    const encryptedSettings = await SettingsEncryption.encryptSettings(
      this.settings,
    );
    await this.saveData(encryptedSettings);
  }
}
