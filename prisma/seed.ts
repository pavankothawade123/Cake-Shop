import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'birthday-cakes' },
      update: {},
      create: {
        name: 'Birthday Cakes',
        slug: 'birthday-cakes',
        description: 'Celebrate your special day with our delicious birthday cakes',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'wedding-cakes' },
      update: {},
      create: {
        name: 'Wedding Cakes',
        slug: 'wedding-cakes',
        description: 'Elegant and beautiful cakes for your perfect wedding day',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'custom-cakes' },
      update: {},
      create: {
        name: 'Custom Cakes',
        slug: 'custom-cakes',
        description: 'Design your own cake with our custom options',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'cupcakes' },
      update: {},
      create: {
        name: 'Cupcakes',
        slug: 'cupcakes',
        description: 'Delightful mini treats perfect for any occasion',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'pastries' },
      update: {},
      create: {
        name: 'Pastries',
        slug: 'pastries',
        description: 'Fresh baked pastries and desserts',
      },
    }),
  ])

  console.log(`Created ${categories.length} categories`)

  // Create products
  const products = [
    {
      name: 'Classic Chocolate Cake',
      slug: 'classic-chocolate-cake',
      description: 'Rich and moist chocolate cake with creamy chocolate ganache. A timeless favorite for chocolate lovers.',
      basePrice: 599,
      images: [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800',
        'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800',
      ],
      categoryId: categories[0].id,
    },
    {
      name: 'Vanilla Dream Cake',
      slug: 'vanilla-dream-cake',
      description: 'Light and fluffy vanilla sponge cake with vanilla buttercream frosting and fresh berries.',
      basePrice: 549,
      images: [
        'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=800',
      ],
      categoryId: categories[0].id,
    },
    {
      name: 'Red Velvet Delight',
      slug: 'red-velvet-delight',
      description: 'Classic red velvet cake with cream cheese frosting. Perfect for celebrations.',
      basePrice: 649,
      images: [
        'https://images.unsplash.com/photo-1616541823729-00fe0aacd32c?w=800',
      ],
      categoryId: categories[0].id,
    },
    {
      name: 'Strawberry Bliss',
      slug: 'strawberry-bliss',
      description: 'Fresh strawberry cake with layers of whipped cream and real strawberries.',
      basePrice: 699,
      images: [
        'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800',
      ],
      categoryId: categories[0].id,
    },
    {
      name: 'Elegant White Wedding Cake',
      slug: 'elegant-white-wedding-cake',
      description: 'Three-tier elegant white cake with delicate fondant flowers and pearl decorations.',
      basePrice: 2999,
      images: [
        'https://images.unsplash.com/photo-1535254973040-607b474cb50d?w=800',
      ],
      categoryId: categories[1].id,
    },
    {
      name: 'Rose Gold Wedding Cake',
      slug: 'rose-gold-wedding-cake',
      description: 'Stunning rose gold themed wedding cake with edible gold accents.',
      basePrice: 3499,
      images: [
        'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=800',
      ],
      categoryId: categories[1].id,
    },
    {
      name: 'Custom Photo Cake',
      slug: 'custom-photo-cake',
      description: 'Personalized cake with your favorite photo printed on edible paper.',
      basePrice: 799,
      images: [
        'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=800',
      ],
      categoryId: categories[2].id,
    },
    {
      name: 'Rainbow Layer Cake',
      slug: 'rainbow-layer-cake',
      description: 'Colorful six-layer rainbow cake perfect for kids parties.',
      basePrice: 899,
      images: [
        'https://images.unsplash.com/photo-1557979619-445218f326b9?w=800',
      ],
      categoryId: categories[2].id,
    },
    {
      name: 'Chocolate Cupcakes (6 pcs)',
      slug: 'chocolate-cupcakes-6',
      description: 'Box of 6 delicious chocolate cupcakes with swirled buttercream.',
      basePrice: 299,
      images: [
        'https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?w=800',
      ],
      categoryId: categories[3].id,
    },
    {
      name: 'Assorted Cupcakes (12 pcs)',
      slug: 'assorted-cupcakes-12',
      description: 'Box of 12 assorted flavor cupcakes - chocolate, vanilla, red velvet, and strawberry.',
      basePrice: 549,
      images: [
        'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800',
      ],
      categoryId: categories[3].id,
    },
    {
      name: 'Fresh Fruit Tart',
      slug: 'fresh-fruit-tart',
      description: 'Buttery tart shell filled with pastry cream and topped with fresh seasonal fruits.',
      basePrice: 449,
      images: [
        'https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=800',
      ],
      categoryId: categories[4].id,
    },
    {
      name: 'Chocolate Eclairs (4 pcs)',
      slug: 'chocolate-eclairs-4',
      description: 'Classic French eclairs filled with chocolate cream and topped with chocolate glaze.',
      basePrice: 349,
      images: [
        'https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?w=800',
      ],
      categoryId: categories[4].id,
    },
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: product,
    })
  }

  console.log(`Created ${products.length} products`)

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cakeshop.com' },
    update: {},
    create: {
      email: 'admin@cakeshop.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'ADMIN',
    },
  })

  console.log(`Created admin user: ${adminUser.email}`)

  // Create a sample customer
  const customerPassword = await bcrypt.hash('customer123', 10)

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      name: 'John Doe',
      password: customerPassword,
      role: 'USER',
    },
  })

  console.log(`Created sample customer: ${customerUser.email}`)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
