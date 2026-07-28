/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from './role.enum';
import { FirebaseService } from './firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Optional() private readonly firebaseService: FirebaseService,
  ) {}

  async validateAdmin(email: string, password: string) {
    const admin = await (this.prisma as any).user.findUnique({
      where: { email },
    });
    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (!admin.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isValid = await bcrypt.compare(password, admin.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return admin;
  }

  async login(email: string, password: string) {
    const admin = await this.validateAdmin(email, password);

    const payload: any = {
      sub: admin.id,
      email: admin.email,
      role: admin.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // compute expiresIn in seconds from env JWT_EXPIRES_IN (supports '1d', '24h', or numeric seconds)
    const raw = process.env.JWT_EXPIRES_IN || '1d';
    let expiresIn = 86400; // default 1 day
    if (/\d+d$/.test(raw)) {
      expiresIn = Number(raw.replace(/d$/, '')) * 86400;
    } else if (/\d+h$/.test(raw)) {
      expiresIn = Number(raw.replace(/h$/, '')) * 3600;
    } else if (!Number.isNaN(Number(raw))) {
      expiresIn = Number(raw);
    }

    await (this.prisma as any).user.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    return { accessToken, expiresIn, role: admin.role };
  }

  /**
   * Register a new admin user. Only an existing admin (requesterEmail) can create another admin.
   */
  async register(
    requesterEmail: string | undefined,
    email: string,
    password: string,
    role: Role = Role.CLIENT,
  ) {
    if (!requesterEmail) {
      throw new UnauthorizedException('Unauthorized');
    }

    const requester = await (this.prisma as any).user.findUnique({
      where: { email: requesterEmail },
    });
    if (!requester || requester.role !== Role.ADMIN) {
      throw new UnauthorizedException('Only admins can register new users');
    }

    const existing = await (this.prisma as any).user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await (this.prisma as any).user.create({
      data: { email, passwordHash, role },
    });
    return {
      id: created.id,
      email: created.email,
      role: created.role,
      createdAt: created.createdAt,
    };
  }

  async logout(userId: string | undefined) {
    if (userId) {
      await (this.prisma as any).user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    }
    return { message: 'Logged out successfully' };
  }

  /**
   * Register a new client user (public endpoint - no authentication required)
   */
  async registerClient(email: string, password: string) {
    const existing = await (this.prisma as any).user.findUnique({
      where: { email },
    });
    if (existing) {
      throw new UnauthorizedException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const created = await (this.prisma as any).user.create({
      data: { email, passwordHash, role: Role.CLIENT },
    });
    return {
      id: created.id,
      email: created.email,
      role: created.role,
      createdAt: created.createdAt,
    };
  }

  /**
   * Firebase authentication: Verify Google ID token and issue RIEC JWT
   * Supports account auto-linking by email
   */
  async firebaseLogin(idToken: string) {
    if (!this.firebaseService) {
      throw new UnauthorizedException(
        'Firebase authentication is not configured',
      );
    }
    // 1. Verify Firebase ID token
    const decodedToken = await this.firebaseService.verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;
    const displayName = decodedToken.name;
    const photoURL = decodedToken.picture;

    if (!email) {
      throw new UnauthorizedException('Invalid Firebase token: no email found');
    }

    // 2. Check if user exists by firebaseUid
    let user = await (this.prisma as any).user.findUnique({
      where: { firebaseUid },
    });

    if (user) {
      // Existing Firebase user - update lastLoginAt and return JWT
      await (this.prisma as any).user.update({
        where: { firebaseUid },
        data: { lastLoginAt: new Date() },
      });
      return this.generateJwtToken(user);
    }

    // 3. Check if user exists by email (auto-link scenario)
    user = await (this.prisma as any).user.findUnique({
      where: { email },
    });

    if (user) {
      if (user.firebaseUid) {
        // This email is already linked to a different Firebase UID
        throw new ConflictException(
          'This email is already linked to another Firebase account',
        );
      }

      // Link this existing user with Firebase UID AND set profile image from Google
      user = await (this.prisma as any).user.update({
        where: { email },
        data: {
          firebaseUid,
          lastLoginAt: new Date(),
          ...(photoURL && !user.profileImg ? { profileImg: photoURL } : {}),
        },
      });

      return this.generateJwtToken(user);
    }

    // 4. No user exists - create new CLIENT user with profile image from Google
    const newUser = await (this.prisma as any).user.create({
      data: {
        email,
        firebaseUid,
        role: Role.CLIENT,
        lastLoginAt: new Date(),
        profileImg: photoURL || '',
      },
    });

    return this.generateJwtToken(newUser);
  }

  /**
   * Helper to generate JWT token for a user
   */
  private async generateJwtToken(user: any) {
    const payload: any = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload);

    // Compute expiresIn
    const raw = process.env.JWT_EXPIRES_IN || '1d';
    let expiresIn = 86400;
    if (/\d+d$/.test(raw)) {
      expiresIn = Number(raw.replace(/d$/, '')) * 86400;
    } else if (/\d+h$/.test(raw)) {
      expiresIn = Number(raw.replace(/h$/, '')) * 3600;
    } else if (!Number.isNaN(Number(raw))) {
      expiresIn = Number(raw);
    }

    return {
      accessToken,
      expiresIn,
      role: user.role,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }
}
