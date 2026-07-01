import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const mod = require('pdf-parse');
console.log('typeof mod:', typeof mod);
console.log('typeof mod.default:', typeof mod.default);
console.log('keys:', Object.keys(mod).slice(0, 6));
