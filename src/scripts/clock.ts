export function clock(): void {
  const el = document.getElementById("clock")!;
  const f = () => {
    el.textContent = "TOKYO " + new Date().toLocaleTimeString("ja-JP", { timeZone: "Asia/Tokyo", hour12: false });
  };
  f();
  setInterval(f, 1000);
}
