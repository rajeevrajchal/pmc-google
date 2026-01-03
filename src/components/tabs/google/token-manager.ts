/**
 * Token expiry and refresh management for Google Calendar
 */

import { requestUrl } from "obsidian";
import { TokenExpiryOption, TokenRefreshResponse, GOOGLE_TOKEN_REFRESH_URL } from "./types";

export class TokenManager {
  /**
   * Calculate token expiry date based on the selected option
   * @param expiryOption - The expiry option selected by the user
   * @returns Unix timestamp when token expires, or undefined for unlimited
   */
  static calculateExpiryDate(expiryOption: TokenExpiryOption): number | undefined {
    if (expiryOption === "unlimited") {
      return undefined;
    }

    const now = Date.now();
    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    switch (expiryOption) {
      case "1week":
        return now + 7 * millisecondsPerDay;
      case "1month":
        return now + 30 * millisecondsPerDay;
      case "3months":
        return now + 90 * millisecondsPerDay;
      case "6months":
        return now + 180 * millisecondsPerDay;
      default:
        return undefined;
    }
  }

  /**
   * Check if the token has expired
   * @param expiryDate - Unix timestamp when token expires
   * @returns true if token is expired, false otherwise
   */
  static isTokenExpired(expiryDate: number | undefined): boolean {
    if (!expiryDate) {
      return false; // Unlimited tokens never expire
    }

    return Date.now() >= expiryDate;
  }

  /**
   * Get human-readable time remaining until token expires
   * @param expiryDate - Unix timestamp when token expires
   * @returns Formatted string like "5 days", "2 hours", or "Unlimited"
   */
  static getTimeRemaining(expiryDate: number | undefined): string {
    if (!expiryDate) {
      return "Unlimited";
    }

    const remaining = expiryDate - Date.now();

    if (remaining <= 0) {
      return "Expired";
    }

    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

    if (days > 0) {
      return `${days} day${days !== 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
  }

  /**
   * Check if token needs refresh soon (within 24 hours)
   * @param expiryDate - Unix timestamp when token expires
   * @returns true if token expires within 24 hours
   */
  static needsRefreshSoon(expiryDate: number | undefined): boolean {
    if (!expiryDate) {
      return false;
    }

    const oneDayInMs = 24 * 60 * 60 * 1000;
    const remaining = expiryDate - Date.now();

    return remaining > 0 && remaining < oneDayInMs;
  }

  /**
   * Format expiry date to readable string
   * @param expiryDate - Unix timestamp when token expires
   * @returns Formatted date string
   */
  static formatExpiryDate(expiryDate: number | undefined): string {
    if (!expiryDate) {
      return "Never";
    }

    const date = new Date(expiryDate);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Check if access token needs refresh (expires in less than 5 minutes)
   * @param accessTokenExpiresAt - Unix timestamp when access token expires
   * @returns true if access token needs refresh
   */
  static needsAccessTokenRefresh(accessTokenExpiresAt: number | undefined): boolean {
    if (!accessTokenExpiresAt) {
      return false;
    }

    const fiveMinutesInMs = 5 * 60 * 1000;
    const remaining = accessTokenExpiresAt - Date.now();

    return remaining <= fiveMinutesInMs;
  }

  /**
   * Refresh the access token using the refresh token
   * @param refreshToken - The refresh token
   * @param clientId - OAuth client ID
   * @param clientSecret - OAuth client secret
   * @returns New access token and expiry time
   */
  static async refreshAccessToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ accessToken: string; expiresAt: number }> {
    try {
      const response = await requestUrl({
        url: GOOGLE_TOKEN_REFRESH_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      const data: TokenRefreshResponse = response.json;

      // Calculate when the new access token expires
      const expiresAt = Date.now() + (data.expires_in * 1000);

      return {
        accessToken: data.access_token,
        expiresAt,
      };
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  /**
   * Validate if an access token is still valid by making a test request
   * @param accessToken - The access token to validate
   * @returns true if token is valid
   */
  static async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await requestUrl({
        url: "https://www.googleapis.com/oauth2/v1/tokeninfo",
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}
