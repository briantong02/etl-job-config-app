import {
  ensureSignedInWithFabric,
  initEmbeddedAuth as sdkInitEmbeddedAuth,
  type FabricAuthOptions,
} from '@microsoft/rayfin-auth-provider-fabric';
import type { RayfinClient } from '@microsoft/rayfin-client';

import type { EtlJobConfigSchema } from '../../rayfin/data/schema';

import { type AuthUser, type IAuthService, toAuthUser } from './IAuthService';

/**
 * Production auth service. Wraps the Fabric brokered authentication SDK
 * (`@microsoft/rayfin-auth-provider-fabric`).
 *
 * Used whenever the API URL is not localhost. Requires Fabric workspace,
 * project, and portal config to be passed at construction time — see
 * `bootstrapAuth()` for how those are read from VITE_FABRIC_* env vars.
 */
export class RayfinAuthService implements IAuthService {
  readonly fabricAuthEnabled = true;

  constructor(
    private readonly client: RayfinClient<EtlJobConfigSchema>,
    private readonly fabricOptions: FabricAuthOptions
  ) {}

  async signIn(): Promise<AuthUser> {
    const session = await ensureSignedInWithFabric(
      this.client.auth,
      this.fabricOptions
    );
    if (!session.isAuthenticated || !session.user) {
      throw new Error(
        'Fabric authentication completed but no session was established.'
      );
    }
    return toAuthUser(session.user);
  }

  async signOut(): Promise<void> {
    await this.client.auth.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const session = this.client.auth.getSession();
    if (!session.isAuthenticated || !session.user) return null;
    return toAuthUser(session.user);
  }

  async initEmbeddedAuth(): Promise<AuthUser | null> {
    const session = await sdkInitEmbeddedAuth(
      this.client.auth,
      this.fabricOptions
    );
    if (!session?.isAuthenticated || !session.user) return null;
    return toAuthUser(session.user);
  }

  async getFabricToken(): Promise<string | null> {
    try {
      // The Rayfin Fabric brokered-auth session wraps an Entra access token.
      // The raw session object may expose it as `accessToken` or `token`.
      // This is the correct token to use when calling api.fabric.microsoft.com
      // from within a deployed Fabric context.
      const raw = this.client.auth.getSession() as unknown as Record<string, unknown>;
      const token = raw.accessToken ?? raw.token;
      return typeof token === 'string' && token.length > 0 ? token : null;
    } catch {
      return null;
    }
  }
}
