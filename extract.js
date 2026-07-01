const fs = require('fs');
const content = fs.readFileSync('C:\\Users\\sand3\\.gemini\\antigravity\\brain\\93313115-e110-4475-be01-c791d846ae16\\.system_generated\\steps\\587\\content.md', 'utf8');

const regex = /```(?:typescript|ts)?\n([\s\S]*?)```/g;
let match;
while ((match = regex.exec(content)) !== null) {
  if (match[1].includes('prisma.config.ts') || match[1].includes('PrismaClient')) {
    console.log('--- CODE BLOCK ---');
    console.log(match[1]);
  }
}
