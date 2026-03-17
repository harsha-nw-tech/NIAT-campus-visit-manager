/**
 * Manages the NIAT service-level Bearer token.
 * On startup, reads NIAT_ACCESS_TOKEN + NIAT_REFRESH_TOKEN from env.
 * Auto-refreshes before expiry using the SSO refresh endpoint.
 * Tokens are cached in memory — on restart they reload from env.
 */

const getConfig = () => ({
  baseUrl: (process.env.GAMMA_NIAT_API_BASE_URL || "").trim(),
  apiKey: (process.env.GAMMA_NIAT_API_KEY || "").trim(),
  clientKeyDetailsId: (process.env.COMMON_DATA_CLIENT_KEY_DETAILS_ID || "").trim(),
});

interface TokenState {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // unix ms
}

let tokenState: TokenState | null = null;

function loadFromEnv(): TokenState | null {
  const accessToken = (process.env.NIAT_ACCESS_TOKEN || "").trim();
  const refreshToken = (process.env.NIAT_REFRESH_TOKEN || "").trim();
  if (!accessToken || !refreshToken) return null;
  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 30 * 60 * 1000, // assume 30 min if freshly loaded from env
  };
}

async function refreshTokens(state: TokenState): Promise<TokenState> {
  const { baseUrl, clientKeyDetailsId } = getConfig();
  const url = `${baseUrl}/api/ib_user_accounts/refresh_auth_tokens/v1/`;

  const dataPayload = JSON.stringify({ refresh_token: state.refreshToken });

  console.log("[tokenService] Refreshing access token...");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${state.accessToken}`,
    },
    body: JSON.stringify({
      clientKeyDetailsId,
      data: `'${dataPayload}'`,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token refresh failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  console.log("[tokenService] Token refreshed successfully");

  const expiresIn = data.expires_in ?? 3600; // seconds
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? state.refreshToken,
    expiresAt: Date.now() + expiresIn * 1000 - 60_000, // 1 min buffer
  };
}

/**
 * Returns a valid access token, refreshing if needed.
 * Throws if no tokens are configured.
 */
export async function getServiceToken(): Promise<string> {
  if (!tokenState) {
    tokenState = loadFromEnv();
  }

  if (!tokenState) {
    throw new Error(
      "No NIAT service token configured. Set NIAT_ACCESS_TOKEN and NIAT_REFRESH_TOKEN environment secrets.",
    );
  }

  // Refresh if within 1 minute of expiry
  if (Date.now() >= tokenState.expiresAt) {
    try {
      tokenState = await refreshTokens(tokenState);
    } catch (err) {
      console.error("[tokenService] Refresh failed, clearing token state:", err);
      tokenState = null;
      throw err;
    }
  }

  return tokenState.accessToken;
}

/**
 * Exchange an auth_code for tokens (one-time setup).
 * Use this if you have an auth_code from the SSO login flow.
 */
export async function exchangeAuthCode(authCode: string): Promise<void> {
  const { baseUrl, apiKey } = getConfig();
  const url = `${baseUrl}/api/ib_user_accounts/login/auth_code/v1/?auth_code=${encodeURIComponent(authCode)}`;

  console.log("[tokenService] Exchanging auth code...");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth code exchange failed (${res.status}): ${text}`);
  }

  const data = await res.json();
  const expiresIn = data.expires_in ?? 3600;

  tokenState = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + expiresIn * 1000 - 60_000,
  };

  console.log("[tokenService] Auth code exchanged. userId:", data.user_id);
}

/**
 * Manually set tokens (e.g. from env override at runtime).
 */
export function setTokens(accessToken: string, refreshToken: string, expiresInSeconds = 3600): void {
  tokenState = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresInSeconds * 1000 - 60_000,
  };
  console.log("[tokenService] Tokens set manually");
}
