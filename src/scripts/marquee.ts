// 帯の文言は HTML に1回分ある。継ぎ目なく流すため、同じ中身を後ろにもう1回つなげる。
export function marquee(): void {
  for (const id of ["mq1", "mq2"]) {
    const el = document.getElementById(id)!;
    el.innerHTML += el.innerHTML;
  }
}
