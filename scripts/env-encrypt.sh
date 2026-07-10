#!/bin/bash
# Encrypt .env → .env.enc, then wipe plaintext .env
# Usage: ENV_PASS=mypassword ./scripts/env-encrypt.sh

if [ ! -f .env ]; then
  echo "No .env file found."
  exit 1
fi

if [ -z "$ENV_PASS" ]; then
  echo "Usage: ENV_PASS=mypassword ./scripts/env-encrypt.sh"
  exit 1
fi

echo "Encrypting .env → .env.enc..."
openssl enc -aes-256-cbc -pbkdf2 -salt -in .env -out .env.enc -pass "env:ENV_PASS"

if [ $? -eq 0 ]; then
  echo "Wiping plaintext .env..."
  rm -P .env 2>/dev/null || rm -f .env
  echo "Done. .env encrypted to .env.enc"
  echo "To decrypt: ENV_PASS=mypassword ./scripts/env-decrypt.sh"
else
  echo "Encryption failed."
  exit 1
fi
