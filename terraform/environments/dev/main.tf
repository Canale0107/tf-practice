terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 4.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "random_id" "suffix" {
  byte_length = 4
}

module "s3_static_web" {
  source                          = "../../modules/s3"
  bucket_name                     = "tfpractice-dev-static-web-${random_id.suffix.hex}"
  enable_static_hosting           = true
  block_public_acls               = false
  block_public_policy             = false
  ignore_public_acls              = false
  restrict_public_buckets         = false
  create_lambda_deployment_bucket = false
  tags = {
    Name   = "dev-tfpractice-s3-web"
    system = "tfpractice"
    env    = "dev"
  }
}
