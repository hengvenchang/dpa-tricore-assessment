import { ApiProperty } from '@nestjs/swagger';

/**
 * Customer Response DTO
 * Represents a single customer resource returned by the API.
 * This DTO is used for all customer response operations.
 */
export class CustomerResponseDto {
  @ApiProperty({
    description: 'Unique customer identifier',
    example: 1,
    type: 'integer',
  })
  id: number;

  @ApiProperty({
    description: 'Customer full name',
    example: 'John Doe',
    minLength: 1,
    maxLength: 255,
  })
  name: string;

  @ApiProperty({
    description: 'Customer email address',
    example: 'john.doe@example.com',
    format: 'email',
  })
  email: string;

  @ApiProperty({
    description: 'Customer creation timestamp',
    example: '2026-03-05T10:30:00Z',
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Customer last update timestamp',
    example: '2026-03-05T10:30:00Z',
    format: 'date-time',
  })
  updatedAt: Date;
}

/**
 * Customer List Response DTO
 * Represents a paginated list of customers returned by the API.
 * Includes pagination metadata for efficient client-side handling.
 */
export class CustomerListResponseDto {
  @ApiProperty({
    description: 'Array of customer records',
    type: [CustomerResponseDto],
  })
  data: CustomerResponseDto[];

  @ApiProperty({
    description: 'Total number of customers matching the filter',
    example: 42,
    type: 'integer',
  })
  total: number;

  @ApiProperty({
    description: 'Current page number (1-indexed)',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of records per page',
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages available',
    example: 5,
    type: 'integer',
    minimum: 0,
  })
  totalPages: number;
}

/**
 * Error Response DTO
 * Standard error response format used across all customer endpoints.
 */
export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Customer not found',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp of the error',
    example: '2026-03-05T10:30:00Z',
  })
  timestamp: string;
}