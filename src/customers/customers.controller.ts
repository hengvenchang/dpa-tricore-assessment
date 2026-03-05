import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto, CustomerListResponseDto, ErrorResponseDto } from './dto/customer-response.dto';

/**
 * Customers Controller
 *
 * Handles all HTTP endpoints for customer management operations.
 * All endpoints require JWT authentication via the Authorization header.
 *
 * Base path: /api/v1/customers
 * Authentication: Bearer token (JWT)
 *
 * Features:
 * - Create new customers
 * - List customers with pagination
 * - Retrieve customer details
 * - Update customer information
 * - Soft delete customers (user isolation)
 */
@ApiTags('Customers')
@Controller({ path: 'customers', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('jwt')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  /**
   * Create a new customer
   *
   * Creates a new customer record associated with the authenticated user.
   * The customer's email must be unique within the user's customer list.
   *
   * @param req - Express request object containing authenticated user
   * @param createCustomerDto - Customer creation data
   * @returns Created customer with assigned ID and timestamps
   *
   * @example
   * POST /api/v1/customers
   * Authorization: Bearer <token>
   * Content-Type: application/json
   *
   * {
   *   "name": "John Doe",
   *   "email": "john.doe@example.com"
   * }
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new customer',
    description: 'Creates a new customer record for the authenticated user. Email must be unique.',
  })
  @ApiCreatedResponse({
    description: 'Customer created successfully',
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or email already exists',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  async create(
    @Request() req,
    @Body(ValidationPipe) createCustomerDto: CreateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.create(createCustomerDto, req.user.id);
  }

  /**
   * List all customers with pagination
   *
   * Retrieves a paginated list of customers for the authenticated user.
   * Results are sorted by creation date (newest first).
   * Soft-deleted customers are automatically excluded.
   *
   * @param req - Express request object containing authenticated user
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Records per page (default: 10, max: 100)
   * @returns Paginated list of customers with metadata
   *
   * @example
   * GET /api/v1/customers?page=1&limit=20
   * Authorization: Bearer <token>
   */
  @Get()
  @ApiOperation({
    summary: 'List all customers',
    description: 'Retrieves a paginated list of customers for the authenticated user, sorted by creation date (newest first).',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number (1-indexed)',
    required: false,
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of records per page',
    required: false,
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100,
  })
  @ApiOkResponse({
    description: 'List of customers retrieved successfully',
    type: CustomerListResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination parameters',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  async findAll(
    @Request() req,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ): Promise<CustomerListResponseDto> {
    return this.customersService.findAll(req.user.id, +page, +limit);
  }

  /**
   * Retrieve a specific customer by ID
   *
   * Retrieves detailed information about a specific customer.
   * Only customers owned by the authenticated user can be accessed.
   *
   * @param req - Express request object containing authenticated user
   * @param id - Customer ID
   * @returns Customer details
   *
   * @example
   * GET /api/v1/customers/42
   * Authorization: Bearer <token>
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get customer by ID',
    description: 'Retrieves a specific customer by their ID. Only customers owned by the authenticated user can be accessed.',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer unique identifier',
    type: 'integer',
    example: 42,
  })
  @ApiOkResponse({
    description: 'Customer retrieved successfully',
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid customer ID format',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiNotFoundResponse({
    description: 'Customer not found or user does not have access',
    type: ErrorResponseDto,
  })
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CustomerResponseDto> {
    return this.customersService.findOne(id, req.user.id);
  }

  /**
   * Update an existing customer
   *
   * Updates one or more fields of a customer record.
   * Only customers owned by the authenticated user can be updated.
   * Email updates must maintain uniqueness within the user's customer list.
   *
   * @param req - Express request object containing authenticated user
   * @param id - Customer ID
   * @param updateCustomerDto - Partial customer update data
   * @returns Updated customer record
   *
   * @example
   * PUT /api/v1/customers/42
   * Authorization: Bearer <token>
   * Content-Type: application/json
   *
   * {
   *   "name": "Jane Doe"
   * }
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update a customer',
    description: 'Updates one or more fields of an existing customer. At least one field must be provided.',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer unique identifier',
    type: 'integer',
    example: 42,
  })
  @ApiOkResponse({
    description: 'Customer updated successfully',
    type: CustomerResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid request data or email already exists',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiNotFoundResponse({
    description: 'Customer not found or user does not have access',
    type: ErrorResponseDto,
  })
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateCustomerDto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    return this.customersService.update(id, req.user.id, updateCustomerDto);
  }

  /**
   * Delete a customer (soft delete)
   *
   * Performs a soft delete of a customer record. The customer record remains
   * in the database with a deletion timestamp but is excluded from list queries.
   * Only customers owned by the authenticated user can be deleted.
   *
   * @param req - Express request object containing authenticated user
   * @param id - Customer ID
   *
   * @example
   * DELETE /api/v1/customers/42
   * Authorization: Bearer <token>
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a customer',
    description: 'Performs a soft delete of a customer record. The record is kept in the database for audit purposes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer unique identifier',
    type: 'integer',
    example: 42,
  })
  @ApiNoContentResponse({
    description: 'Customer deleted successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid customer ID format',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing authentication token',
  })
  @ApiNotFoundResponse({
    description: 'Customer not found or user does not have access',
    type: ErrorResponseDto,
  })
  async remove(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    await this.customersService.remove(id, req.user.id);
  }
}
