export function shelfNote(category: string) {
  if (category === "tea") {
    return "Лист спокойнее раскрывается водой около 85°, не крутым кипятком. Две-три минуты — и можно пить.";
  }
  if (category === "jam") {
    return "Варенье уже сварено. Ложку — в тёплый чай или на хлеб, банку на плиту ставить не нужно.";
  }
  if (category === "honey") {
    return "Мёд лучше не греть. Положите ложку в уже тёплый чай: вкус останется, а банка не засахарится от плиты.";
  }
  return "На полке только то, что можно забрать сейчас. Если позиция видна в каталоге — она в наличии.";
}

export function ProductArt({ category, className = "" }: { category?: string; className?: string }) {
  const honey = category === "honey";
  const jam = category === "jam";

  return (
    <div className={`relative flex items-center justify-center overflow-hidden text-primary ${className}`}>
      <div
        className="absolute inset-0"
        style={{
          background: jam
            ? "radial-gradient(circle at 50% 42%, color-mix(in srgb, #b4233a 34%, white), color-mix(in srgb, var(--primary) 8%, var(--background)) 72%)"
            : honey
              ? "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--accent) 38%, white), color-mix(in srgb, var(--primary) 10%, var(--background)) 72%)"
              : "radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--primary) 16%, white), color-mix(in srgb, var(--accent) 16%, var(--background)) 74%)",
        }}
      />
      <svg viewBox="0 0 160 180" className="float-soft relative mx-auto h-52 w-52 sm:h-60 sm:w-60" aria-hidden>
        {jam ? <HoneyJar fill="#b4233a" /> : honey ? <HoneyJar /> : <TeaCup />}
      </svg>
    </div>
  );
}

function TeaCup() {
  return (
    <>
      <path className="steam" d="M58 46c7-9 7-14 0-22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="steam" style={{ animationDelay: "0.45s" }} d="M78 42c7-10 7-16 0-26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path className="steam" style={{ animationDelay: "0.9s" }} d="M98 46c7-9 7-14 0-22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="78" cy="142" rx="48" ry="10" stroke="currentColor" strokeWidth="2.2" fill="white" />
      <path d="M42 70h72l-7 52c-1 9-9 16-29 16s-28-7-29-16L42 70z" stroke="currentColor" strokeWidth="2.2" fill="white" />
      <path d="M48 80h64l-2 12H50L48 80z" fill="var(--accent)" />
      <path d="M114 84c18 2 20 30 0 34" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </>
  );
}

function HoneyJar({ fill = "var(--accent)" }: { fill?: string }) {
  return (
    <>
      <path d="M58 58h44c2 0 3 2 2 4l-2 8H58l-2-8c-1-2 0-4 2-4z" fill="currentColor" />
      <rect x="50" y="70" width="60" height="7" rx="2" fill="currentColor" />
      <path d="M58 77h44l7 58c0 9-9 16-29 16s-29-7-29-16l7-58z" stroke="currentColor" strokeWidth="2.2" fill="white" />
      <path className="drip" d="M80 77c10 12 7 20 0 20s-8-10 0-20z" fill={fill} />
      <path d="M55 108h54l4 28c0 7-8 12-31 12s-31-5-31-12l4-28z" fill={fill} />
      <rect x="66" y="116" width="28" height="18" rx="3" fill="white" opacity="0.72" />
    </>
  );
}
