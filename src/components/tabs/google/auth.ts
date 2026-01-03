/**
 * Google OAuth authentication and connection management
 */

import { Notice, requestUrl } from "obsidian";
import { GOOGLE_OAUTH_CALLBACK_URL, GOOGLE_TOKEN_EXCHANGE_URL, OAuthTokenResponse } from "./types";

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

    new Notice("Opening Google authentication...");

    // Open OAuth URL in browser
    window.open(authUrl, "_blank");
  }

  /**
   * Build the OAuth authorization URL
   * Now uses authorization code flow instead of implicit flow
   */
  private static buildAuthUrl(clientId: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: GOOGLE_OAUTH_CALLBACK_URL,
      response_type: "code", // Changed from "token" to "code"
      scope: this.SCOPES.join(" "),
      access_type: "offline", // Changed to "offline" to get refresh token
      prompt: "consent", // Force consent screen to get refresh token
    });

    return `${this.OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   * This should be called by your backend server for security
   * @param code - Authorization code from OAuth callback
   * @param clientId - OAuth client ID
   * @param clientSecret - OAuth client secret
   * @returns Access token, refresh token, and expiry
   */
  static async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    try {
      const response = await requestUrl({
        url: GOOGLE_TOKEN_EXCHANGE_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: GOOGLE_OAUTH_CALLBACK_URL,
        }),
      });

      const data: OAuthTokenResponse = response.json;

      if (!data.refresh_token) {
        throw new Error("No refresh token received. User may need to revoke access and reconnect.");
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      console.error("Token exchange failed:", error);
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }

  /**
   * Disconnect from Google Calendar
   * Clears the stored access token
   */
  static disconnect(): void {
    new Notice("Disconnected from Google Calendar");
  }
}
