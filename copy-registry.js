import { copyFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const source = resolve(process.cwd(), 'registry.bifrost');
const destination = resolve(process.cwd(), 'dist', 'registry.bifrost');

if (!existsSync(source)) {
  console.error('Source file not found:', source);
  process.exit(1);
}

copyFileSync(source, destination);
console.log('Copied registry.bifrost to dist/');