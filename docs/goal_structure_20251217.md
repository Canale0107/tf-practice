# ゴールとなる Terraform ディレクトリ構成（2025/12/17 時点）

## ディレクトリツリー（主要ファイルのみ抜粋）

```
tf-practice/
├── README.md
├── environments/
│   ├── dev/
│   │   ├── main.tf
│   │   ├── outputs.tf
│   │   ├── terraform.tfstate
│   │   ├── terraform.tfvars
│   │   ├── terraform.tfvars.example
│   │   └── variables.tf
│   ├── prod/
│   └── staging/
├── modules/
│   ├── api-gateway/
│   │   ├── main.tf
│   │   ├── outputs.tf
│   │   └── variables.tf
│   ├── cognito/
│   │   ├── main.tf
│   │   ├── outputs.tf
│   │   └── variables.tf
│   ├── dynamodb/
│   │   ├── main.tf
│   │   ├── outputs.tf
│   │   └── variables.tf
│   ├── lambda/
│   │   ├── main.tf
│   │   ├── outputs.tf
│   │   └── variables.tf
│   └── s3/
│       ├── main.tf
│       ├── outputs.tf
│       └── variables.tf
├── ci-cd/
│   ├── aws/
│   │   └── buildspec.yml
├── adr/
│   ├── 0001-template.md
│   └── 0002-mvp-architecture.md
├── docs/
│   ├── adr-guide.md
│   ├── architecture.md
│   ├── cicd-guide.md
│   ├── deployment-guide.md
│   ├── drawio-tutorial.md
│   ├── getting-started.md
│   └── project-proposal.md
├── diagrams/
│   └── README.md
├── lambda-functions/
│   └── api-handler.py
└── CONTRIBUTING.md
```

## 備考

- 2025/12/17 時点のディレクトリ・ファイル構成をゴールとし、今後はこれを参照しながら最小構成 → 段階的拡張と進める。
- 主要 Terraform リソース（VPC, Lambda, S3, etc）は `modules/` および `environments/` 配下で管理。
- 詳細設計・個別方針はそれぞれの ADR や README、docs 配下ファイルに記載。
