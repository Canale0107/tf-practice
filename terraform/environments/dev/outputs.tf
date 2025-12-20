output "s3_bucket_id" {
  description = "S3バケットID"
  value       = module.s3_static_web.bucket_id
}

output "s3_website_endpoint" {
  description = "S3静的Webサイトのエンドポイント"
  value       = module.s3_static_web.website_endpoint
}

output "acm_dns_validation_options" {
  description = "ACM証明書バリデーション用DNS情報 (CNAME)"
  value = aws_acm_certificate.note_app_cert.domain_validation_options
}

output "cloudfront_domain_name" {
  description = "CloudFront ドメイン (CNAMEエイリアスポイント)"
  value       = aws_cloudfront_distribution.note_app.domain_name
}
