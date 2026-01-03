import { Notice, Setting } from "obsidian";
import {
  GOOGLE_OAUTH_CALLBACK_URL,
  TOKEN_EXPIRY_OPTIONS,
  TokenExpiryOption,
} from "./types";
import { TokenManager } from "./token-manager";

export class GoogleSettingsUI {
  /**
   * Render setup guide with step-by-step instructions
   */
  static renderSetupGuide(containerEl: HTMLElement): void {
    const setupSection = containerEl.createDiv({ cls: "pmc-setup-guide" });
    setupSection.createEl("h4", { text: "📋 Setup Guide" });

    const setupSteps = setupSection.createEl("ol");

    // Step 1: Create Google Cloud Project
    const step1 = setupSteps.createEl("li");
    step1.createEl("strong", { text: "Create a Google Cloud Project:" });
    const step1List = step1.createEl("ul");
    step1List.createEl("li").innerHTML =
      'Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a>';
    step1List.createEl("li", {
      text: 'Click "Select a project" → "New Project"',
    });
    step1List.createEl("li", {
      text: 'Give it a name (e.g., "Obsidian PMC Plugin") and click "Create"',
    });

    // Step 2: Enable Google Calendar API
    const step2 = setupSteps.createEl("li");
    step2.createEl("strong", { text: "Enable Google Calendar API:" });
    const step2List = step2.createEl("ul");
    step2List.createEl("li", {
      text: 'In the sidebar, go to "APIs & Services" → "Library"',
    });
    step2List.createEl("li", { text: 'Search for "Google Calendar API"' });
    step2List.createEl("li", { text: 'Click on it and press "Enable"' });

    // Step 3: Create OAuth Credentials
    const step3 = setupSteps.createEl("li");
    step3.createEl("strong", { text: "Create OAuth 2.0 Credentials:" });
    const step3List = step3.createEl("ul");
    step3List.createEl("li", {
      text: 'Go to "APIs & Services" → "Credentials"',
    });
    step3List.createEl("li", {
      text: 'Click "Create Credentials" → "OAuth client ID"',
    });
    step3List.createEl("li", {
      text: "If prompted, configure the OAuth consent screen first",
    });
    step3List.createEl("li", {
      text: 'Select "Web application" as the application type',
    });
    step3List
      .createEl("li", { text: "Add this Authorized redirect URI: " })
      .createEl("code", { text: GOOGLE_OAUTH_CALLBACK_URL });
    step3List.createEl("li", {
      text: 'Click "Create" and copy your Client ID',
    });

    // Step 4: Configure plugin
    const step4 = setupSteps.createEl("li");
    step4.createEl("strong", {
      text: "Paste the Client ID below and click Connect",
    });
  }

  /**
   * Render OAuth callback URL setting
   */
  static renderCallbackUrlSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("OAuth Callback URL")
      .setDesc("Use this URL when configuring your Google OAuth application")
      .addText((text) =>
        text.setValue(GOOGLE_OAUTH_CALLBACK_URL).setDisabled(true),
      )
      .addButton((btn) =>
        btn.setButtonText("Copy").onClick(() => {
          navigator.clipboard.writeText(GOOGLE_OAUTH_CALLBACK_URL);
          new Notice("Callback URL copied to clipboard!");
        }),
      );
  }

  /**
   * Render Client ID input setting
   */
  static renderClientIdSetting(
    containerEl: HTMLElement,
    currentClientId: string,
    onSave: (clientId: string) => Promise<void>,
  ): void {
    new Setting(containerEl)
      .setName("Client ID")
      .setDesc("OAuth 2.0 Client ID from Google Cloud Console")
      .addText((text) =>
        text
          .setPlaceholder("123456789-abcdefg.apps.googleusercontent.com")
          .setValue(currentClientId)
          .onChange(async (value) => {
            await onSave(value.trim());
          }),
      );
  }

  /**
   * Render token expiry dropdown setting
   */
  static renderTokenExpirySetting(
    containerEl: HTMLElement,
    currentExpiry: TokenExpiryOption,
    onSave: (expiry: TokenExpiryOption) => Promise<void>,
  ): void {
    new Setting(containerEl)
      .setName("Token Expiry")
      .setDesc(
        "How long before the access token expires and requires re-authentication",
      )
      .addDropdown((dropdown) => {
        Object.entries(TOKEN_EXPIRY_OPTIONS).forEach(([key, label]) => {
          dropdown.addOption(key, label);
        });

        dropdown.setValue(currentExpiry).onChange(async (value) => {
          await onSave(value as TokenExpiryOption);
        });
      });
  }

  /**
   * Render token status information
   */
  static renderTokenStatus(
    containerEl: HTMLElement,
    expiryDate: number | undefined,
  ): void {
    const timeRemaining = TokenManager.getTimeRemaining(expiryDate);
    const isExpired = TokenManager.isTokenExpired(expiryDate);
    const needsRefresh = TokenManager.needsRefreshSoon(expiryDate);

    let statusText: string;
    
    if (!expiryDate) {
      // Unlimited token
      statusText = "✅ Token valid: Unlimited";
    } else if (isExpired) {
      statusText = "⚠️ Token expired";
    } else if (needsRefresh) {
      statusText = `⚠️ Token expires in ${timeRemaining}`;
    } else {
      statusText = `✅ Token valid for ${timeRemaining}`;
    }

    new Setting(containerEl).setName("Token Status").setDesc(statusText);
  }

  /**
   * Render account connection setting with buttons
   */
  static renderAccountSetting(
    containerEl: HTMLElement,
    isConnected: boolean,
    clientId: string,
    onConnect: () => void,
    onDisconnect: () => Promise<void>,
    onSync: () => Promise<void>,
  ): void {
    console.log("is connected:", isConnected);

    const accountSetting = new Setting(containerEl)
      .setName("Account")
      .setDesc(isConnected ? "✅ Connected" : "❌ Not Connected");

    if (isConnected) {
      // Sync Calendar button
      accountSetting.addButton((btn) =>
        btn.setButtonText("Sync Calendar").onClick(async () => {
          await onSync();
        }),
      );

      // Disconnect button
      accountSetting.addButton((btn) =>
        btn
          .setWarning()
          .setButtonText("Disconnect")
          .onClick(async () => {
            await onDisconnect();
          }),
      );
    } else {
      // Show warning if no Client ID
      if (!clientId || clientId === "") {
        accountSetting.setDesc("⚠️ Please set Client ID first");
      } else {
        // Connect button
        accountSetting.addButton((btn) =>
          btn
            .setCta()
            .setButtonText("Connect to Google")
            .onClick(() => {
              onConnect();
            }),
        );
      }
    }
  }
}
