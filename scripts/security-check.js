#!/usr/bin/env node

/**
 * Security verification script
 * Run: node scripts/security-check.js
 * 
 * Verifies:
 * 1. No secrets in source code
 * 2. No localhost Ollama URLs in cloud code
 * 3. .env files are in .gitignore
 * 4. No hardcoded tokens
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { globSync } from 'fs';

const ROOT = process.cwd();
let errors = 0;
let warnings = 0;

function check(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    errors++;
  } else {
    console.log(`  ✅ PASS: ${message}`);
  }
}

function warn(condition, message) {
  if (!condition) {
    console.warn(`  ⚠️  WARN: ${message}`);
    warnings++;
  }
}

console.log('\n🔒 Security Verification\n');

// 1. Check .gitignore includes .env
console.log('📋 Checking .gitignore...');
const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8');
check(gitignore.includes('.env'), '.env is in .gitignore');
check(gitignore.includes('local-gateway/.env'), 'local-gateway/.env is in .gitignore');

// 2. Check no hardcoded secrets in cloud code
console.log('\n📋 Checking for hardcoded secrets in cloud code...');
const apiFiles = ['api/chat.ts', 'api/health.ts', 'api/models.ts'];
for (const file of apiFiles) {
  const content = readFileSync(join(ROOT, file), 'utf-8');
  check(
    !content.match(/GATEWAY_SECRET\s*=\s*['"][a-zA-Z0-9]{16,}['"]/),
    `${file}: No hardcoded GATEWAY_SECRET`
  );
  check(
    !content.match(/Bearer\s+[a-zA-Z0-9]{16,}/),
    `${file}: No hardcoded Bearer tokens`
  );
}

// 3. Check no localhost Ollama URLs in cloud code
console.log('\n📋 Checking for localhost Ollama URLs in cloud code...');
for (const file of apiFiles) {
  const content = readFileSync(join(ROOT, file), 'utf-8');
  check(
    !content.includes('127.0.0.1:11434'),
    `${file}: No direct Ollama URL (127.0.0.1:11434)`
  );
  check(
    !content.includes('localhost:11434'),
    `${file}: No localhost Ollama URL`
  );
}

// 4. Check frontend doesn't have secrets
console.log('\n📋 Checking frontend for secrets...');
const srcFiles = ['src/App.tsx', 'src/types.ts'];
for (const file of srcFiles) {
  if (existsSync(join(ROOT, file))) {
    const content = readFileSync(join(ROOT, file), 'utf-8');
    check(
      !content.includes('GATEWAY_SECRET'),
      `${file}: No GATEWAY_SECRET reference`
    );
    check(
      !content.includes('127.0.0.1:11434'),
      `${file}: No Ollama URL`
    );
  }
}

// 5. Check .env.example has no real secrets
console.log('\n📋 Checking .env.example files...');
const envExample = readFileSync(join(ROOT, '.env.example'), 'utf-8');
check(
  envExample.includes('your-secret-here') || envExample.includes('CHANGE_ME'),
  '.env.example uses placeholder values'
);

const gwEnvExample = readFileSync(join(ROOT, 'local-gateway/.env.example'), 'utf-8');
check(
  gwEnvExample.includes('CHANGE_ME'),
  'local-gateway/.env.example uses placeholder values'
);

// 6. Check gateway binds to localhost only
console.log('\n📋 Checking gateway bind address...');
const gatewayCode = readFileSync(join(ROOT, 'local-gateway/src/index.js'), 'utf-8');
check(
  gatewayCode.includes("'127.0.0.1'"),
  'Gateway binds to 127.0.0.1 (localhost only)'
);

// Summary
console.log('\n' + '═'.repeat(50));
if (errors === 0) {
  console.log(`✅ All security checks passed! (${warnings} warnings)`);
} else {
  console.log(`❌ ${errors} security check(s) failed! (${warnings} warnings)`);
  process.exit(1);
}
