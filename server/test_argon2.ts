import argon2 from 'argon2';

async function main() {
  const password = 'password';
  
  console.log('Creating new hash...');
  const hash = await argon2.hash(password);
  console.log('Hash:', hash);
  
  console.log('Verifying hash...');
  const isValid = await argon2.verify(hash, password);
  console.log('Is valid:', isValid);
}

main().catch(console.error);
