import { requestUrl } from "obsidian";
import { OAuthTokenResponse, GOOGLE_OAUTH_CALLBACK_URL } from "./types";

export class TokenExchangeService {
  private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";

  static async exchangeCodeForTokens(
    clientId: string,
    code: string
  ): Promise<OAuthTokenResponse> {
    try {
      console.debug("Exchanging code for tokens:", { clientId, code: code.substring(0, 10) + "..." });
      
      const response = await requestUrl({
        url: this.TOKEN_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          code: code,
          redirect_uri: GOOGLE_OAUTH_CALLBACK_URL,
          grant_type: "authorization_code",
        }).toString(),
      });

      console.debug("Token exchange successful:", response.json);
      return response.json;
    } catch (error: any) {
      console.error("Token exchange failed:", error);
      console.error("Error response:", error.response?.json);
      
      const errorDetails = error.response?.json;
      if (errorDetails?.error === "invalid_client") {
        throw new Error("Invalid client configuration. Make sure you're using a Desktop application OAuth client, not Web application.");
      } else if (errorDetails?.error === "invalid_grant") {
        throw new Error("Invalid authorization code. The code may have expired or been used already.");
      } else if (errorDetails?.error_description) {
        throw new Error(`OAuth error: ${errorDetails.error_description}`);
      }
      
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }
}
