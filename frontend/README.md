# frontend ディレクトリについて

このディレクトリは、サーバーレス・メモアプリのフロントエンド（静的HTML/JS/CSSやSPAフレームワークなど含む）を格納します。

## typical structure

```
frontend/
├── public/      # S3へアップロードする静的ファイル (index.html, style.cssなど)
├── src/         # (必要に応じて) SPAソース(React, Vue, etc)
└── build/       # (ビルド自動生成物。通常git管理は不要)
```

- S3デプロイ時は通常 `public/` や `build/` の内容を同期します。
- サンプルや手順は[docs/step-by-step-serverless-dev.md](../docs/step-by-step-serverless-dev.md)も参照。

