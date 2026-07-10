#!/bin/bash
# Decrypt .env.enc → .env for use
# Usage: ENV_PASS=mypassword ./scripts/env-decrypt.sh

if [ ! -f .env.enc ]; then
  echo "No .env.enc file found."
  exit 1
fi

if [ -z "$ENV_PASS" ]; then
  echo "Usage: ENV_PASS=mypassword ./scripts/env-decrypt.sh"
  exit 1
fi

echo "Decrypting .env.enc → .env..."
openssl enc -d -aes-256-cbc -pbkdf2 -in .env.enc -out .env -pass "env:ENV_PASS"

if [ $? -eq 0 ]; then
  echo "Done. .env is ready."
  echo "Re-encrypt after use: ENV_PASS=mypassword ./scripts/env-encrypt.sh"
else
  echo "Decryption failed (wrong password or corrupted file)."
  rm -f .env
  exit 1
fi
