import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "./theme";

export const metadata: Metadata = {
  title: "سودوكو ماستر | العب، تعلّم، وأتقن",
  description: "لعبة سودوكو عربية بثلاثة مستويات، أدوات ذكية، ودليل 14 تقنية مع 140 مرحلة تدريبية تفاعلية.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl">
      <body><ThemeProvider>{children}</ThemeProvider></body>
    </html>
  );
}
