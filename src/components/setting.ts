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

export interface PMCPluginSettingType extends GoogleCalendarSettings {}

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
    containerEl.createEl("h2", { text: "Pick Google Calendar Event" });
    
    const introSection = containerEl.createDiv({ cls: "pmc-intro-section" });
    introSection.style.marginBottom = "20px";
    introSection.style.padding = "15px";
    introSection.style.background = "var(--background-secondary)";
    introSection.style.borderRadius = "8px";
    
    introSection.createEl("h4", { text: "How to Use" });
    const usageList = introSection.createEl("ul");
    usageList.style.marginLeft = "20px";
    
    const item1 = usageList.createEl("li");
    item1.innerHTML = "Type <code>:</code> in your note to trigger the calendar event picker";
    
    const item2 = usageList.createEl("li");
    item2.innerHTML = "Type <code>:meeting</code> to search and filter events containing 'meeting'";
    
    const item3 = usageList.createEl("li");
    item3.innerHTML = "Select an event from the list to insert it as a link in your note";
    
    const item4 = usageList.createEl("li");
    item4.innerHTML = "Choose <strong>+ Create new event</strong> to create a new calendar event";
    
    containerEl.createEl("h3", { text: "Setup & Configuration" });

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
      .setName("Suggestion Time Range")
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
      () => {
        // On Connect
        GoogleAuth.initiateOAuthFlow(this.plugin.settings.clientId);
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
