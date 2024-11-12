data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/dist"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "csv_validator" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.project_name}-${var.environment}-csv-validator"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 128

  environment {
    variables = {
      REQUIRED_COLUMNS_GENETICS    = "Local ID/Genet Propagation,Species"
      REQUIRED_COLUMNS_NURSERY     = "Genet ID,Quantity,Nursery"
      REQUIRED_COLUMNS_OUTPLANTING = "Gonet ID,QTY (Fragments),Grouping (cluster or tag)"
    }
  }
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.csv_validator.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.uploads.arn
}
