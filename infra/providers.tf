terraform {
  # 1.3 以上: lifecycle の precondition と endswith() を使うため。
  required_version = ">= 1.3"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5.0"
    }
  }

  # state はローカルに置く。worktree の中で apply すると、worktree を消したときに state ごと消えるので、apply は主のチェックアウトで行う。
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}
