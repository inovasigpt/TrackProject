import 'dotenv/config';
import { db, users } from './index';
import { hashPassword } from '../lib/auth';
import { eq } from 'drizzle-orm';

async function seed() {
    console.log('🌱 Seeding database...');

    try {
        const email = 'admin@pmo.com';
        const password = 'admin';
        const username = 'Admin';

        // Check if admin exists
        const [existing] = await db.select().from(users).where(eq(users.email, email));

        if (existing) {
            console.log('⚠️  Admin user already exists');
            process.exit(0);
        }

        const hashedPassword = await hashPassword(password);

        await db.insert(users).values({
            username,
            email,
            password: hashedPassword,
            role: 'admin',
            status: 'approved', // Bypass pending
            avatar: 'https://i.pravatar.cc/150?u=admin',
        });

        console.log('✅ Admin user created successfully');
        console.log('   Email: ' + email);
        console.log('   Password: ' + password);
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }

    process.exit(0);
}

seed();
