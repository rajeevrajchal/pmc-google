import { requestUrl } from "obsidian";
import { OAuthTokenResponse } from "./types";

export class TokenExchangeService {
  private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";

  // Generate code verifier for PKCE
  private static generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate code challenge from verifier
  private static async generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Store code verifier for later use
  static storeCodeVerifier(verifier: string): void {
    sessionStorage.setItem('oauth_code_verifier', verifier);
  }

  // Retrieve stored code verifier
  static getStoredCodeVerifier(): string | null {
    return sessionStorage.getItem('oauth_code_verifier');
  }

  // Generate PKCE parameters
  static async generatePKCEParams(): Promise<{ verifier: string; challenge: string }> {
    const verifier = this.generateCodeVerifier();
    const challenge = await this.generateCodeChallenge(verifier);
    return { verifier, challenge };
  }

  static async exchangeCodeForTokens(
    clientId: string,
    code: string,
    redirectUri: string,
    codeVerifier?: string
  ): Promise<OAuthTokenResponse> {
    try {
      const body = new URLSearchParams({
        client_id: clientId,
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      // Add code verifier if provided (PKCE)
      if (codeVerifier) {
        body.append('code_verifier', codeVerifier);
      }

      const response = await requestUrl({
        url: this.TOKEN_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      return response.json;
    } catch (error) {
      console.error("Token exchange failed:", error);
      throw new Error("Failed to exchange authorization code for tokens");
    }
  }
}
