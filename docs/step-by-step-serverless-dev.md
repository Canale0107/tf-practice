# サーバーレス開発：ステップバイステップ構築ガイド

> このドキュメントは「パーソナルノート/メモアプリ」を AWS サーバーレスで段階的に開発する際の"分かりやすい進め方"をまとめたものです。

---

## 推奨ステップと理由

### 1. S3（静的ウェブホスティング）

- **目的:** UI 入口を構築。「Web ページが公開されている」実感・体験を得る
- **やること:** S3 バケット作成・ホスティング有効化、index.html アップロード、ポリシー設定
- **学べること:** クラウドストレージの基礎・公開権限・outputs の活用

### 2. API Gateway + Lambda

- **目的:** サーバーレス API の基本連携。「バックエンド（API）が動く」体験
- **やること:** REST エンドポイント公開、Lambda 関数実装・Terraform 連携
- **学べること:** API 化、Gateway/Lambda の繋がり、event/response 構造

### 3. DynamoDB

- **目的:** データの保存・取得。「ノートが永続化される」仕組み理解
- **やること:** テーブル定義・CRUD 用 IAM 権限設定、Lambda との連携
- **学べること:** NoSQL 設計、ロール/ポリシー思想

### 4. Cognito（認証）

- **目的:** 認証付きサービス。「ユーザーログイン＝自分だけのノート体験」
- **やること:** ユーザープール作成、API Gateway&Lambda 統合（Cognito 認証トークン経由）
- **学べること:** サーバーレス認証・JWT・認可フロー

---

## 進行順のポイント

- "見える化"を優先：「まず実体験 →API→ データ → 認証」の段階で挫折しにくい
- 拡張も自由：MVP 後にタグ検索やファイル添付もこの手順に自然に追加できる
- それぞれの章で「どんな Terraform リソースを書くか」記録・サンプルも添付していくとさらに有用

---

## 実装状況（2025/12/29 時点）

### ✅ Phase 1: 完了済み（基本インフラ・MVP実装）

以下の機能はすべて実装・デプロイ済みです：

#### 1. 静的サイトホスティング（S3 + CloudFront + ACM）
- ✅ S3 バケット（静的ウェブホスティング設定）
- ✅ CloudFront ディストリビューション（CDN配信）
- ✅ ACM 証明書（静的サイト用：`note-app.kanare.dev`, `dev.note-app.kanare.dev`）
- ✅ HTTPS 配信（カスタムドメイン対応）

#### 2. API Gateway + Lambda（ノート CRUD API）
- ✅ API Gateway（REST API、カスタムドメイン：`api.note-app.kanare.dev`, `api-dev.note-app.kanare.dev`）
- ✅ ACM 証明書（API 用）
- ✅ レート制限設定（50 req/s 平均、100 バースト、10k/日クォータ）
- ✅ Lambda 関数（Python 3.11）：`lambda-functions/api-handler.py`
- ✅ CRUD エンドポイント実装：
  - `GET /notes` - ノート一覧取得
  - `POST /notes` - ノート新規作成
  - `GET /notes/{noteId}` - ノート詳細取得
  - `PUT /notes/{noteId}` - ノート更新
  - `DELETE /notes/{noteId}` - ノート削除

#### 3. DynamoDB（データ永続化）
- ✅ NotesTable（複合キー：`userId` + `noteId`）
- ✅ Lambda からの CRUD 操作実装済み
- ✅ IAM ロール・ポリシー設定済み

#### 4. Cognito 認証
- ✅ Cognito User Pool（メールベース認証）
- ✅ API Gateway Cognito Authorizer 統合
- ✅ Lambda での JWT トークン検証（`userId` = `sub` claim）
- ✅ ユーザーごとのノート分離

#### 5. 環境分離（Dev/Prod）
- ✅ 完全分離された Terraform ステート（S3 バックエンド + DynamoDB ロック）
- ✅ Dev 環境：`dev.note-app.kanare.dev`（フロント）、`api-dev.note-app.kanare.dev`（API）
- ✅ Prod 環境：`note-app.kanare.dev`（フロント）、`api.note-app.kanare.dev`（API）
- ✅ 本番環境保護（`lifecycle.prevent_destroy = true`）

#### 6. Cloudflare DNS 自動管理（オプション）
- ✅ Terraform による DNS レコード自動作成
- ✅ ACM 証明書の DNS 検証自動化

#### 7. CI/CD パイプライン
- ✅ Terraform CI ワークフロー（`.github/workflows/terraform.yml`）
  - フォーマット検証、Validate、Plan（PR コメント機能付き）
- ✅ 静的サイトデプロイワークフロー（`.github/workflows/deploy-static-site.yml`）
  - Push to `main` → Prod デプロイ
  - PR → Dev デプロイ
  - CloudFront キャッシュ自動無効化

#### 8. フロントエンド（React + Vite + TypeScript）
- ✅ React SPA（Vite ビルド）
- ✅ Tailwind CSS + shadcn/ui コンポーネント
- ✅ 環境変数管理（Cognito 設定、API エンドポイント）

---

### 🚀 Phase 2: 今後の拡張機能（任意）

基本機能は実装済みのため、以下は学習・機能拡張の候補です：

#### 1. フロントエンド UI 完成
- [ ] Cognito 認証 UI（サインアップ/ログイン/ログアウト）
- [ ] ノート一覧・作成・編集・削除 UI
- [ ] Markdown プレビュー機能
- [ ] レスポンシブデザイン調整

#### 2. 機能拡張
- [ ] ノートのタグ機能（DynamoDB GSI を活用）
- [ ] ノート検索機能（ElasticSearch/OpenSearch 統合）
- [ ] ファイル添付機能（S3 + Lambda + プレサイン URL）
- [ ] ノート共有機能（公開リンク生成）

#### 3. 監視・運用
- [ ] CloudWatch Logs/Metrics ダッシュボード
- [ ] X-Ray トレーシング有効化
- [ ] Lambda 関数のエラーアラート（SNS + CloudWatch Alarms）
- [ ] コスト監視・予算アラート

#### 4. セキュリティ強化
- [ ] WAF（Web Application Firewall）設定
- [ ] Secrets Manager による機密情報管理
- [ ] VPC エンドポイント（必要に応じて）

#### 5. パフォーマンス最適化
- [ ] DynamoDB オンデマンド vs プロビジョニング比較
- [ ] Lambda Provisioned Concurrency（コールドスタート対策）
- [ ] CloudFront キャッシュ戦略調整

---

## API テスト例

Terraform apply 後、以下のような curl コマンドで API の動作を確認できます。

**重要:** すべてのエンドポイントは **Cognito 認証トークン（JWT）** が必須です。

### 認証トークン取得

```bash
# Cognito でユーザー作成・ログイン後、ID トークンを取得
# （AWS Amplify CLI または AWS SDK を使用）
TOKEN="<your-cognito-id-token>"
```

### CRUD 操作例

```bash
# ノート一覧取得
curl https://api.note-app.kanare.dev/notes \
  -H "Authorization: Bearer $TOKEN" | jq

# ノート新規作成
curl -X POST https://api.note-app.kanare.dev/notes \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"テストノート","content":"内容"}' | jq

# ノート詳細取得（{noteId} は作成時に返された ID）
curl https://api.note-app.kanare.dev/notes/{noteId} \
  -H "Authorization: Bearer $TOKEN" | jq

# ノート更新
curl -X PUT https://api.note-app.kanare.dev/notes/{noteId} \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"更新タイトル","content":"更新内容"}' | jq

# ノート削除
curl -X DELETE https://api.note-app.kanare.dev/notes/{noteId} \
  -H "Authorization: Bearer $TOKEN" | jq
```

### Dev 環境でのテスト

```bash
# Dev 環境の API エンドポイント
curl https://api-dev.note-app.kanare.dev/notes \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 実践 Tips

- ✅ **1 ステップ進めたごとに AWS 管理コンソールで挙動を直接確認・失敗したら原因究明**
- ✅ **"VPC（ネットワーク）"は不要**。サーバーレスの良さを最初に 100%活かす
- ✅ **構成図・各サービスの役割もこの進め方通り docs/diagrams/…で順次追記していくと理解が深まる**
- ✅ **Dev 環境で試してから Prod へ**：必ず `terraform/environments/dev/` で検証後、`prod/` へ適用
- ✅ **Terraform outputs を活用**：`terraform output` で Cognito User Pool ID、API エンドポイントなどを確認

---

## トラブルシューティング

### API が 401 Unauthorized を返す
- Cognito トークンが正しいか確認（期限切れていないか）
- API Gateway の Cognito Authorizer 設定を確認
- Lambda ログで `event.requestContext.authorizer.claims` が取得できているか確認

### CloudFront で古いコンテンツが表示される
```bash
# キャッシュ無効化
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

### DynamoDB に書き込めない
- Lambda の IAM ロールに `dynamodb:PutItem`, `dynamodb:Query` などの権限があるか確認
- `DYNAMODB_TABLE` 環境変数が正しく設定されているか確認

---

> 詳細例・サンプルコードや Terraform 記述例は、各章や README、図解（diagrams/）、ADR（adr/）も併用して参照してください。
