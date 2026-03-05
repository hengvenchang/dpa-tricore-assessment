import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/**
 * AuthService
 *
 * Handles authentication operations including user registration and login.
 * This service manages user credentials, password hashing, and JWT token generation.
 *
 * @injectable
 */
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Register a new user
   *
   * Creates a new user account with email and hashed password.
   * Validates that the email is not already registered.
   * Generates and returns a JWT access token for immediate authentication.
   *
   * @param {RegisterDto} dto - Contains user email and password
   * @returns {Promise<{access_token: string, user: {id: number, email: string}}>} JWT token and user info
   * @throws {ConflictException} When email is already registered
   *
   * @example
   * const result = await authService.register({
   *   email: 'user@example.com',
   *   password: 'securePassword123'
   * });
   */
  async register(dto: RegisterDto) {
    // Check if user with this email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password using bcrypt with salt rounds of 10
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create new user in the database
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
      },
    });

    // Generate JWT payload with user email and id (sub claim)
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  /**
   * Login a user with email and password
   *
   * Authenticates a user by verifying email and password credentials.
   * Compares the provided password with the hashed password in the database.
   * Generates and returns a JWT access token upon successful authentication.
   *
   * @param {LoginDto} dto - Contains user email and password
   * @returns {Promise<{access_token: string, user: {id: number, email: string}}>} JWT token and user info
   * @throws {UnauthorizedException} When email is not found or password is invalid
   *
   * @example
   * const result = await authService.login({
   *   email: 'user@example.com',
   *   password: 'securePassword123'
   * });
   */
  async login(dto: LoginDto) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Throw error if user doesn't exist (generic message for security)
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify the provided password against the stored hashed password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    // Throw error if password doesn't match (generic message for security)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Generate JWT payload with user email and id (sub claim)
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
