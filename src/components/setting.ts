import PMCPlugin from "main";
import { App, PluginSettingTab, Setting } from "obsidian";
import {
  GoogleCalendarSettings,
  DEFAULT_GOOGLE_SETTINGS,
  TokenExpiryOption,
} from "./tabs/google/types";
import { GoogleAuth } from "./tabs/google/auth";
import { GoogleCalendarAPI } from "./tabs/google/calendar-api";
import { GoogleSettingsUI } from "./tabs/google/settings-ui";
import { TokenManager } from "./tabs/google/token-manager";

export type PMCPluginSettingType = GoogleCalendarSettings;

export const DEFAULT_SETTINGS: PMCPluginSettingType = {
  ...DEFAULT_GOOGLE_SETTINGS,
};

export class PMCPluginSetting extends PluginSettingTab {
  plugin: PMCPlugin;

  constructor(app: App, plugin: PMCPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // Title and description
    new Setting(containerEl).setName("Pick calendar event").setHeading();

    const introSection = containerEl.createDiv({ cls: "pmc-intro-section" });

    new Setting(introSection).setName("How to use").setHeading();
    const usageList = introSection.createEl("ul", { cls: "pmc-usage-list" });

    const item1 = usageList.createEl("li");
    item1.appendText("Type ");
    item1.createEl("code", { text: ":" });
    item1.appendText(" in your note to trigger the calendar event picker");

    const item2 = usageList.createEl("li");
    item2.appendText("Type ");
    item2.createEl("code", { text: ":meeting" });
    item2.appendText(" to search and filter events containing 'meeting'");

    const item3 = usageList.createEl("li");
    item3.appendText(
      "Select an event from the list to insert it as a link in your note",
    );

    const item4 = usageList.createEl("li");
    item4.appendText("Choose ");
    item4.createEl("strong", { text: "+ Create new event" });
    item4.appendText(" to create a new calendar event");

    new Setting(containerEl).setName("Setup and configuration").setHeading();

    // Render setup guide
    GoogleSettingsUI.renderSetupGuide(containerEl);
    // Render OAuth callback URL
    GoogleSettingsUI.renderCallbackUrlSetting(containerEl);
    // Render Client ID input
    GoogleSettingsUI.renderClientIdSetting(
      containerEl,
      this.plugin.settings.clientId,
      async (clientId: string) => {
        this.plugin.settings.clientId = clientId;
        await this.plugin.saveSettings();
        this.display();
      },
    );

    // Render Token Expiry setting
    GoogleSettingsUI.renderTokenExpirySetting(
      containerEl,
      this.plugin.settings.tokenExpiry as TokenExpiryOption,
      async (expiry: TokenExpiryOption) => {
        this.plugin.settings.tokenExpiry = expiry;
        this.plugin.settings.tokenExpiryDate =
          TokenManager.calculateExpiryDate(expiry);
        await this.plugin.saveSettings();
        this.display();
      },
    );

    //suggestion time range setting
    new Setting(containerEl)
      .setName("Suggestion time range")
      .setDesc(
        'Time duration to fetch calendar events for suggestions (e.g., "90 days"). Events from this many days in the past and future will be considered.',
      )
      .addText((text) =>
        text
          .setPlaceholder("90 days")
          .setValue(String(this.plugin.settings.timeRange)) // Ensure your settings object has this key
          .onChange(async (value) => {
            this.plugin.settings.timeRange = Number(value);
            await this.plugin.saveSettings();
          }),
      );

    // Render token status if connected
    if (this.plugin.settings.accessToken) {
      GoogleSettingsUI.renderTokenStatus(
        containerEl,
        this.plugin.settings.tokenExpiryDate,
      );
    }

    // Render account connection section
    GoogleSettingsUI.renderAccountSetting(
      containerEl,
      !!this.plugin.settings.accessToken,
      this.plugin.settings.clientId,
      (decryptedClientId: string) => {
        // On Connect - receives already decrypted client ID from renderAccountSetting
        GoogleAuth.initiateOAuthFlow(decryptedClientId);
      },
      async () => {
        this.plugin.settings.accessToken = "";
        this.plugin.settings.tokenExpiryDate = undefined;
        await this.plugin.saveSettings();
        this.display();
        GoogleAuth.disconnect();
      },
      async () => {
        await GoogleCalendarAPI.syncCalendar(
          this.plugin.settings.accessToken,
          this.plugin.settings.tokenExpiryDate,
        );
      },
    );
  }
}
