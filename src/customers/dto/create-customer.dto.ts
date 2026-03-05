import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Create Customer DTO
 * Validates and documents the request body for customer creation.
 * All fields are required for creating a new customer record.
 */
export class CreateCustomerDto {
  @ApiProperty({
    description: 'Customer full name',
    example: 'John Doe',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({
    message: 'Name must be a string',
  })
  @IsNotEmpty({
    message: 'Name is required and cannot be empty',
  })
  @MinLength(1, {
    message: 'Name must be at least 1 character long',
  })
  @MaxLength(255, {
    message: 'Name must not exceed 255 characters',
  })
  name: string;

  @ApiProperty({
    description: 'Customer email address (must be unique per user)',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail(
    {},
    {
      message: 'Email must be a valid email address',
    },
  )
  @IsNotEmpty({
    message: 'Email is required and cannot be empty',
  })
  @MaxLength(255, {
    message: 'Email must not exceed 255 characters',
  })
  email: string;
}