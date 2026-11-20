terraform {
  # lifecycle の precondition は 1.2 から使える。1.3 は余裕を持たせた下限で、機能の要請ではない。
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
