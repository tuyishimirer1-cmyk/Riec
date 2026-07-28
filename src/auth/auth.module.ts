import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { FirebaseModule } from './firebase/firebase.module';
import { FirebaseService } from './firebase/firebase.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any },
      }),
    }),
    FirebaseModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    FirebaseService,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, FirebaseService],
})
export class AuthModule {}
