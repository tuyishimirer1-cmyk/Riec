export function paginate(page: number, limit: number) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 20);
  return {
    skip: (p - 1) * l,
    take: l,
    meta: (total: number) => ({
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      hasNextPage: p * l < total,
      hasPreviousPage: p > 1,
    }),
  };
}

export function getPagination(pagination: {
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, Number(pagination.page) || 1);
  const pageSize = Math.max(1, Number(pagination.pageSize) || 20);
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
