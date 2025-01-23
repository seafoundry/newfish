## Prerequisites

Before you begin, ensure you have:

- Node.js installed
- npm package manager

## Setup Instructions

### 1. Authentication Setup

1. Create an account at [clerk.com](https://clerk.com)
2. Set up a new application
3. Configure authentication keys:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Set up webhook:
   - Create a new webhook endpoint
   - Configure for `user.created` event
   - Set callback URL to `/api/webhooks/clerk`

### 2. AWS Configuration

1. Create an AWS account if you don't have one
2. Set up IAM credentials using one of these options:

   Option A: Manual IAM Setup

   - Create new IAM user
   - Attach these permissions:
     - AmazonS3FullAccess
     - AWSLambda_FullAccess
     - IAMFullAccess
   - Generate access credentials

   Option B: Use Terraform (Recommended)

   - Create temporary IAM user with admin access
   - Use Terraform to create proper IAM user (see Terraform Setup)
   - Delete temporary admin user after setup

### 3. Terraform Setup

1. Navigate to the terraform directory:
   ```bash
   cd terraform
   ```
2. Set up the Terraform backend:

   ```bash
   chmod +x setup-terraform-backend.sh
   ./setup-terraform-backend.sh
   ```

   This script will:

   - Create an S3 bucket with a random suffix
   - Enable versioning and encryption
   - Update main.tf with the bucket configuration

3. Initialize and apply Terraform:
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```
   This will create:
   - Required IAM user with proper permissions
   - Other AWS resources needed for the project
   - Output the new IAM credentials to use

### 4. Database Setup

1. Create a PostgreSQL database
   - Recommended: Use a managed PostgreSQL service like [Neon](https://neon.tech) or AWS RDS
   - These services provide automatic backups, scaling, and maintenance
2. Configure environment variable:
   - Set `DATABASE_URL` with your connection string
   - Format: `postgresql://user:password@host:port/database`

## Environment Variables

Copy values into `.env` file in the root directory.
