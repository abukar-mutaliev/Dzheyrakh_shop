import Link from "next/link";

const steps = [
  { href: "/cart", label: "Корзина" },
  { href: "/checkout", label: "Оформление" },
  { label: "Оплата" },
] as const;

export function FlowSteps({ current }: { current: 0 | 1 }) {
  return (
    <ol className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
      {steps.map((step, index) => {
        const state = index < current ? "done" : index === current ? "now" : "later";
        const body = (
          <span className="inline-flex items-center gap-2">
            <span
              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                state === "later" ? "bg-foreground/10 text-foreground/45" : "bg-primary text-background"
              }`}
            >
              {index + 1}
            </span>
            <span className={state === "later" ? "text-foreground/45" : "font-medium"}>{step.label}</span>
          </span>
        );

        return (
          <li key={step.label} className="flex items-center gap-3">
            {state === "done" && "href" in step ? (
              <Link href={step.href} transitionTypes={["nav-back"]} className="rounded-full transition-colors duration-300 hover:text-primary">
                {body}
              </Link>
            ) : (
              body
            )}
            {index < steps.length - 1 ? <span className="hidden h-px w-8 bg-foreground/15 sm:block" aria-hidden /> : null}
          </li>
        );
      })}
    </ol>
  );
}
