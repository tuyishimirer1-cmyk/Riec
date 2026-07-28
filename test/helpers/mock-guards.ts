export const allowGuard = {
  canActivate: jest.fn().mockReturnValue(true),
};

export const denyGuard = {
  canActivate: jest.fn().mockReturnValue(false),
};
