resource "aws_iam_user" "deploy_user" {
  name = "${var.project_name}-${var.environment}-${var.iam_user_name}"
}

resource "aws_iam_access_key" "deploy_user" {
  user = aws_iam_user.deploy_user.name
}

resource "aws_iam_user_policy" "deploy_policy" {
  name = "${var.project_name}-${var.environment}-deploy-policy"
  user = aws_iam_user.deploy_user.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:*",
          "s3:*",
          "iam:*",
          "logs:*",
          "cloudwatch:*"
        ]
        Resource = [
          "arn:aws:lambda:${var.aws_region}:*:function:${var.project_name}-${var.environment}-*",
          aws_s3_bucket.uploads.arn,
          "${aws_s3_bucket.uploads.arn}/*",
          aws_iam_role.lambda_role.arn,
          "arn:aws:logs:${var.aws_region}:*:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-terraform-state",
          "arn:aws:s3:::${var.project_name}-terraform-state/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem"
        ]
        Resource = "arn:aws:dynamodb:${var.aws_region}:*:table/${var.project_name}-terraform-lock"
      }
    ]
  })
}

output "deploy_user_access_key" {
  value     = aws_iam_access_key.deploy_user.id
  sensitive = true
}

output "deploy_user_secret_key" {
  value     = aws_iam_access_key.deploy_user.secret
  sensitive = true
}
