import type { Metadata } from "next";
import { Literata, Manrope } from "next/font/google";
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
  const brand = {
    "--background": shopConfig.brand.colors.background,
    "--foreground": shopConfig.brand.colors.foreground,
    "--primary": shopConfig.brand.colors.primary,
    "--accent": shopConfig.brand.colors.accent,
  } as React.CSSProperties;

  return (
    <html lang={shopConfig.shop.locale} className={`${manrope.variable} ${literata.variable} h-full`} style={brand}>
      <body className="flex min-h-full flex-col antialiased">
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
