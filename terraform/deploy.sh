#!/bin/bash

if [ -z "$1" ]; then
    echo "Usage: ./deploy.sh <environment>"
    echo "Example: ./deploy.sh dev"
    exit 1
fi

ENV=$1

echo "Building Lambda function..."
cd lambda

rm -rf dist
rm -rf node_modules

npm install --production

# dev deps for ts compilation
npm install --save-dev typescript @types/node @types/aws-lambda

npm run build

cp -r node_modules dist/

cd ..

if [ ! -f "lambda/dist/index.js" ]; then
    echo "Lambda build failed - index.js not found"
    exit 1
fi

terraform init

echo "Planning Terraform deployment for $ENV environment..."
terraform plan -var-file="$ENV.tfvars" -out=tfplan

read -p "Apply changes? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Applying Terraform changes..."
    terraform apply tfplan
else
    echo "Deployment cancelled"
fi 