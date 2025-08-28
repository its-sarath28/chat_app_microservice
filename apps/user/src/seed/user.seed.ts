import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../../../user/entity/user.entity'; // <-- FIXED PATH
import * as path from 'path';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [path.join(__dirname, '../../../user/entity/*.entity.{ts,js}')],
  synchronize: true,
});

async function seed() {
  const dataSource = await AppDataSource.initialize();
  const userRepo = dataSource.getRepository(User);

  const users: User[] = [];

  for (let i = 0; i < 50; i++) {
    const user = userRepo.create({
      fullName: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      username: faker.internet.username().toLowerCase(),
      imageUrl: faker.image.avatarGitHub(),
      password: await bcrypt.hash('password123', 10),
      lastSeen: faker.date.recent({ days: 14 }),
    });
    users.push(user);
  }

  await userRepo.save(users);
  console.log('✅ Seeded 50 fake users');

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error seeding users:', err);
  process.exit(1);
});
