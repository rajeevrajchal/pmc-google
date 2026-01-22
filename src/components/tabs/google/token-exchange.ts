import { requestUrl } from "obsidian";
import { OAuthTokenResponse, GOOGLE_OAUTH_CALLBACK_URL, BACKEND_URL } from "./types";

export class TokenExchangeService {
  static async exchangeCodeForTokens(
    clientId: string,
    code: string
  ): Promise<OAuthTokenResponse> {
    try {
      const response = await requestUrl({
        url: `${BACKEND_URL}/api/exchange`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: code,
          redirectUri: GOOGLE_OAUTH_CALLBACK_URL,
        }),
      });

      return response.json;
    } catch (error) {
      console.error("Token exchange failed:", error);
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }
}
