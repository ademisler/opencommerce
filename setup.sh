#!/bin/bash

# Setup script for OpenCommerce

# Copy .env.example to .env.local if it doesn't exist
if [ ! -f .env.local ]; then
  cp .env.example .env.local
  echo "Created .env.local from .env.example"
else
  echo ".env.local already exists"
fi

# Install dependencies
npm install

cat <<'EOM'

Please edit the .env.local file and fill in your credentials:
- Supabase keys: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- WooCommerce API credentials: WOOCOMMERCE_API_URL, WOOCOMMERCE_API_KEY, WOOCOMMERCE_API_SECRET
 - Additional keys for other platforms if needed

After filling in the environment variables, run:

  npm run dev

This will start the development server.
EOM
