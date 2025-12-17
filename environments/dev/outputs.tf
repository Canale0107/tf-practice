output "s3_bucket_id" {
  description = "S3バケットID"
  value       = module.s3_static_web.bucket_id
}

output "s3_website_endpoint" {
  description = "S3静的Webサイトのエンドポイント"
  value       = module.s3_static_web.website_endpoint
}

