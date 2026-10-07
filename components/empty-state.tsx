import Link from "next/link";
import { ShelfMark } from "@/components/shelf-mark";

export function EmptyState({
  title,
  text,
  href,
  action,
}: {
  title: string;
  text: string;
  href: string;
  action: string;
}) {
  return (
    <div className="panel px-6 py-14 text-center">
      <ShelfMark className="mx-auto h-12 w-12 text-primary" />
      <h2 className="mt-5 font-serif text-3xl">{title}</h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-foreground/70">{text}</p>
      <Link href={href} transitionTypes={["nav-back"]} className="btn btn-primary mt-6">
        {action}
      </Link>
    </div>
  );
}
