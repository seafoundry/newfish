
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
