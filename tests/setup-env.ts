import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 1) Load standard .env from cwd if present
dotenv.config();

// 2) If DATABASE_URL is still missing, fall back to .env.example
try {
  if (!process.env.DATABASE_URL) {
    const examplePath = path.join(process.cwd(), '.env.example');
    if (fs.existsSync(examplePath)) {
      const example = dotenv.parse(fs.readFileSync(examplePath));
      for (const [k, v] of Object.entries(example)) {
        if (!process.env[k]) process.env[k] = v as string;
      }
    }
  }
} catch {
  // ignore in tests
}
