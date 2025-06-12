#!/usr/bin/env node

import bcrypt from 'bcrypt';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
});

function promptPassword(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (password) => {
      resolve(password);
    });
  });
}

async function hashPassword() {
  // Check if we're being piped to
  const isPiped = !process.stdout.isTTY;

  if (!isPiped) {
    console.log('This script will generate a bcrypt hash for your password.');
    console.log('You can pipe directly to wrangler: node scripts/hash-password.js | npx wrangler secret put APP_PASSWORD\n');
  }

  const password = await promptPassword(isPiped ? '' : 'Enter password to hash: ');

  if (!password) {
    console.error('Error: Password cannot be empty');
    process.exit(1);
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    if (isPiped) {
      // When piped, output only the hash
      console.log(hash);
    } else {
      // When interactive, show helpful information
      console.log('\nYour bcrypt hash:');
      console.log(hash);
      console.log('\nTo set this as a secret, run:');
      console.log('npx wrangler secret put APP_PASSWORD');
      console.log('Then paste the hash above when prompted.');
      console.log('\nOr pipe directly:');
      console.log('node scripts/hash-password.js | npx wrangler secret put APP_PASSWORD');
    }
  } catch (error) {
    console.error('Error generating hash:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

hashPassword();
