# クイックスタートガイド

このガイドでは、Terraformを使用してAWSインフラを構築する手順を説明します。

## 📋 環境構成について

本プロジェクトは**Dev/Prod環境を完全分離**しています：

- **Dev環境**: `dev.note-app.kanare.dev` - 開発・テスト用（自由に破棄・再構築可能）
- **Prod環境**: `note-app.kanare.dev` - 本番環境（lifecycle保護あり）

各環境は独立したTerraform Stateで管理され、完全に分離されたAWSリソースを持ちます。

詳細: [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md)

## 前提条件

- AWSアカウントを持っている
- AWS CLIがインストール・設定済み
- Terraform >= 1.0 がインストール済み
- 適切なAWS認証情報が設定されている
- （オプション）Cloudflareアカウント（DNS自動管理を使用する場合）

## セットアップ手順

### 1. AWS認証情報の設定

```bash
# AWS CLIでプロファイルを設定
aws configure --profile your-profile-name
```

または、環境変数を設定：

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=ap-northeast-1
```

### 2. Backend Setupの実行（初回のみ）

**重要**: 本プロジェクトではS3バックエンドが必須です。初回のみ実行してください。

```bash
# Backend用のリソースを作成
cd terraform/backend-setup
terraform init
terraform apply
```

これにより以下が作成されます：
- S3バケット: `kanare-terraform-state-bucket`（バージョニング有効）
- DynamoDBテーブル: `terraform-state-locks`（State lock用）

詳細: [terraform/backend-setup/README.md](../terraform/backend-setup/README.md)

### 3. 環境の選択

どちらの環境をセットアップするか選択します：

#### Dev環境の場合（推奨：最初はDevから）

```bash
cd terraform/environments/dev
```

#### Prod環境の場合

```bash
cd terraform/environments/prod
```

### 4. 変数ファイルの設定

```bash
# サンプルファイルをコピー
cp terraform.tfvars.example terraform.tfvars

# 編集して必要な値を設定
vim terraform.tfvars  # またはお好きなエディタ
```

**必須の変数**:
- `env`: 環境名（dev または prod）
- `domain_name`: 静的サイトのドメイン
- `api_domain_name`: APIのドメイン

**オプションの変数**（Cloudflare DNS自動管理を使用する場合）:
- `enable_cloudflare_dns`: true に設定
- `cloudflare_api_token`: CloudflareのAPIトークン
- `cloudflare_zone_id`: CloudflareのZone ID

詳細: [cloudflare-terraform-guide.md](cloudflare-terraform-guide.md)

### 5. Terraformの初期化

```bash
terraform init
```

初回実行時、S3バックエンドの設定が完了します。

### 6. 実行計画の確認

```bash
terraform plan
```

作成されるリソースを確認します：
- CloudFront Distribution
- S3バケット（静的サイト用）
- ACM証明書（2つ：静的サイト用、API用）
- API Gateway（カスタムドメイン、レート制限付き）
- Lambda関数
- DynamoDB テーブル
- Cognito User Pool
- Cloudflare DNSレコード（有効化している場合）

### 7. インフラの作成

```bash
terraform apply
```

確認を求められたら `yes` を入力します。

**注意**:
- ACM証明書の検証には数分～10分程度かかります
- Cloudflare DNSレコードの伝播にも時間がかかる場合があります
- 全体で15～20分程度かかることがあります

## デプロイ後の確認

### 出力値の確認

```bash
terraform output
```

主な出力：
- `cloudfront_domain_name`: CloudFrontのドメイン
- `api_gateway_custom_domain`: APIのカスタムドメイン
- `cognito_user_pool_id`: Cognito User Pool ID
- `cognito_user_pool_client_id`: Cognito Client ID
- `dynamodb_table_name`: DynamoDBテーブル名

### ドメインへのアクセス確認

```bash
# 静的サイトにアクセス（ブラウザまたはcurl）
# Dev環境の場合
curl -I https://dev.note-app.kanare.dev

# Prod環境の場合
curl -I https://note-app.kanare.dev
```

### APIエンドポイントの確認

```bash
# APIのヘルスチェック
# Dev環境の場合
curl https://api-dev.note-app.kanare.dev/

# Prod環境の場合
curl https://api.note-app.kanare.dev/
```

**注意**: APIエンドポイントはCognito認証が必要です。認証なしでアクセスすると401エラーが返ります。

## フロントエンドのデプロイ

インフラ構築後、フロントエンドをデプロイします：

### 1. 環境変数の設定

```bash
cd frontend

# Dev環境の場合
cat > .env.production <<EOF
VITE_API_BASE_URL=https://api-dev.note-app.kanare.dev
VITE_AWS_REGION=ap-northeast-1
VITE_USER_POOL_ID=$(cd ../terraform/environments/dev && terraform output -raw cognito_user_pool_id)
VITE_USER_POOL_CLIENT_ID=$(cd ../terraform/environments/dev && terraform output -raw cognito_user_pool_client_id)
EOF
```

### 2. ビルド

```bash
npm ci
npm run build
```

### 3. S3へのデプロイ

```bash
# Dev環境の場合
aws s3 sync dist/ s3://dev.note-app.kanare.dev/ --delete

# CloudFrontのキャッシュを無効化
DISTRIBUTION_ID=$(cd ../terraform/environments/dev && terraform output -raw cloudfront_distribution_id)
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
```

**注意**: 本番環境ではGitHub Actionsで自動デプロイされます。詳細: [github-actions-setup.md](github-actions-setup.md)

## トラブルシューティング

### ACM証明書の検証が完了しない

```bash
# DNSレコードの確認
terraform output

# Cloudflare DNSが有効化されている場合は自動で設定されます
# 手動の場合は、出力されたCNAMEレコードをCloudflareに追加してください
```

### CloudFrontで403エラーが返る

S3バケットにファイルがアップロードされているか確認：

```bash
BUCKET_NAME=$(terraform output -raw s3_bucket_id)
aws s3 ls s3://$BUCKET_NAME/
```

ファイルがない場合は、フロントエンドをビルド・デプロイしてください。

### Lambda関数のエラー

Lambda関数のログを確認：

```bash
LAMBDA_NAME=$(terraform output -raw lambda_function_name)
aws logs tail /aws/lambda/$LAMBDA_NAME --follow
```

### State Lockエラー

```bash
# DynamoDBのLockを確認
aws dynamodb scan --table-name terraform-state-locks

# 必要に応じてLockを手動解除（注意して実行）
terraform force-unlock <LOCK_ID>
```

## 環境の削除

### Dev環境の場合（自由に削除可能）

```bash
cd terraform/environments/dev
terraform destroy
```

### Prod環境の場合（要注意）

Prod環境には重要なリソースにlifecycle保護が設定されています。削除するには、まず`main.tf`の該当箇所から`prevent_destroy`を手動で削除する必要があります。

詳細: [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md)

## 次のステップ

1. **フロントエンドの開発**: `frontend/` ディレクトリでReactアプリを開発
2. **Lambda関数の開発**: `lambda-functions/api-handler.py` でAPIロジックを実装
3. **CI/CDの設定**: [github-actions-setup.md](github-actions-setup.md) を参照
4. **設計ドキュメントの確認**:
   - [adr/](../adr/) - 設計決定の記録
   - [terraform/MIGRATION_GUIDE.md](../terraform/MIGRATION_GUIDE.md) - 環境分離の詳細

## 参考ドキュメント

- [deployment-guide.md](deployment-guide.md) - より詳細なデプロイガイド
- [cloudflare-terraform-guide.md](cloudflare-terraform-guide.md) - Cloudflare DNS自動管理
- [rebuild-guide.md](rebuild-guide.md) - インフラ再構築ガイド
- [cicd-guide.md](cicd-guide.md) - CI/CD運用ガイド
