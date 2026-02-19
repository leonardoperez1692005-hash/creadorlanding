import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Create superadmin user
    const hashedPassword = await bcrypt.hash('admin123', 10)

    const superadmin = await prisma.user.upsert({
        where: { email: 'admin@staticlaunch.com' },
        update: {},
        create: {
            email: 'admin@staticlaunch.com',
            password: hashedPassword,
            name: 'Super Admin',
            role: 'superadmin',
            status: 'active',
        },
    })

    console.log('✅ Created superadmin user:', superadmin.email)

    // Create a test user (regular user)
    const userPassword = await bcrypt.hash('user123', 10)

    const testUser = await prisma.user.upsert({
        where: { email: 'user@test.com' },
        update: {},
        create: {
            email: 'user@test.com',
            password: userPassword,
            name: 'Test User',
            role: 'user',
            status: 'active',
        },
    })

    console.log('✅ Created test user:', testUser.email)

    // Create a test license
    const license = await prisma.license.upsert({
        where: { key: 'SL-TEST-1234' },
        update: {},
        create: {
            key: 'SL-TEST-1234',
            userId: testUser.id,
            domain: 'localhost',
            status: 'active',
        },
    })

    console.log('✅ Created test license:', license.key)

    console.log('🌱 Seed completed!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
