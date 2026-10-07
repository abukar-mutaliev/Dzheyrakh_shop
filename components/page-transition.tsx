import { ViewTransition, type ReactNode } from "react";

const scene = {
  "nav-forward": "nav-forward",
  "nav-back": "nav-back",
  default: "rise",
};

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter={scene} exit={scene} default="none">
      {children}
    </ViewTransition>
  );
}
