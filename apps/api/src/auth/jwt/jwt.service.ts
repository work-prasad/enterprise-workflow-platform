
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface AuthenticatedUser {
  subject: string;
  claims: Record<string, unknown>;
}

@Injectable()
export class JwtService {
  private readonly issuer: string;
  private readonly audience: string;
  private jwksPromise?: Promise<any>;

  constructor(configService: ConfigService) {
    this.issuer = configService.getOrThrow<string>('KEYCLOAK_ISSUER');
    this.audience = configService.getOrThrow<string>('KEYCLOAK_AUDIENCE');
  }

  private getJwks(): Promise<any> {
    if (!this.jwksPromise) {
      this.jwksPromise = import('jose').then(({ createRemoteJWKSet }) => {
        const jwksUrl = new URL(
          `${this.issuer}/protocol/openid-connect/certs`,
        );

        return createRemoteJWKSet(jwksUrl);
      });
    }

    return this.jwksPromise;
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    try {
      const [{ jwtVerify }, jwks] = await Promise.all([
        import('jose'),
        this.getJwks(),
      ]);

      const { payload } = await jwtVerify(token, jwks, {
        issuer: this.issuer,
        audience: this.audience,
        algorithms: ['RS256'],
      });

      if (!payload.sub) {
        throw new Error('Token subject is missing');
      }

      return {
        subject: payload.sub,
        claims: payload,
      };
    } catch {
      throw new UnauthorizedException(
        'Invalid or expired access token',
      );
    }
  }
}
