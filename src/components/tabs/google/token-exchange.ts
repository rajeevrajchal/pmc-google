import { requestUrl } from "obsidian";
import { OAuthTokenResponse } from "./types";

export class TokenExchangeService {
  private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";

  static async exchangeCodeForTokens(
    clientId: string,
    code: string,
    redirectUri: string
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
          code: code,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      return response.json;
    } catch (error) {
      console.error("Token exchange failed:", error);
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }
}
