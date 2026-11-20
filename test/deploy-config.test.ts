import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (p: string) => readFileSync(resolve(import.meta.dirname, "..", p), "utf8");
const wrangler = read("wrangler.jsonc");
const deploy = read(".github/workflows/deploy.yml");
const mainTf = read("infra/main.tf");
const variablesTf = read("infra/variables.tf");

describe("wrangler の設定", () => {
  it("Worker 名が Terraform の既定値と同じ", () => {
    expect(wrangler).toContain('"name": "ara-homepage"');
    expect(variablesTf).toMatch(/default\s*=\s*"ara-homepage"/);
  });

  it("dist を配り、/api/* だけ Worker を先に通し、未知のパスは 404 のページ", () => {
    expect(wrangler).toContain('"directory": "./dist"');
    expect(wrangler).toContain('"run_worker_first": ["/api/*"]');
    expect(wrangler).toContain('"not_found_handling": "404-page"');
  });

  it("workers.dev とプレビューの URL を閉じる（正規のホストを joifup.com の1つにする）", () => {
    expect(wrangler).toContain('"workers_dev": false');
    expect(wrangler).toContain('"preview_urls": false');
    const subdomain = mainTf.match(/subdomain\s*=\s*\{([\s\S]*?)\}/)?.[1] ?? "";
    expect(subdomain).toMatch(/^\s*enabled\s*=\s*false/m);
    expect(mainTf).toMatch(/previews_enabled\s*=\s*false/);
  });

  it("invocation log を止める（Terraform と同じ値）", () => {
    expect(wrangler).toContain('"invocation_logs": false');
    expect(mainTf).toMatch(/invocation_logs\s*=\s*false/);
  });
});

describe("デプロイのワークフロー", () => {
  it("main への push と workflow_dispatch だけで動き、cron を持たない", () => {
    expect(deploy).toMatch(/push:\s*\n\s*branches:\s*\[main\]/);
    expect(deploy).toContain("workflow_dispatch:");
    expect(deploy).not.toContain("schedule:");
  });

  it("main で、DEPLOY_ENABLED が true のときだけ動く", () => {
    expect(deploy).toContain("if: github.ref == 'refs/heads/main' && vars.DEPLOY_ENABLED == 'true'");
  });

  it("権限を絞り、資格情報を残さず、同時に2本走らせない", () => {
    expect(deploy).toContain("contents: read");
    expect(deploy).toContain("persist-credentials: false");
    expect(deploy).toContain("cancel-in-progress: false");
  });

  it("Discord の通知は webhook があるときだけで、最近書いたものの件数を載せる", () => {
    expect(deploy).toContain("env.HAS_DISCORD_WEBHOOK == 'true'");
    expect(deploy).toContain("writing-report.json");
  });
});

describe("infra", () => {
  it("カスタムドメインは attach_custom_domain が true のときだけ作る", () => {
    expect(mainTf).toMatch(/count\s*=\s*var\.attach_custom_domain \? 1 : 0/);
    expect(variablesTf).toMatch(/variable "attach_custom_domain"[\s\S]*?default\s*=\s*false/);
  });

  it("ゾーンがちょうど1件であることを precondition で確かめる", () => {
    expect(mainTf).toContain("length(local.root_zones) == 1");
  });
});
