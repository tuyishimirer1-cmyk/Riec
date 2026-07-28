import { Roles, ROLES_KEY } from './roles.decorator';
import { Role } from './role.enum';

describe('Roles Decorator', () => {
  it('should be defined', () => {
    expect(Roles).toBeDefined();
  });

  it('should return a decorator function', () => {
    const result = Roles(Role.ADMIN, Role.CLIENT);

    // SetMetadata returns a decorator factory with a KEY property
    expect(result).toBeDefined();
    expect(typeof result).toBe('function');
  });
});