import { Notice, requestUrl } from "obsidian";
import { OAuthTokenResponse } from "./types";

export class DeviceFlowService {
  private static readonly DEVICE_CODE_URL = "https://oauth2.googleapis.com/device/code";
  private static readonly TOKEN_URL = "https://oauth2.googleapis.com/token";
  private static readonly SCOPES = [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  static async initiateDeviceFlow(clientId: string): Promise<{
    deviceCode: string;
    userCode: string;
    verificationUrl: string;
    interval: number;
  }> {
    try {
      console.debug("Initiating device flow with client ID:", clientId);
      
      const response = await requestUrl({
        url: this.DEVICE_CODE_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          scope: this.SCOPES.join(" "),
        }).toString(),
      });

      console.debug("Device flow response:", response.json);

      return {
        deviceCode: response.json.device_code,
        userCode: response.json.user_code,
        verificationUrl: response.json.verification_url,
        interval: response.json.interval || 5,
      };
    } catch (error: any) {
      console.error("Device flow initiation failed:", error);
      console.error("Response:", error.response?.json);
      
      // Check if it's a client configuration issue
      if (error.response?.status === 401) {
        throw new Error("Device flow not enabled for this client. Please use a different OAuth client type or enable device flow in Google Cloud Console.");
      }
      
      throw new Error("Failed to start device authentication");
    }
  }

  static async pollForToken(
    clientId: string,
    deviceCode: string,
    interval: number = 5
  ): Promise<OAuthTokenResponse> {
    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const response = await requestUrl({
            url: this.TOKEN_URL,
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              client_id: clientId,
              device_code: deviceCode,
              grant_type: "urn:ietf:params:oauth:grant-type:device_code",
            }).toString(),
          });

          resolve(response.json);
        } catch (error: any) {
          const errorResponse = error.response?.json;
          
          if (errorResponse?.error === "authorization_pending") {
            // Continue polling
            setTimeout(poll, interval * 1000);
          } else if (errorResponse?.error === "slow_down") {
            // Slow down polling
            setTimeout(poll, (interval + 5) * 1000);
          } else {
            reject(new Error(errorResponse?.error_description || "Token polling failed"));
          }
        }
      };

      poll();
    });
  }
}
