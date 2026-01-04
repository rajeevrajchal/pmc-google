/**
 * Simple OAuth callback server for handling Google OAuth redirects
 * This creates a temporary local server that receives the OAuth callback
 * and redirects to the Obsidian protocol handler
 */

export class OAuthServer {
  private server: any = null;
  private port = 8080; // Random high port

  /**
   * Start a temporary HTTP server to handle OAuth callback
   * Returns the callback URL that should be used for OAuth redirect
   */
  async start(): Promise<string> {
    return "https://rajeevrajchal.github.io/pmc-google/oauth-callback";
  }

  /**
   * Stop the temporary HTTP server
   */
  stop(): void {
    if (this.server) {
      // Stop server logic here
      this.server = null;
    }
  }

  /**
   * Generate the OAuth callback HTML that handles the redirect
   */
  static getCallbackHTML(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Google Calendar OAuth</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f5f5f5;
        }
        .container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #7c3aed;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .success { color: #22c55e; }
        .error { color: #ef4444; }
        a {
            display: inline-block;
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #7c3aed;
            color: white;
            text-decoration: none;
            border-radius: 4px;
        }
        a:hover { background: #6d28d9; }
    </style>
</head>
<body>
    <div class="container">
        <div class="spinner"></div>
        <h2>Connecting to Obsidian...</h2>
        <p id="message">Please wait...</p>
        <div id="manual-link" style="display:none;">
            <p>If Obsidian doesn't open automatically:</p>
            <a id="obsidian-link" href="#">Click here to open Obsidian</a>
        </div>
    </div>
    <script>
        // Extract hash fragment parameters from OAuth redirect
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const expiresIn = params.get('expires_in');
        const error = params.get('error');
        const messageEl = document.getElementById('message');
        const manualLinkEl = document.getElementById('manual-link');
        const obsidianLinkEl = document.getElementById('obsidian-link');
        
        if (error) {
            document.querySelector('.spinner').style.display = 'none';
            messageEl.innerHTML = '<span class="error">Authentication failed: ' + error + '</span>';
            console.error('OAuth Error:', error);
        } else if (accessToken) {
            // Build the obsidian:// protocol URL
            const obsidianUrl = 'obsidian://pick-meeting-token?' + 
                'access_token=' + encodeURIComponent(accessToken) +
                (expiresIn ? '&expires_in=' + encodeURIComponent(expiresIn) : '');
            
            // Try to open Obsidian automatically
            window.location.href = obsidianUrl;
            
            // Show success message and manual link after a delay
            setTimeout(() => {
                document.querySelector('.spinner').style.display = 'none';
                messageEl.innerHTML = '<span class="success">Authentication successful!</span>';
                manualLinkEl.style.display = 'block';
                obsidianLinkEl.href = obsidianUrl;
            }, 1000);
        } else {
            document.querySelector('.spinner').style.display = 'none';
            messageEl.innerHTML = '<span class="error">No access token received</span>';
            console.error('No token found in URL');
        }
    </script>
</body>
</html>`;
  }
}
