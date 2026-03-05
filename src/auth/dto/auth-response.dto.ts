import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
    example: { id: '550e8400-e29b-41d4-a716-446655440000', email: 'user@example.com' },
  })
  user: {
    id: string;
    email: string;
  };
}