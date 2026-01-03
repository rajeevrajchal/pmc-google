/**
 * Token expiry and refresh management for Google Calendar
 */

import { TokenExpiryOption } from "./types";

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
}
