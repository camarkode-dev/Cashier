import { ProductDetail } from '@/components/shop/product-detail';

export default function ProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return <ProductDetail productId={id} />;
}
