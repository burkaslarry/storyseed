import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const moduleValue = require('fontkit');
console.log({ keys: Object.keys(moduleValue), hasCreate: typeof moduleValue.create, hasDefaultCreate: typeof moduleValue.default?.create });
