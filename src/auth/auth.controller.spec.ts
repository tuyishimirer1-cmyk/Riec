import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    registerClient: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: { findOne: jest.fn() } },
        { provide: JwtService, useValue: { sign: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should login user', async () => {
      mockAuthService.login.mockResolvedValue({ access_token: 'token' });

      const result = await controller.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.access_token).toBe('token');
    });
  });

  describe('register', () => {
    it('should register user', async () => {
      mockAuthService.register.mockResolvedValue({ id: '1' });

      const result = await controller.register(
        { email: 'test@example.com', password: 'password' } as any,
        'test@example.com',
        'password',
      );

      expect(result.id).toBe('1');
    });
  });

  describe('logout', () => {
    it('should logout user', async () => {
      mockAuthService.logout.mockResolvedValue({ message: 'logged out' });

      const result = await controller.logout('user-id');

      expect(result.message).toBe('logged out');
    });
  });

  describe('registerClient', () => {
    it('should register client user', async () => {
      mockAuthService.registerClient.mockResolvedValue({ id: '1' });

      const result = await controller.registerClient({
        email: 'test@example.com',
        password: 'password',
      } as any);

      expect(result.id).toBe('1');
    });
  });
});
