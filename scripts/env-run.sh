#!/bin/bash
# Decrypt .env, run a command, then re-encrypt
# Usage: ENV_PASS=mypassword ./scripts/env-run.sh <command...>
# Example: ENV_PASS=mypassword ./scripts/env-run.sh node src/server.js

if [ $# -eq 0 ]; then
  echo "Usage: ENV_PASS=mypassword ./scripts/env-run.sh <command...>"
  exit 1
fi

if [ -z "$ENV_PASS" ]; then
  echo "Usage: ENV_PASS=mypassword ./scripts/env-run.sh <command...>"
  exit 1
fi

if [ ! -f .env.enc ]; then
  echo "No .env.enc found. Run ENV_PASS=mypassword ./scripts/env-encrypt.sh first."
  exit 1
fi

# Decrypt
openssl enc -d -aes-256-cbc -pbkdf2 -in .env.enc -out .env -pass "env:ENV_PASS"
if [ $? -ne 0 ]; then
  echo "Decryption failed."
  rm -f .env
  exit 1
fi

# Run command
"$@"
EXIT_CODE=$?

# Re-encrypt and wipe
if [ -f .env ]; then
  openssl enc -aes-256-cbc -pbkdf2 -salt -in .env -out .env.enc -pass "env:ENV_PASS" 2>/dev/null
  rm -P .env 2>/dev/null || rm -f .env
fi

exit $EXIT_CODE
