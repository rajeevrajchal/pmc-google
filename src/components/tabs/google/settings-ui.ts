import { Notice, Setting } from "obsidian";
import {
  GOOGLE_OAUTH_CALLBACK_URL,
  TOKEN_EXPIRY_OPTIONS,
  TokenExpiryOption,
} from "./types";
import { TokenManager } from "./token-manager";

export class GoogleSettingsUI {
  /**
   * Render OAuth callback URL setting
   */
  static renderCallbackUrlSetting(containerEl: HTMLElement): void {
    new Setting(containerEl)
      .setName("Callback url")
      .setDesc("Use this url when configuring your google oauth application.")
      .addText((text) =>
        text.setValue(GOOGLE_OAUTH_CALLBACK_URL).setDisabled(true),
      )
      .addButton((btn) =>
        btn.setButtonText("Copy").onClick(async () => {
          await navigator.clipboard.writeText(GOOGLE_OAUTH_CALLBACK_URL);
          new Notice("Callback URL copied to clipboard.");
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
    // Client ID is now automatically decrypted by SettingsEncryption
    // We can use it directly without manual encryption/decryption
    new Setting(containerEl).setName("Client ID").addText((text) =>
      text
        .setPlaceholder("123456789-abcdefg.apps.googleusercontent.com")
        .setValue(currentClientId)
        .onChange(async (value) => {
          const trimmedValue = value.trim();
          // No need to encrypt - SettingsEncryption handles this automatically
          await onSave(trimmedValue);
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
      .setName("Token expiry")
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
      statusText = "Token valid: unlimited";
    } else if (isExpired) {
      statusText = "Token expired";
    } else if (needsRefresh) {
      statusText = `Token expires in ${timeRemaining}`;
    } else {
      statusText = `Token valid for ${timeRemaining}`;
    }

    new Setting(containerEl).setName("Token status").setDesc(statusText);
  }

  /**
   * Render account connection setting with buttons
   */
  static renderAccountSetting(
    containerEl: HTMLElement,
    isConnected: boolean,
    clientId: string,
    onConnect: (clientId: string) => void,
    onDisconnect: () => Promise<void>,
    onSync: () => Promise<void>,
  ): void {
    const accountSetting = new Setting(containerEl)
      .setName("Account")
      .setDesc(isConnected ? "Connected" : "Not connected");

    if (isConnected) {
      // Sync Calendar button
      accountSetting.addButton((btn) =>
        btn.setButtonText("Sync calendar").onClick(async () => {
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
        accountSetting.setDesc("Please set client ID first");
      } else {
        // Connect button - client ID is already decrypted by SettingsEncryption
        accountSetting.addButton((btn) =>
          btn
            .setCta()
            .setButtonText("Connect to google")
            .onClick(() => {
              onConnect(clientId);
            }),
        );
      }
    }
  }
}
