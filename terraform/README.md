# terraform ディレクトリについて

このディレクトリは AWSインフラ (S3, Lambda, Cognito, API Gateway など) をTerraformでIaC管理するために使用します。

## 構成 (例)
```
terraform/
├── environments/      # dev, prod, staging など実環境ごとの定義
├── modules/           # サービス別の再利用モジュール
├── lambda-functions/  # (現時点: Lambda関数コード格納)
```

- 具体的なサービス・リソースごとのサンプルは `modules/` を確認。
- Lambda等の関数コードも `lambda-functions/`にまとめています。
- 各ディレクトリでREADMEやサンプルに従ってご利用ください。

