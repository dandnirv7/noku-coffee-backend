import { Prisma } from 'generated/prisma/client';

export const categories: Prisma.CategoryCreateManyInput[] = [
  {
    id: 'cmkv13pvb0001ogp0a6a81fod',
    name: 'Single Origin',
    slug: 'single-origin',
  },
  {
    id: 'cmkv13v230002ogp01wfhinh1',
    name: 'Espresso Blends',
    slug: 'espresso-blends',
  },
  {
    id: 'cmkv13zdz0003ogp0u8sn3n7r',
    name: 'Manual Brew Gear',
    slug: 'manual-brew-gear',
  },
  {
    id: 'cmkv1455j0004ogp092vszrvu',
    name: 'Bundling Packages',
    slug: 'bundling-packages',
  },
  {
    id: 'cmkv148xx0005ogp08m5c0gc8',
    name: 'Merchandise',
    slug: 'merchandise',
  },
];
