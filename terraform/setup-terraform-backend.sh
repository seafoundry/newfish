#!/bin/bash

RANDOM_SUFFIX=$(openssl rand -hex 4)
BUCKET_NAME="terraform-state-${RANDOM_SUFFIX}"

aws s3 mb "s3://${BUCKET_NAME}" --region us-east-1

aws s3api put-bucket-versioning \
    --bucket "${BUCKET_NAME}" \
    --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
    --bucket "${BUCKET_NAME}" \
    --server-side-encryption-configuration \
    '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'

cat > main.tf << EOF
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "${BUCKET_NAME}"
    key    = "terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}
EOF

echo "Created bucket: ${BUCKET_NAME}"
echo "Updated main.tf with new bucket name"
echo "You can now run: terraform init"