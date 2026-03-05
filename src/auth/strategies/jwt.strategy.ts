import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { validate as validateUuid } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET') || 'secret',
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload); // Debug: check what's in the JWT

    if (!payload.sub) {
      throw new BadRequestException('User ID missing in JWT token.');
    }

    const userId = String(payload.sub);

    // Validate UUID format
    if (!validateUuid(userId)) {
      throw new BadRequestException(`Invalid user ID format. Expected valid UUID, got: "${userId}"`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    return user;
  }
}