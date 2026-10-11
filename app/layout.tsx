import type { Metadata } from "next";
import { Literata, Manrope } from "next/font/google";
import { designBootScript } from "@/lib/designs";
import { shopConfig } from "@/lib/shop-config";
import { CartProvider } from "@/components/cart-provider";
import { MotionStyles } from "@/components/motion-styles";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
});

const literata = Literata({
  subsets: ["latin", "cyrillic"],
  variable: "--font-literata",
  display: "swap",
});

export const metadata: Metadata = {
  title: shopConfig.shop.name,
  description: shopConfig.shop.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={shopConfig.shop.locale}
      data-design="shelf"
      suppressHydrationWarning
      className={`${manrope.variable} ${literata.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <script dangerouslySetInnerHTML={{ __html: designBootScript() }} />
        <MotionStyles />
        <CartProvider>
          <SiteHeader />
          <div className="flex-1">{children}</div>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
