import { defineConfig } from 'prisma/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: (() => {
      const base = process.env.DATABASE_URL!;
      if (base.includes('sslmode=')) return base;
      return base.includes('?') ? `${base}&sslmode=require` : `${base}?sslmode=require`;
    })(),
  },
});
