import { db, users } from '../src/db';

async function checkUsers() {
    const allUsers = await db.select().from(users);
    console.log('Total Users:', allUsers.length);
    allUsers.forEach(u => console.log(`- ${u.username} (${u.role})`));
    process.exit(0);
}

checkUsers().catch(console.error);
