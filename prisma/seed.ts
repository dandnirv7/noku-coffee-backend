import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'generated/prisma/client';
import { Pool } from 'pg';
import { getAccounts } from './data/accounts';
import { addresses } from './data/addresses';
import { bundleItems } from './data/bundle-items';
import { cartItems } from './data/cart-items';
import { carts } from './data/carts';
import { categories } from './data/categories';
import { productDiscounts } from './data/product-discounts';
import { products } from './data/products';
import { promoCodes } from './data/promo-codes';
import { users } from './data/users';
import { verifications } from './data/verifications';
import { wishlistItems } from './data/wishlist-items';

const pool = new Pool({
  connectionString: process.env.DIRECT_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Seeding users...');
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding addresses...');
  await prisma.address.createMany({
    data: addresses,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding categories...');
  await prisma.category.createMany({
    data: categories,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding products...');
  await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding accounts...');
  await prisma.account.createMany({
    data: await getAccounts(),
    skipDuplicates: true,
  });

  console.log('🌱 Seeding verifications...');
  await prisma.verification.createMany({
    data: verifications,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding carts...');
  await prisma.cart.createMany({
    data: carts,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding cart items...');
  await prisma.cartItem.createMany({
    data: cartItems,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding wishlist items...');
  await prisma.wishlistItem.createMany({
    data: wishlistItems,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding bundle items...');
  await prisma.bundleItem.createMany({
    data: bundleItems,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding promo codes...');
  await prisma.promoCode.createMany({
    data: promoCodes,
    skipDuplicates: true,
  });

  console.log('🌱 Seeding product discounts...');
  await prisma.productDiscount.createMany({
    data: productDiscounts,
    skipDuplicates: true,
  });
}

main()
  .then(() => console.log('✅ Seeding completed'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
