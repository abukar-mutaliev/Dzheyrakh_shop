import { EmptyState } from "@/components/empty-state";
import { PageTransition } from "@/components/page-transition";

export default function NotFound() {
  return (
    <PageTransition>
    <main className="mx-auto w-full max-w-3xl px-4 py-16">
      <EmptyState
        title="Такой страницы нет"
        text="Возможно, ссылка устарела. На полке по-прежнему чай, мёд и варенье."
        href="/"
        action="На главную"
      />
    </main>
    </PageTransition>
  );
}
