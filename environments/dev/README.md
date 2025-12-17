# environments/dev/ の超最小構成例（2025/12/17リセット）

このディレクトリは現在、「VPCしか作らない」最小Terraform構成です。

## ファイル一覧
- main.tf ... VPCリソース定義
- variables.tf ... AWSリージョン変数（デフォルト: ap-northeast-1）
- outputs.tf ... VPCのID出力

## デプロイ手順
```sh
cd environments/dev
terraform init
terraform apply
```
（AWS認証情報が設定済みであること）

---

今後はここに1つずつリソースを追加・発展させていきます。
最終的には docs/goal_structure_20251217.md を目指します。

