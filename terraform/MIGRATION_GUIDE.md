# Dev/Prod環境分離 セットアップ・運用ガイド

このガイドでは、単一AWSアカウント内でTerraformのディレクトリ構成によりdev/prod環境を完全分離した構成について説明します。

## 📋 現在の環境構成

本プロジェクトは**dev/prod環境が完全分離**された状態で運用されています。

### 環境分離の特徴
- Terraform Stateを環境ごとに完全分離（S3バックエンド使用）
- ディレクトリ構成による環境分離（`environments/prod`、`environments/dev`）
- 環境ごとに独立したAWSリソース（完全に別スタック）
- 環境変数による命名規則の統一
- Prod環境の重要リソースにlifecycle保護を設定

### ディレクトリ構成

```
terraform/
├── backend-setup/          # Terraform State管理用（初回のみ実行）
│   ├── main.tf
│   └── README.md
├── modules/                # 共有モジュール
│   ├── s3/
│   ├── lambda/
│   ├── dynamodb/
│   ├── api-gateway/
│   └── cognito/
└── environments/
    ├── prod/              # 本番環境
    │   ├── backend.tf     # State: s3://kanare-terraform-state-bucket/prod/terraform.tfstate
    │   ├── main.tf
    │   ├── variables.tf
    │   ├── outputs.tf
    │   └── terraform.tfvars
    └── dev/               # 開発環境
        ├── backend.tf     # State: s3://kanare-terraform-state-bucket/dev/terraform.tfstate
        ├── main.tf
        ├── variables.tf
        ├── outputs.tf
        └── terraform.tfvars
```

### 環境ごとのリソース命名

| リソース | Prod | Dev |
|---------|------|-----|
| ドメイン | note-app.kanare.dev | dev.note-app.kanare.dev |
| APIドメイン | api.note-app.kanare.dev | api-dev.note-app.kanare.dev |
| S3バケット | note-app.kanare.dev | dev.note-app.kanare.dev |
| DynamoDB | NotesTable-prod | NotesTable-dev |
| Lambda | note-api-handler-prod | note-api-handler-dev |
| API Gateway | note-api-gateway-prod | note-api-gateway-dev |
| Cognito | note-app-user-pool-prod | note-app-user-pool-dev |

## 🚀 初回セットアップ手順

> **注意**: 本プロジェクトでは既に環境分離が完了しています。以下の手順は、新規に環境を構築する場合や、他のプロジェクトで同様の構成を作る際の参考用です。

### Phase 1: Terraform State管理用リソースの作成

```bash
# 1. Backend用のS3バケットとDynamoDBテーブルを作成
cd terraform/backend-setup
terraform init
terraform apply

# 出力を確認
# - S3 Bucket: kanare-terraform-state-bucket
# - DynamoDB Table: terraform-state-locks
```

**注意**: このステップは1回のみ実行します。作成されたリソースは全環境で共有されます。

### Phase 2: Prod環境のセットアップ

```bash
# 2. Prod環境ディレクトリに移動
cd ../environments/prod

# 3. terraform.tfvarsファイルを作成
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集（本番環境用の設定）

# 4. Backend設定を初期化
terraform init

# 5. 差分を確認
terraform plan

# 6. Prod環境のリソースを作成
terraform apply
```

**重要**: Prod環境は慎重に扱ってください。lifecycle保護が設定されているため、重要なリソースは誤って削除できないようになっています。

### Phase 3: Dev環境のセットアップ

```bash
# 6. Dev環境ディレクトリに移動
cd ../dev

# 7. terraform.tfvarsファイルを作成
cp terraform.tfvars.example terraform.tfvars
# terraform.tfvars を編集（開発環境用の設定）

# 8. Backend設定を初期化
terraform init

# 9. Dev環境のリソースを確認
terraform plan

# 10. Dev環境を構築
terraform apply
```

**注意**:
- ACM証明書の検証には数分かかります
- Cloudflare DNSレコードの伝播にも時間がかかる場合があります
- Dev環境にはlifecycle保護がないため、自由に破棄・再作成できます

### Phase 4: 動作確認

```bash
# 11. 各環境のリソース一覧を確認
cd ../prod
terraform state list

cd ../dev
terraform state list

# 12. 各環境のドメインにアクセスして動作確認
# - Prod: https://note-app.kanare.dev
# - Dev: https://dev.note-app.kanare.dev

# 13. APIエンドポイントの確認
# - Prod: https://api.note-app.kanare.dev
# - Dev: https://api-dev.note-app.kanare.dev
```

## 🔒 Lifecycle保護について

### Prod環境の保護設定

以下のリソースには`prevent_destroy = true`が設定されています：

1. **CloudFront Distribution** (`environments/prod/main.tf:115`)
2. **ACM証明書（2つ）** (`environments/prod/main.tf:55`, `environments/prod/main.tf:188`)
   - note-app.kanare.dev用
   - api.note-app.kanare.dev用

これらのリソースは`terraform destroy`で削除できません。削除する場合は、該当の`lifecycle`ブロックを手動で削除してから実行してください。

### モジュール経由リソースの保護

**⚠️ Terraformの制限**: `lifecycle`ブロック内では変数を使用できないため、モジュール経由のリソース（S3バケット、DynamoDBテーブル）には`prevent_destroy`を直接設定できません。

**代替保護策**:

1. **S3バケット**
   - バージョニング有効化（設定済み）
   - MFA Delete有効化（推奨）
   - バケットポリシーでの削除制限

2. **DynamoDBテーブル**
   - Point-in-time recovery有効化（設定済み）
   - AWS Backupでの定期バックアップ
   - IAM権限での削除制限

3. **IAMポリシーでの保護**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Deny",
         "Action": [
           "s3:DeleteBucket",
           "dynamodb:DeleteTable"
         ],
         "Resource": [
           "arn:aws:s3:::note-app.kanare.dev",
           "arn:aws:dynamodb:ap-northeast-1:*:table/NotesTable-prod"
         ]
       }
     ]
   }
   ```

### Dev環境

Dev環境にはlifecycle保護がないため、自由に`terraform destroy`で削除できます。

## 📝 日常運用ガイド

### 環境の切り替え

環境ごとに独立したディレクトリで作業します：

```bash
# Prod環境で作業
cd terraform/environments/prod
terraform plan
terraform apply

# Dev環境で作業
cd terraform/environments/dev
terraform plan
terraform apply
```

### 推奨される開発フロー

1. **Dev環境で変更をテスト**
   ```bash
   cd terraform/environments/dev
   # main.tfやmodules/を編集
   terraform plan
   terraform apply
   ```

2. **動作確認**
   - Dev環境のドメインにアクセス（https://dev.note-app.kanare.dev）
   - APIエンドポイントをテスト（https://api-dev.note-app.kanare.dev）

3. **問題なければProd環境に適用**
   ```bash
   cd terraform/environments/prod
   # 同じ変更を適用
   terraform plan  # 必ず差分を確認
   terraform apply
   ```

4. **本番環境の動作確認**
   - Prod環境のドメインにアクセス（https://note-app.kanare.dev）
   - 本番APIをテスト（https://api.note-app.kanare.dev）

### Dev環境のリセット

Dev環境は自由に破棄・再構築できます：

```bash
cd terraform/environments/dev

# 全リソースを削除
terraform destroy

# 再構築
terraform apply
```

**注意**: Prod環境では`terraform destroy`を実行しないでください。lifecycle保護により主要リソースは削除できません。

### Stateの確認

```bash
# リソース一覧の表示
terraform state list

# 特定のリソースの詳細表示
terraform state show <resource_name>

# S3上のState確認
aws s3 ls s3://kanare-terraform-state-bucket/
aws s3 ls s3://kanare-terraform-state-bucket/prod/
aws s3 ls s3://kanare-terraform-state-bucket/dev/
```

### バックアップとロールバック

S3バケットのバージョニングが有効なため、Stateファイルは自動的にバージョン管理されます。

```bash
# S3上のStateのバージョンを確認
aws s3api list-object-versions \
  --bucket kanare-terraform-state-bucket \
  --prefix prod/terraform.tfstate

# 古いバージョンを復元（必要な場合）
aws s3api get-object \
  --bucket kanare-terraform-state-bucket \
  --key prod/terraform.tfstate \
  --version-id <VERSION_ID> \
  terraform.tfstate.restored
```

## ⚠️ 注意事項

### DO

- ✅ 変更前に必ず`terraform plan`で差分を確認
- ✅ Prod環境での変更は慎重に実行
- ✅ Dev環境で十分にテストしてからProd環境に適用
- ✅ 定期的にStateのバックアップを確認

### DON'T

- ❌ Prod環境で`terraform destroy`を実行しない
- ❌ 手動でStateファイルを編集しない
- ❌ 異なる環境のtfvarsファイルを混同しない
- ❌ Backend設定を変更した後、`terraform init`を忘れない

## 🔧 トラブルシューティング

### State Lockエラー

```bash
# DynamoDBのLockを確認
aws dynamodb scan --table-name terraform-state-locks

# 必要に応じてLockを手動解除（注意して実行）
terraform force-unlock <LOCK_ID>
```

### ACM証明書の検証が完了しない

```bash
# DNSレコードの確認
terraform output

# Cloudflare DNSレコードの確認
dig _<validation_string>.note-app.kanare.dev CNAME

# 必要に応じてCloudflare側で手動設定
```

### Prod環境のStateが見つからない

```bash
# S3バケットの確認
aws s3 ls s3://kanare-terraform-state-bucket/prod/

# Backend設定の確認
cat backend.tf

# 再初期化
terraform init -reconfigure
```

## 📚 参考情報

### ファイル構成

- `backend.tf`: S3バックエンド設定
- `main.tf`: リソース定義
- `variables.tf`: 変数定義
- `outputs.tf`: 出力値定義
- `terraform.tfvars`: 変数の値（環境ごとに異なる）

### 重要な変数

```hcl
variable "env" {
  # prod または dev
  # lifecycle保護の制御に使用
}

variable "domain_name" {
  # prod: note-app.kanare.dev
  # dev: dev.note-app.kanare.dev
}

variable "api_domain_name" {
  # prod: api.note-app.kanare.dev
  # dev: api-dev.note-app.kanare.dev
}
```

## 📞 トラブルシューティング・サポート

問題が発生した場合は、以下を確認してください：

1. `terraform plan`の出力を確認
2. 正しい環境のディレクトリで作業しているか確認
3. `terraform.tfvars`の設定値を確認
4. AWS S3とDynamoDBのリソース状態を確認
5. Cloudflare DNSレコードの設定を確認

詳細なトラブルシューティング手順は上記の「🔧 トラブルシューティング」セクションを参照してください。

---

**参考**: より詳細な運用手順については以下のドキュメントも参照してください：
- [docs/rebuild-guide.md](../docs/rebuild-guide.md) - インフラ再構築ガイド
- [docs/cloudflare-terraform-guide.md](../docs/cloudflare-terraform-guide.md) - Cloudflare DNS自動管理
- [adr/0005-dev-prod-environment-separation.md](../adr/0005-dev-prod-environment-separation.md) - 環境分離の設計判断
