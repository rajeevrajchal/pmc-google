import {
  DEFAULT_SETTINGS,
  PMCPluginSetting,
  PMCPluginSettingType,
} from "components/setting";
import { Notice, Plugin } from "obsidian";
import "./style.css";
import { EditorEventSuggestion } from "components/event-suggestion";
import { DonationModal } from "components/donate-modal";

export default class PMCPlugin extends Plugin {
  settings: PMCPluginSettingType;
  settingTab: PMCPluginSetting | null = null;
  editorSuggestion: EditorEventSuggestion | null = null;

  async onload() {
    await this.loadSettings();

    //register settings tab
    this.settingTab = new PMCPluginSetting(this.app, this);
    this.addSettingTab(this.settingTab);

    // Add donate tab ❤️
    this.addRibbonIcon(
      "heart",
      "Support Plugin Development",
      (evt: MouseEvent) => {
        new DonationModal(this.app).open();
      },
    );

    //google oauth callback handler
    this.registerObsidianProtocolHandler("pick-meeting-token", async (data) => {
      const token = data.access_token;

      if (token) {
        this.settings.accessToken = token;
        await this.saveSettings();
        this.settingTab?.display();
        new Notice("✅ Google Calendar Connected!");
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
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<PMCPluginSettingType>,
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
