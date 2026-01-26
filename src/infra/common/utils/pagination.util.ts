import { PaginatedResult } from '../interfaces/paginated-result.interface';

/**
 * Interface untuk menangkap perilaku dasar model Prisma (Delegate)
 * T: Tipe Entitas (contoh: Product)
 * A: Tipe Arguments (contoh: Prisma.ProductFindManyArgs)
 */
interface PrismaModelDelegate<T, A> {
  count(args?: { where?: any }): Promise<number>;
  findMany(args?: A): Promise<T[]>;
}

export async function paginate<T, A>(
  model: PrismaModelDelegate<T, A>,
  args: A & { where?: any }, // Memastikan args memiliki struktur yang valid untuk count & findMany
  options: { page?: number; perPage?: number } = {},
): Promise<PaginatedResult<T>> {
  const page = Number(options.page) || 1;
  const perPage = Number(options.perPage) || 10;

  const skip = (page - 1) * perPage;

  // Jalankan query secara paralel
  const [total, data] = await Promise.all([
    model.count({ where: args.where }),
    model.findMany({
      ...args,
      take: perPage,
      skip,
    }),
  ]);

  const lastPage = Math.ceil(total / perPage);

  return {
    data,
    meta: {
      total,
      lastPage,
      currentPage: page,
      perPage,
      prev: page > 1 ? page - 1 : null,
      next: page < lastPage ? page + 1 : null,
    },
  };
}
