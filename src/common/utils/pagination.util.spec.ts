import { getPagination, paginate } from './pagination.util';

describe('pagination util', () => {
  describe('paginate', () => {
    it('uses sane defaults for invalid inputs', () => {
      const result = paginate(0 as unknown as number, NaN as unknown as number);

      expect(result.skip).toBe(0);
      expect(result.take).toBe(20);
    });

    it('computes skip/take for explicit page and limit', () => {
      const result = paginate(3, 15);

      expect(result.skip).toBe(30);
      expect(result.take).toBe(15);
    });

    it('builds pagination meta for non-empty result sets', () => {
      const result = paginate(2, 10);
      const meta = result.meta(45);

      expect(meta).toEqual({
        total: 45,
        page: 2,
        limit: 10,
        totalPages: 5,
        hasNextPage: true,
        hasPreviousPage: true,
      });
    });

    it('builds pagination meta for empty result sets', () => {
      const result = paginate(1, 10);
      const meta = result.meta(0);

      expect(meta).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      });
    });
  });

  describe('getPagination', () => {
    it('returns normalized page and pageSize values', () => {
      const result = getPagination({ page: 2, pageSize: 25 });

      expect(result).toEqual({
        page: 2,
        pageSize: 25,
        skip: 25,
        take: 25,
      });
    });

    it('falls back to defaults when values are missing or invalid', () => {
      const result = getPagination({ page: -9, pageSize: 0 });

      expect(result).toEqual({
        page: 1,
        pageSize: 20,
        skip: 0,
        take: 20,
      });
    });
  });
});
