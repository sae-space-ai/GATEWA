#!/usr/bin/env node

/**
 * GATEWA - Script de Verificación de Seguridad
 * Comprueba que no hay secrets expuestos, localhost incorrecto, etc.
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

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║         GATEWA - Verificación de Seguridad                    ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

// 1. Check .gitignore includes .env
console.log('📋 Checking .gitignore...');
const gitignore = readFileSync(join(ROOT, '.gitignore'), 'utf-8');
check(gitignore.includes('.env'), '.env is in .gitignore');
check(gitignore.includes('local-bridge/.env'), 'local-bridge/.env is in .gitignore');

// 2. Check no hardcoded secrets in cloud code
console.log('\n📋 Checking for hardcoded secrets in cloud code...');
const apiFiles = ['api/chat.ts', 'api/health.ts', 'api/models.ts'];
for (const file of apiFiles) {
  if (existsSync(join(ROOT, file))) {
    const content = readFileSync(join(ROOT, file), 'utf-8');
    check(
      !content.match(/GATEWA_BRIDGE_SECRET\s*=\s*['"][a-zA-Z0-9]{16,}['"]/),
      `${file}: No hardcoded GATEWA_BRIDGE_SECRET`
    );
    check(
      !content.match(/Bearer\s+[a-zA-Z0-9]{16,}/),
      `${file}: No hardcoded Bearer tokens`
    );
  }
}

// 3. Check no localhost Ollama URLs in cloud code
console.log('\n📋 Checking for localhost Ollama URLs in cloud code...');
for (const file of apiFiles) {
  if (existsSync(join(ROOT, file))) {
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
}

// 4. Check frontend doesn't have secrets
console.log('\n📋 Checking frontend for secrets...');
const srcFiles = ['src/App.tsx', 'src/types.ts'];
for (const file of srcFiles) {
  if (existsSync(join(ROOT, file))) {
    const content = readFileSync(join(ROOT, file), 'utf-8');
    check(
      !content.includes('GATEWA_BRIDGE_SECRET'),
      `${file}: No GATEWA_BRIDGE_SECRET reference`
    );
    check(
      !content.includes('127.0.0.1:11434'),
      `${file}: No Ollama URL`
    );
  }
}

// 5. Check .env.example has no real secrets
console.log('\n📋 Checking .env.example files...');
if (existsSync(join(ROOT, '.env.example'))) {
  const envExample = readFileSync(join(ROOT, '.env.example'), 'utf-8');
  check(
    envExample.includes('your-secret-here') || envExample.includes('CHANGE_ME'),
    '.env.example uses placeholder values'
  );
}

if (existsSync(join(ROOT, 'local-bridge/.env.example'))) {
  const gwEnvExample = readFileSync(join(ROOT, 'local-bridge/.env.example'), 'utf-8');
  check(
    gwEnvExample.includes('CHANGE_ME'),
    'local-bridge/.env.example uses placeholder values'
  );
}

// 6. Check gateway binds to localhost only
console.log('\n📋 Checking bridge bind address...');
if (existsSync(join(ROOT, 'local-bridge/src/index.js'))) {
  const bridgeCode = readFileSync(join(ROOT, 'local-bridge/src/index.js'), 'utf-8');
  check(
    bridgeCode.includes("'127.0.0.1'"),
    'Bridge binds to 127.0.0.1 (localhost only)'
  );
}

// 7. Check no .env files exist (only .env.example)
console.log('\n📋 Checking for .env files...');
const envFiles = globSync('**/.env', { cwd: ROOT });
check(envFiles.length === 0, `No .env files found (${envFiles.length} found)`);

// Summary
console.log('\n' + '═'.repeat(62));
if (errors === 0) {
  console.log(`✅ All security checks passed! (${warnings} warnings)`);
  process.exit(0);
} else {
  console.log(`❌ ${errors} security check(s) failed! (${warnings} warnings)`);
  process.exit(1);
}
