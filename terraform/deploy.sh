#!/bin/bash

set -e

if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL is not set in .env"
    exit 1
fi

ENV=${1:-dev}

if [ "$ENV" != "dev" ] && [ "$ENV" != "prod" ]; then
    echo "Error: Environment must be either 'dev' or 'prod'"
    exit 1
fi

echo "Deploying to $ENV environment..."

echo "Building Lambda function..."
cd lambda

rm -rf dist
mkdir -p dist/node_modules/.prisma/client
mkdir -p dist/node_modules/@prisma/client

echo "Installing dependencies..."
npm install

echo "Generating Prisma client..."
npx prisma generate

echo "Building with esbuild..."
npm run build

mkdir -p dist/node_modules/.prisma/client
mkdir -p dist/node_modules/@prisma/client

cp -r node_modules/.prisma/client/* dist/node_modules/.prisma/client/
cp -r node_modules/@prisma/client/* dist/node_modules/@prisma/client/
cp prisma/schema.prisma dist/

cd ..

echo "Running Terraform..."
terraform init -backend-config="backend-${ENV}.hcl" -reconfigure
terraform plan -var-file="${ENV}.tfvars" -var="database_url=${DATABASE_URL}"
terraform apply -var-file="${ENV}.tfvars" -var="database_url=${DATABASE_URL}" -auto-approve