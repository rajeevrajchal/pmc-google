/**
 * Google OAuth authentication and connection management
 */

import { Notice } from "obsidian";
import { GOOGLE_OAUTH_CALLBACK_URL } from "./types";

export class GoogleAuth {
  private static readonly OAUTH_URL =
    "https://accounts.google.com/o/oauth2/v2/auth";
  private static readonly SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  /**
   * Initiate OAuth flow
   */
  static initiateOAuthFlow(clientId: string): void {
    if (!clientId || clientId.trim() === "") {
      new Notice("Please configure client ID first");
      return;
    }

    const authUrl = this.buildAuthUrl(clientId);
    new Notice("Opening google authentication in browser");
    window.open(authUrl, "_blank");
  }

  /**
   * Build OAuth URL - authorization code flow for backend
   */
  private static buildAuthUrl(clientId: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: GOOGLE_OAUTH_CALLBACK_URL,
      response_type: "code",
      scope: this.SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
    });

    return `${this.OAUTH_URL}?${params.toString()}`;
  }

  static disconnect(): void {
    new Notice("Disconnected from google calendar");
  }
}
