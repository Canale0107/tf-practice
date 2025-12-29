# overview.note.md

overview.drawio および overview.svg 用の設計メモ・意図説明です。

---

## 目的

本ファイルは `overview.drawio` で作成する「システム全体アーキテクチャ図（MVP~Phase2 対応）」の設計メモ・意図説明を補助するためのメモです。

---

## 現在のシステム構成

本システムは以下の 3 つの主要なフローで構成されています：

### 1. 静的フロントエンド配信フロー

```
[Browser]
   |
   | HTTPS (GET /index.html)
   v
[CloudFront]  ←─ ACM (SSL Certificate)
   |
   v
[S3 Bucket]
   (静的フロントエンド)
```

- **Browser**: ユーザーの Web ブラウザ
- **CloudFront**: CDN によるコンテンツ配信、HTTPS 終端
- **ACM**: SSL/TLS 証明書管理（CloudFront 用）
- **S3 Bucket**: 静的 Web サイト（HTML、CSS、JavaScript）のホスティング

### 2. API リクエストフロー

```
[Browser]
   |
   | HTTPS (GET /xxx)
   | Authorization: Bearer JWT
   v
[API Gateway]
   |
   v
[Lambda]
   |
   v
[DynamoDB]
```

- **Browser**: 認証済みユーザーのブラウザ
- **API Gateway**: REST API エンドポイント、JWT 認証
- **Lambda**: バックエンド処理（Python）
- **DynamoDB**: データストレージ（NoteTable）

### 3. 認証フロー

```
[Browser]
   |
   | HTTPS (POST /login)
   v
[Cognito]
```

- **Browser**: ユーザーの Web ブラウザ
- **Cognito**: ユーザー認証・認可、JWT トークン発行

---

## 補足ポイント

- CloudFront は ACM 証明書を使用して HTTPS を提供
- API Gateway は Cognito で発行された JWT トークンで認証
- 静的コンテンツと API は異なるエンドポイント（別ドメイン/パス）で提供
- Phase2 以降の拡張（S3 ファイル添付, 共有, 検索, etc）は図ではグレー/点線で表現予定
- DynamoDB など各要素の詳細図は専用 drawio/db 図で表現
- README や docs/architecture.md 等への掲載・貼付も想定

---

## 技術スタック

- **フロントエンド**: 静的 Web サイト（S3 + CloudFront）
- **CDN**: CloudFront（ACM 証明書による HTTPS）
- **認証**: Amazon Cognito
- **API**: API Gateway（REST API、JWT 認証）
- **バックエンド**: AWS Lambda（Python）
- **データベース**: DynamoDB

---

## TODO/アイディア

- Phase2 以降拡張も順次追記
- drawio の配置アドバイス例もこのメモに溜めて OK
