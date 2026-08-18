import {
  generateSlug,
  generateUniqueSlug,
  isValidSlug,
  sanitizeSlug,
} from './slug.util';

describe('slug util', () => {
  describe('generateSlug', () => {
    it('normalizes human-friendly titles into slugs', () => {
      expect(generateSlug('  Senior Frontend_Developer !!!  ')).toBe(
        'senior-frontend-developer',
      );
    });

    it('returns empty string for non-string inputs', () => {
      expect(generateSlug(undefined as unknown as string)).toBe('');
      expect(generateSlug(42 as unknown as string)).toBe('');
    });

    it('limits slug length to 100 chars and removes trailing hyphen', () => {
      const longTitle = `${'Long Title '.repeat(20)}###`;
      const slug = generateSlug(longTitle);

      expect(slug.length).toBeLessThanOrEqual(100);
      expect(slug.endsWith('-')).toBe(false);
    });
  });

  describe('generateUniqueSlug', () => {
    it('returns base slug when it is unique', async () => {
      const checkExistence = jest.fn().mockResolvedValue(false);

      const slug = await generateUniqueSlug(
        'Full Stack Engineer',
        checkExistence,
      );

      expect(slug).toBe('full-stack-engineer');
      expect(checkExistence).toHaveBeenCalledTimes(1);
      expect(checkExistence).toHaveBeenCalledWith('full-stack-engineer', null);
    });

    it('appends a numeric suffix when slug collisions exist', async () => {
      const checkExistence = jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const slug = await generateUniqueSlug(
        'Full Stack Engineer',
        checkExistence,
      );

      expect(slug).toBe('full-stack-engineer-2');
      expect(checkExistence).toHaveBeenNthCalledWith(
        1,
        'full-stack-engineer',
        null,
      );
      expect(checkExistence).toHaveBeenNthCalledWith(
        2,
        'full-stack-engineer-1',
        null,
      );
      expect(checkExistence).toHaveBeenNthCalledWith(
        3,
        'full-stack-engineer-2',
        null,
      );
    });

    it('passes excludeId through uniqueness checks', async () => {
      const checkExistence = jest
        .fn()
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await generateUniqueSlug('Backend Lead', checkExistence, 'existing-id');

      expect(checkExistence).toHaveBeenNthCalledWith(
        1,
        'backend-lead',
        'existing-id',
      );
      expect(checkExistence).toHaveBeenNthCalledWith(
        2,
        'backend-lead-1',
        'existing-id',
      );
    });

    it('throws when source title cannot generate a slug', async () => {
      await expect(
        generateUniqueSlug('   ', jest.fn().mockResolvedValue(false)),
      ).rejects.toThrow('Cannot generate slug from provided title');
    });
  });

  describe('isValidSlug', () => {
    it('accepts valid slug format', () => {
      expect(isValidSlug('clean-url-slug')).toBe(true);
      expect(isValidSlug('a1')).toBe(true);
    });

    it('rejects invalid slug values', () => {
      expect(isValidSlug('')).toBe(false);
      expect(isValidSlug('Bad Slug')).toBe(false);
      expect(isValidSlug('bad_slug')).toBe(false);
      expect(isValidSlug('bad--slug')).toBe(false);
      expect(isValidSlug('x'.repeat(101))).toBe(false);
    });
  });

  describe('sanitizeSlug', () => {
    it('normalizes user-provided slugs', () => {
      expect(sanitizeSlug('  Fancy__Slug 2026!!!  ')).toBe('fancy-slug-2026');
    });

    it('returns empty string for invalid input', () => {
      expect(sanitizeSlug(undefined as unknown as string)).toBe('');
      expect(sanitizeSlug(123 as unknown as string)).toBe('');
    });
  });
});
