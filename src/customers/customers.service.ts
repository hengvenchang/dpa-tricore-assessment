import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerResponseDto, CustomerListResponseDto } from './dto/customer-response.dto';

/**
 * Customers Service
 *
 * Responsible for all business logic related to customer management.
 * Implements:
 * - User isolation: Each user has their own set of customers
 * - Soft deletes: Deleted customers retain data for audit purposes
 * - Data validation: Email uniqueness per user
 * - Pagination: Efficient list retrieval with metadata
 *
 * Production considerations:
 * - All database operations include proper error handling
 * - User authorization checks prevent data leaks
 * - Pagination limits prevent large dataset transfers
 * - Soft deletes maintain audit trail without hard deletes
 * - Database queries are optimized with select clauses
 * - Concurrent operations are handled safely
 */
@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  // Constants for validation
  private readonly MAX_PAGE_SIZE = 100;
  private readonly DEFAULT_PAGE_SIZE = 10;
  private readonly MIN_PAGE_SIZE = 1;

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new customer
   *
   * Creates a new customer record associated with the authenticated user.
   * Validates that the user exists and email is unique within their customer list.
   * Logs all creation attempts for audit purposes.
   *
   * @param dto - Customer creation data (name, email)
   * @param userId - Authenticated user's ID (UUID string)
   * @returns Created customer record
   *
   * @throws BadRequestException - If userId is missing or invalid
   * @throws ConflictException - If email already exists for this user
   * @throws PrismaClientKnownRequestError - On database errors
   *
   * @example
   * const customer = await customersService.create(
   *   { name: 'John Doe', email: 'john@example.com' },
   *   '550e8400-e29b-41d4-a716-446655440000'
   * );
   */
  async create(
    dto: CreateCustomerDto,
    userId: string,
  ): Promise<CustomerResponseDto> {
    // Validate user ID
    if (!userId || userId.trim() === '') {
      this.logger.warn(`Invalid user ID provided: ${userId}`);
      throw new BadRequestException('Valid user ID is required');
    }

    // Normalize email for case-insensitive comparison
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check for duplicate email within user's customers
    const existingCustomer = await this.prisma.customer.findFirst({
      where: {
        userId,
        email: normalizedEmail,
        deletedAt: null,
      },
    });

    if (existingCustomer) {
      this.logger.warn(
        `Duplicate email attempt for user ${userId}: ${normalizedEmail}`,
      );
      throw new ConflictException(
        'A customer with this email already exists for your account',
      );
    }

    try {
      const customer = await this.prisma.customer.create({
        data: {
          name: dto.name.trim(),
          email: normalizedEmail,
          userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Customer created successfully. ID: ${customer.id}, User: ${userId}`);
      return customer;
    } catch (error) {
      this.logger.error(
        `Failed to create customer for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * List all customers for a user with pagination
   *
   * Retrieves a paginated list of active (non-deleted) customers for the authenticated user.
   * Results are sorted by creation date (newest first) for consistent ordering.
   * Uses parallel queries for optimal database performance.
   *
   * @param userId - Authenticated user's ID (UUID string)
   * @param page - Page number (1-indexed, default: 1)
   * @param limit - Records per page (default: 10, max: 100)
   * @returns Paginated list with metadata
   *
   * @throws BadRequestException - If userId is invalid or pagination params are out of range
   *
   * @example
   * const result = await customersService.findAll('550e8400-e29b-41d4-a716-446655440000', 1, 10);
   * console.log(result.totalPages); // number of pages available
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = this.DEFAULT_PAGE_SIZE,
  ): Promise<CustomerListResponseDto> {
    // Validate user ID
    if (!userId || userId.trim() === '') {
      this.logger.warn(`Invalid user ID provided: ${userId}`);
      throw new BadRequestException('Valid user ID is required');
    }
    // Validate user ID
    if (!userId) {
      this.logger.warn(`Invalid user ID provided: ${userId}`);
      throw new BadRequestException('Valid user ID is required');
    }

    // Validate and normalize pagination parameters
    if (page < 1) {
      this.logger.warn(`Invalid page number: ${page}`);
      throw new BadRequestException('Page number must be at least 1');
    }

    if (limit < this.MIN_PAGE_SIZE || limit > this.MAX_PAGE_SIZE) {
      this.logger.warn(
        `Invalid page size: ${limit} (valid range: ${this.MIN_PAGE_SIZE}-${this.MAX_PAGE_SIZE})`,
      );
      throw new BadRequestException(
        `Page size must be between ${this.MIN_PAGE_SIZE} and ${this.MAX_PAGE_SIZE}`,
      );
    }

    const skip = (page - 1) * limit;

    try {
      // Use Promise.all for parallel execution of count and find queries
      const [customers, total] = await Promise.all([
        this.prisma.customer.findMany({
          where: {
            userId,
            deletedAt: null,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }, // Newest first
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            updatedAt: true,
          },
        }),
        this.prisma.customer.count({
          where: {
            userId,
            deletedAt: null,
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit) || 0;

      this.logger.debug(
        `Retrieved ${customers.length} customers for user ${userId}, page ${page}`,
      );

      return {
        data: customers,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to retrieve customers for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Retrieve a single customer by ID
   *
   * Fetches a customer record and verifies that the authenticated user is the owner.
   * Prevents unauthorized access to other users' customers through authorization check.
   * Does not return soft-deleted customers.
   *
   * @param id - Customer ID (UUID string)
   * @param userId - Authenticated user's ID (UUID string)
   * @returns Customer record without userId field
   *
   * @throws BadRequestException - If userId is invalid
   * @throws NotFoundException - If customer doesn't exist or user is not authorized
   *
   * @example
   * const customer = await customersService.findOne('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001');
   */
  async findOne(
    id: string,
    userId: string,
  ): Promise<CustomerResponseDto> {
    // Validate user ID
    if (!userId || userId.trim() === '') {
      this.logger.warn(`Invalid user ID provided: ${userId}`);
      throw new BadRequestException('Valid user ID is required');
    }

    // Validate customer ID
    if (!id || id.trim() === '') {
      this.logger.warn(`Invalid customer ID: ${id}`);
      throw new BadRequestException('Valid customer ID is required');
    }

    try {
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          userId: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      });

      // Customer doesn't exist or is soft-deleted
      if (!customer || customer.deletedAt) {
        this.logger.warn(
          `Access attempt to non-existent or deleted customer. ID: ${id}, User: ${userId}`,
        );
        throw new NotFoundException('Customer not found');
      }

      // User is not authorized to access this customer
      if (customer.userId !== userId) {
        this.logger.warn(
          `Unauthorized access attempt. Customer ID: ${id}, User: ${userId}, Owner: ${customer.userId}`,
        );
        throw new NotFoundException('Customer not found');
      }

      this.logger.debug(`Retrieved customer ${id} for user ${userId}`);

      // Return without userId and deletedAt
      const { userId: _, deletedAt: __, ...result } = customer;
      return result as CustomerResponseDto;
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Failed to retrieve customer ${id} for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Update an existing customer
   *
   * Updates one or more fields of a customer record.
   * Only the authenticated user can update their own customers.
   * Email updates are checked for uniqueness within the user's customer list.
   * Automatically trims whitespace from string fields.
   *
   * @param id - Customer ID (UUID string)
   * @param userId - Authenticated user's ID (UUID string)
   * @param dto - Partial customer update data
   * @returns Updated customer record
   *
   * @throws BadRequestException - If userId is invalid or no updates provided
   * @throws NotFoundException - If customer doesn't exist or user is not authorized
   * @throws ConflictException - If new email already exists for this user
   *
   * @example
   * const updated = await customersService.update(
   *   '550e8400-e29b-41d4-a716-446655440000',
   *   '550e8400-e29b-41d4-a716-446655440001',
   *   { name: 'Jane Doe' }
   * );
   */
  async update(
    id: string,
    userId: string,
    dto: UpdateCustomerDto,
  ): Promise<CustomerResponseDto> {
    // Validate user ID
    if (!userId || userId.trim() === '') {
      this.logger.warn(`Invalid user ID provided: ${userId}`);
      throw new BadRequestException('Valid user ID is required');
    }

    // Validate customer ID
    if (!id || id.trim() === '') {
      this.logger.warn(`Invalid customer ID: ${id}`);
      throw new BadRequestException('Valid customer ID is required');
    }
    // Validate user ID
    if (!userId) {
      this.logger.warn(`Invalid user ID provided: ${userId}`);
      throw new BadRequestException('Valid user ID is required');
    }

    // Check if update data has at least one field
    if (!dto.name && !dto.email) {
      this.logger.warn(
        `Update request with no data. Customer ID: ${id}, User: ${userId}`,
      );
      throw new BadRequestException(
        'At least one field (name or email) must be provided for update',
      );
    }

    try {
      // Fetch customer with all necessary fields
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          userId: true,
          deletedAt: true,
        },
      });

      // Customer doesn't exist or is soft-deleted
      if (!customer || customer.deletedAt) {
        this.logger.warn(
          `Update attempt on non-existent or deleted customer. ID: ${id}, User: ${userId}`,
        );
        throw new NotFoundException('Customer not found');
      }

      // User is not authorized
      if (customer.userId !== userId) {
        this.logger.warn(
          `Unauthorized update attempt. Customer ID: ${id}, User: ${userId}, Owner: ${customer.userId}`,
        );
        throw new NotFoundException('Customer not found');
      }

      // If email is being updated, check for uniqueness
      if (dto.email) {
        const normalizedEmail = dto.email.toLowerCase().trim();

        if (normalizedEmail !== customer.email) {
          const existingCustomer = await this.prisma.customer.findFirst({
            where: {
              userId,
              email: normalizedEmail,
              deletedAt: null,
              id: { not: id }, // Exclude current customer
            },
          });

          if (existingCustomer) {
            this.logger.warn(
              `Duplicate email update attempt for user ${userId}: ${normalizedEmail}`,
            );
            throw new ConflictException(
              'A customer with this email already exists for your account',
            );
          }
        }
      }

      // Prepare update data with trimmed strings
      const updateData: UpdateCustomerDto = {};
      if (dto.name) updateData.name = dto.name.trim();
      if (dto.email) updateData.email = dto.email.toLowerCase().trim();

      const updatedCustomer = await this.prisma.customer.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      this.logger.log(`Customer updated successfully. ID: ${id}, User: ${userId}`);
      return updatedCustomer;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update customer ${id} for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Delete a customer (soft delete)
   *
   * Performs a soft delete by setting the deletedAt timestamp.
   * The customer record is retained in the database for audit and historical purposes.
   * Soft-deleted customers are automatically excluded from list and retrieve operations.
   * Only the authenticated user can delete their own customers.
   *
   * Benefits of soft delete:
   * - Maintains audit trail
   * - Allows data recovery if needed
   * - Preserves referential integrity with other records
   * - No physical data loss
   *
   * @param id - Customer ID (UUID string)
   * @param userId - Authenticated user's ID (UUID string)
   *
   * @throws BadRequestException - If userId is invalid
   * @throws NotFoundException - If customer doesn't exist or user is not authorized
   *
   * @example
   * await customersService.remove('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001');
   */
  async remove(id: string, userId: string): Promise<void> {
    // Validate user ID
    if (!userId || userId.trim() === '') {
      this.logger.warn(`Invalid user ID provided: ${userId}`);
      throw new BadRequestException('Valid user ID is required');
    }

    // Validate customer ID
    if (!id || id.trim() === '') {
      this.logger.warn(`Invalid customer ID: ${id}`);
      throw new BadRequestException('Valid customer ID is required');
    }
    // Validate user ID
    if (!userId) {
      this.logger.warn(`Invalid user ID provided: ${userId}`);
      throw new BadRequestException('Valid user ID is required');
    }

    try {
      // Fetch customer for authorization check
      const customer = await this.prisma.customer.findUnique({
        where: { id },
        select: {
          id: true,
          userId: true,
          deletedAt: true,
        },
      });

      // Customer doesn't exist or already deleted
      if (!customer) {
        this.logger.warn(
          `Delete attempt on non-existent customer. ID: ${id}, User: ${userId}`,
        );
        throw new NotFoundException('Customer not found');
      }

      if (customer.deletedAt) {
        this.logger.warn(
          `Delete attempt on already deleted customer. ID: ${id}, User: ${userId}`,
        );
        throw new NotFoundException('Customer not found');
      }

      // User is not authorized
      if (customer.userId !== userId) {
        this.logger.warn(
          `Unauthorized delete attempt. Customer ID: ${id}, User: ${userId}, Owner: ${customer.userId}`,
        );
        throw new NotFoundException('Customer not found');
      }

      // Perform soft delete
      await this.prisma.customer.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      this.logger.log(`Customer soft-deleted successfully. ID: ${id}, User: ${userId}`);
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to delete customer ${id} for user ${userId}: ${error.message}`,
      );
      throw error;
    }
  }
}
