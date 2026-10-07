export function formatPrice(kopecks: number) {
  const hasKopecks = kopecks % 100 !== 0;
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: hasKopecks ? 2 : 0,
    maximumFractionDigits: hasKopecks ? 2 : 0,
  }).format(kopecks / 100);
}

export function kopecksToYookassa(kopecks: number) {
  return (kopecks / 100).toFixed(2);
}
