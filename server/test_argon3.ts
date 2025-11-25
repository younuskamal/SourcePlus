import argon2 from 'argon2';

async function main() {
  const password = 'password';
  const hash = '$argon2id$v=19$m=65536,t=3,p=4$3OtwdnUP+TaqHMtBWmiBSA$yGX71FhBzVrBUd0IiMBLn71jgVplosEFnzewHi2JFss';
  
  console.log('Testing new argon2 hash...');
  const isValid = await argon2.verify(hash, password);
  console.log('Is valid:', isValid);
}

main().catch(console.error);
