import { requestUrl } from "obsidian";
import { OAuthTokenResponse } from "./types";

export class TokenRefreshService {
  private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";

  static async refreshAccessToken(
    clientId: string,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    try {
      const response = await requestUrl({
        url: this.TOKEN_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }).toString(),
      });

      return response.json;
    } catch (error) {
      console.error("Token refresh failed:", error);
      throw new Error("Failed to refresh access token");
    }
  }

  static isTokenExpired(tokenExpiryDate?: number): boolean {
    if (!tokenExpiryDate) return false;
    return Date.now() >= tokenExpiryDate;
  }

  static isTokenExpiringSoon(tokenExpiryDate?: number, bufferMinutes = 5): boolean {
    if (!tokenExpiryDate) return false;
    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() >= (tokenExpiryDate - bufferMs);
  }
}
