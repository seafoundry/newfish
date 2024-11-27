# NewFish

A brief description of your project should go here.

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
2. Set up IAM user:
   - Create new IAM user
   - Attach S3 permissions, Lambda permissions and IAM permissions.
   - Generate access credentials:
     - `AWS_ACCESS_KEY_ID`
     - `AWS_SECRET_ACCESS_KEY`

### 3. Database Setup

1. Create a PostgreSQL database
2. Configure environment variable:
   - Set `DATABASE_URL` with your connection string
   - Format: `postgresql://user:password@host:port/database`

## Environment Variables

Copy values into `.env` file in the root directory.
