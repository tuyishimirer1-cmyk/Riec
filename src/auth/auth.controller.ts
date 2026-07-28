import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiProperty,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBody,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard } from './roles.guard';
import { Role } from './role.enum';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

import type { Request } from 'express';

class LoginDto {
  @IsEmail()
  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @IsString()
  @ApiProperty({ example: 'SecurePass123!' })
  password: string;
}

class RegisterDto {
  @IsEmail()
  @ApiProperty({ example: 'newadmin@example.com' })
  email: string;

  @IsString()
  @ApiProperty({ example: 'strongpassword' })
  password: string;
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ResponseMessage('Login successful')
  @ApiOperation({
    summary: 'Admin login',
    description:
      'Authenticate admin user credentials and receive a JWT access token. This token must be included in the Authorization header for protected admin endpoints.',
  })
  @ApiResponse({
    status: 201,
    description: 'JWT access token generated successfully',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        expiresIn: 86400,
        role: 'ADMIN',
        user: {
          id: '65f34e7e0a2b3c4d5e6f7000',
          email: 'admin@example.com',
          role: 'ADMIN',
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error - email and password are required',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid email or password',
  })
  login(@Body() body: LoginDto) {
    const { email, password } = body;
    return this.authService.login(email, password);
  }

  @Post('register')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ResponseMessage('Admin user created successfully')
  @ApiOperation({
    summary: 'Register a new admin user (ADMIN only)',
    description:
      'Create a new admin user account. Only existing admin users can create new admin accounts. The email must be unique.',
  })
  @ApiResponse({
    status: 201,
    description: 'Admin user created successfully (password excluded)',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7001',
        email: 'newadmin@example.com',
        role: 'ADMIN',
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or email already exists',
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  @ApiForbiddenResponse({
    description: 'Only ADMIN users can create new admin accounts',
  })
  async register(@Req() req: Request, @Body() body: RegisterDto) {
    // requester info should be available on req.user via JwtAuthGuard
    // pass the requester email (if present) to the service for verification
    const requester = (req as any).user as { email?: string } | undefined;
    const requesterEmail = requester?.email;
    const { email, password } = body;
    return this.authService.register(requesterEmail, email, password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ResponseMessage('Logged out successfully')
  @ApiOperation({
    summary: 'Logout (updates last activity)',
    description:
      "Logout by updating the user's last login timestamp. This does not invalidate the JWT token (which remains valid until expiry).",
  })
  @ApiResponse({
    status: 201,
    description: 'Logged out successfully',
    schema: {
      example: { message: 'Logged out successfully' },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Missing or invalid access token',
  })
  logout(@Req() req: Request) {
    const user = (req as any).user as { userId?: string } | undefined;
    const userId = user?.userId;
    return this.authService.logout(userId);
  }

  @Post('register-client')
  @ResponseMessage('Client registered successfully')
  @ApiOperation({
    summary: 'Register a new client user (public)',
    description:
      'Public endpoint for users to create a client account. No authentication required. The email must be unique.',
  })
  @ApiResponse({
    status: 201,
    description: 'Client user created successfully',
    schema: {
      example: {
        id: '65f34e7e0a2b3c4d5e6f7001',
        email: 'client@example.com',
        role: 'CLIENT',
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation error or email already exists',
  })
  registerClient(@Body() body: RegisterDto) {
    const { email, password } = body;
    return this.authService.registerClient(email, password);
  }

  // TODO: Enable Firebase authentication when Firebase credentials are configured
  // @Post('firebase')
  // @ResponseMessage('Firebase authentication successful')
  // @ApiOperation({
  //   summary: 'Login with Firebase (Google OAuth)',
  //   description:
  //     'Exchange a Firebase ID token for a RIEC JWT token. Supports Google OAuth via Firebase. This endpoint allows users to authenticate using their Google account via Firebase.',
  // })
  // @ApiBody({
  //   description:
  //     'Firebase ID token obtained from client-side Firebase Authentication',
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       idToken: {
  //         type: 'string',
  //         example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2MTkz...',
  //         description: 'Firebase ID token from client SDK after Google sign-in',
  //       },
  //     },
  //     required: ['idToken'],
  //   },
  // })
  // @ApiResponse({
  //   status: 201,
  //   description: 'Firebase authentication successful',
  //   schema: {
  //     example: {
  //       statusCode: 201,
  //       message: 'Firebase authentication successful',
  //       data: {
  //         accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  //         expiresIn: 86400,
  //         role: 'CLIENT',
  //         user: {
  //           id: '65f34e7e0a2b3c4d5e6f7001',
  //           email: 'user@gmail.com',
  //           role: 'CLIENT',
  //         },
  //       },
  //     },
  //   },
  // })
  // @ApiBadRequestResponse({
  //   description: 'Invalid Firebase ID token or missing token',
  // })
  // @ApiConflictResponse({
  //   description: 'Email is already linked to another Firebase account',
  // })
  // firebaseLogin(@Body('idToken') idToken: string) {
  //   return this.authService.firebaseLogin(idToken);
  // }
}
