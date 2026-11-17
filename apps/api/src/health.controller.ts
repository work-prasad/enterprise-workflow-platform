
import { Controller, Get, Inject } from '@nestjs/common';
import type { DatabaseConnection } from '@ewp/database';
import { DATABASE_CONNECTION } from './database/database.constants';
import { UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    subject: string;
    claims: Record<string, unknown>;
  };
}

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DATABASE_CONNECTION)
    private readonly db: DatabaseConnection,
  ) {}

  @Get()
  check() {
    return {
      status: 'ok',
      service: 'api',
    };
  }

  @Get('database')
  async checkDatabase() {
    await this.db
      .selectNoFrom((eb) => eb.val(1).as('result'))
      .executeTakeFirstOrThrow();

    return {
      status: 'ok',
      service: 'api',
      database: 'connected',
    };
  }
  
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getAuthenticatedUser(
    @Req() request: AuthenticatedRequest,
  ) {
    return {
      subject: request.user.subject,
    };
  }
}
