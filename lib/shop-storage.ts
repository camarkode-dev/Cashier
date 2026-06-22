import { randomUUID } from 'crypto';
import { createAdminClient } from './supabase/admin';

export const SHOP_RECEIPT_BUCKET = 'shop-payment-receipts';

export type StoredReceiptImage = {
  path: string;
  publicUrl: string;
  name: string;
  size: number;
  contentType: string;
};

async function ensureBucket() {
  const admin = createAdminClient();
  if (!admin) throw new Error('Storage admin client unavailable');

  const buckets = await admin.storage.listBuckets();
  const exists = buckets.data?.some((bucket) => bucket.name === SHOP_RECEIPT_BUCKET);
  if (!exists) {
    const created = await admin.storage.createBucket(SHOP_RECEIPT_BUCKET, { public: true });
    if (created.error) throw created.error;
  }

  return admin;
}

export async function uploadShopReceiptImage(file: File): Promise<StoredReceiptImage> {
  const admin = await ensureBucket();
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^\w.\-]+/g, '_');
  const path = `${new Date().getFullYear()}/${randomUUID()}-${safeName}`;

  const { error } = await admin.storage.from(SHOP_RECEIPT_BUCKET).upload(path, buffer, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;

  const { data } = admin.storage.from(SHOP_RECEIPT_BUCKET).getPublicUrl(path);

  return {
    path,
    publicUrl: data.publicUrl,
    name: file.name,
    size: file.size,
    contentType: file.type || 'application/octet-stream',
  };
}
