variable "cloudflare_api_token" {
  description = "Cloudflare の API トークン（tfvars で渡す。コミットしない）"
  type        = string
  sensitive   = true
}

variable "cloudflare_account_id" {
  description = "Cloudflare のアカウント ID（tfvars で渡す）"
  type        = string
}

variable "root_domain" {
  description = "親のゾーン。ゾーン本体は別の Terraform が持ち、ここでは読むだけ"
  type        = string
  default     = "joifup.com"
}

variable "site_hostname" {
  description = "サイトの正規のホスト"
  type        = string
  default     = "joifup.com"

  # 同じゾーンに他のサイトも同居している。この state が書き込んでよいのは apex のカスタムドメインだけなので、値を固定して機械で確かめる。
  validation {
    condition     = var.site_hostname == "joifup.com"
    error_message = "site_hostname は joifup.com だけを受け付ける（同じゾーンの他のホストを掴まないため）。"
  }
}

variable "site_worker_name" {
  description = "サイトを配る Worker の名前（wrangler.jsonc の name と同じにする）"
  type        = string
  default     = "ara-homepage"
}

variable "attach_custom_domain" {
  description = "joifup.com のカスタムドメインを付けるか。apex の既存のレコードを外した後にだけ true にする"
  type        = bool
  default     = false
}
