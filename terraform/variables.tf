variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "project name"
  type        = string
  default     = "newfish"
}

variable "environment" {
  description = "environment (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "allowed_origins" {
  description = "Allowed origins for CORS"
  type        = list(string)
  default     = ["*"] # dev
}

variable "database_url" {
  description = "Database connection URL"
  type        = string
  sensitive   = true
}

variable "iam_user_name" {
  type        = string
  description = "Name of the IAM user to create"
  default     = "newfish-deploy-user"
}
