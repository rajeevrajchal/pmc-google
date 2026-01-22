import { requestUrl } from "obsidian";
import { OAuthTokenResponse, BACKEND_URL } from "./types";

export class TokenRefreshService {
  static async refreshAccessToken(
    clientId: string,
    refreshToken: string
  ): Promise<OAuthTokenResponse> {
    try {
      const response = await requestUrl({
        url: `${BACKEND_URL}/api/refresh`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refreshToken: refreshToken,
        }),
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
