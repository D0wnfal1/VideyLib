import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { NavigationProvider } from "@/context/NavigationContext";
import NavBar from "@/components/NavBar";

export const metadata: Metadata = {
  title: "VideyLib - Video Manager",
  description: "Manage your videos easily with tags and categorization",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7fa" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-app-light dark:bg-app-dark text-app-light dark:text-app-dark transition-colors duration-200">
        <ThemeProvider>
          <NavigationProvider>
            <NavBar />
            <main>{children}</main>
          </NavigationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
} 