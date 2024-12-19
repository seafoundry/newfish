#!/bin/bash

RANDOM_SUFFIX=$(openssl rand -hex 4)
BUCKET_NAME="newfish-terraform-state-${RANDOM_SUFFIX}"

aws s3 mb "s3://${BUCKET_NAME}" --region us-east-1

aws s3api put-bucket-versioning \
    --bucket "${BUCKET_NAME}" \
    --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
    --bucket "${BUCKET_NAME}" \
    --server-side-encryption-configuration \
    '{"Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]}'

sed -i.bak "s/bucket = \".*\"/bucket = \"${BUCKET_NAME}\"/" main.tf

echo "Created bucket: ${BUCKET_NAME}"
echo "Updated main.tf with new bucket name"
echo "You can now run: terraform init"