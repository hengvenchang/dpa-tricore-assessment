import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Update Customer DTO
 * Validates and documents the request body for customer updates.
 * All fields are optional, allowing partial updates.
 * At least one field must be provided for the request to be valid.
 */
export class UpdateCustomerDto {
  @ApiProperty({
    description: 'Customer full name',
    example: 'Jane Doe',
    minLength: 1,
    maxLength: 255,
    required: false,
  })
  @IsString({
    message: 'Name must be a string',
  })
  @IsOptional()
  @MinLength(1, {
    message: 'Name must be at least 1 character long',
  })
  @MaxLength(255, {
    message: 'Name must not exceed 255 characters',
  })
  name?: string;

  @ApiProperty({
    description: 'Customer email address (must be unique per user)',
    example: 'jane.doe@example.com',
    format: 'email',
    required: false,
  })
  @IsEmail(
    {},
    {
      message: 'Email must be a valid email address',
    },
  )
  @IsOptional()
  @MaxLength(255, {
    message: 'Email must not exceed 255 characters',
  })
  email?: string;
}