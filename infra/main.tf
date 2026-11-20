# Astro の静的な出力を配る Worker。Terraform が持つのは入れ物とカスタムドメインだけで、スクリプトとアセットのアップロードは wrangler が持つ。
# Worker の入れ物は wrangler より先に Terraform で作る。wrangler が先に作った Worker は state に無く、Terraform から属性を変えられなくなる。

data "cloudflare_zones" "root" {
  name = var.root_domain
}

locals {
  # one() は2件以上ならエラーにするが、0件なら null を返して黙って通る。件数をここに出し、カスタムドメインの precondition で確かめる。
  root_zones = [for z in data.cloudflare_zones.root.result : z.id if z.name == var.root_domain]
  zone_id    = one(local.root_zones)
}

resource "cloudflare_worker" "site" {
  account_id = var.cloudflare_account_id
  name       = var.site_worker_name

  # 正規のホストを joifup.com の1つにする。workers.dev の重複のホストを作らない（wrangler.jsonc と同じ値）。
  subdomain = {
    enabled          = false
    previews_enabled = false
  }

  tags = ["ara-homepage", "site"]

  # wrangler.jsonc と同じ値にする。logs.enabled も明示する（invocation_logs だけを書くと、provider が enabled を false にする plan を出すため）。
  observability = {
    enabled            = true
    head_sampling_rate = 1
    logs = {
      enabled         = true
      invocation_logs = false
    }
  }
}

resource "cloudflare_workers_custom_domain" "site" {
  count      = var.attach_custom_domain ? 1 : 0
  account_id = var.cloudflare_account_id
  hostname   = var.site_hostname
  service    = cloudflare_worker.site.name
  zone_id    = local.zone_id

  # zone_id は optional + computed なので、0件で null のまま plan が通り、Cloudflare がホスト名からゾーンを推測してしまう。件数を明示的に確かめる。
  lifecycle {
    precondition {
      condition     = length(local.root_zones) == 1
      error_message = "root_domain に完全一致するゾーンが ${length(local.root_zones)} 件だった。1件でなければ apply しない（0件 = トークンに Zone の読み取りが無いか綴りが違う、2件以上 = トークンの範囲が広すぎる）。"
    }
  }
}
