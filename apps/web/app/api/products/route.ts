import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, created, unauthorized, forbidden, handleError, audit } from '@/lib/api-utils';
import { productSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();

  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || undefined;
  const branchId = searchParams.get('branchId') || dbUser.branchId || undefined;
  const withInventory = searchParams.get('withInventory') === 'true';
  const lowStock = searchParams.get('lowStock') === 'true';
  const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));

  const where: any = { isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { nameAr: { contains: search, mode: 'insensitive' } },
      { barcode: { contains: search } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (lowStock && branchId) {
    where.inventory = { some: { branchId, quantity: { lte: prisma.inventory.fields.minStock } } };
  }

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        inventory: withInventory
          ? { where: branchId ? { branchId } : undefined }
          : branchId
          ? { where: { branchId }, take: 1 }
          : false,
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return ok({ data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser('ADMIN');
  if (!dbUser) return unauthorized();
  if (dbUser.role === 'CASHIER') return forbidden();

  try {
    const body = productSchema.parse(await req.json());
    const { initialStock = 0, branchId: reqBranchId, ...productData } = body;
    const targetBranch = reqBranchId || dbUser.branchId;

    const product = await prisma.$transaction(async (tx) => {
      const p = await tx.product.create({ data: productData, include: { category: true } });

      // Auto-create inventory for all branches
      const branches = await tx.branch.findMany({ select: { id: true } });
      await tx.inventory.createMany({
        data: branches.map((b) => ({
          productId: p.id,
          branchId: b.id,
          quantity: b.id === targetBranch ? initialStock : 0,
          minStock: productData.minStock ?? 5,
        })),
        skipDuplicates: true,
      });

      return p;
    });

    await audit(dbUser.id, 'CREATE', 'product', product.id, { name: product.name });
    return created(product);
  } catch (e) {
    return handleError(e);
  }
}
