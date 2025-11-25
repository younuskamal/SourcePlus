import argon2 from 'argon2';

async function main() {
  const password = 'password';
  const hash1 = '$argon2id$v=19$m=65536,t=3,p=4$Bv08zWkpGaTqhqP7hNms1A$qmTjhxsXEbrVlZGvBG2ygKPBVj/6H2KPIkaH+JSAlAg';
  
  console.log('Testing argon2 verification...');
  const isValid = await argon2.verify(hash1, password);
  console.log('Is valid:', isValid);
}

main().catch(console.error);
