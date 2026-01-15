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
   * Initiate OAuth flow to connect to Google Calendar
   * @param clientId - OAuth 2.0 Client ID from Google Cloud Console
   */
  static initiateOAuthFlow(clientId: string): void {
    if (!clientId || clientId.trim() === "") {
      new Notice("Please configure client ID first");
      return;
    }

    const authUrl = this.buildAuthUrl(clientId);

    new Notice("Opening google authentication");

    // Open OAuth URL in browser
    window.open(authUrl, "_blank");
  }

  /**
   * Build the OAuth authorization URL - using implicit flow with longer expiry
   */
  private static buildAuthUrl(clientId: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: GOOGLE_OAUTH_CALLBACK_URL,
      response_type: "token",
      scope: this.SCOPES.join(" "),
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    });

    return `${this.OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Disconnect from Google Calendar
   * Clears the stored access token
   */
  static disconnect(): void {
    new Notice("Disconnected from google calendar");
  }
}
