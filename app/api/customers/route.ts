export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, ok, created, unauthorized, handleError } from '@/lib/api-utils';
import { customerSchema } from '@/lib/validations';

export async function GET(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  const { searchParams } = req.nextUrl;
  const search = searchParams.get('search') || '';
  const phone = searchParams.get('phone') || '';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  const where: any = {};
  if (phone) where.phone = { contains: phone };
  if (search) where.OR = [
    { name: { contains: search, mode: 'insensitive' } },
    { nameAr: { contains: search, mode: 'insensitive' } },
    { phone: { contains: search } },
    { email: { contains: search, mode: 'insensitive' } },
  ];

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where, orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit, take: limit,
      include: { _count: { select: { sales: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return ok({ data, meta: { total, page, limit } });
}

export async function POST(req: NextRequest) {
  const { dbUser } = await getAuthUser();
  if (!dbUser) return unauthorized();
  try {
    const body = customerSchema.parse(await req.json());
    const customer = await prisma.customer.create({ data: body });
    return created(customer);
  } catch (e) { return handleError(e); }
}
