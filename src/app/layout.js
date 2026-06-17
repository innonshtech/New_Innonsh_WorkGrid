// src/app/layout.js
import { SessionProvider } from '@/context/SessionContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { Toaster } from 'sonner';
import './globals.css';
import Script from "next/script";

export const metadata = {
  title: {
    default: "WorkGrid",
    template: "WorkGrid | %s",
  },
  description: "XperHR - Efficient HR and Operations Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      </head>
      <body suppressHydrationWarning>
        <Script
          src="https://upload-widget.cloudinary.com/global/all.js"
          strategy="afterInteractive"
        />
        <SessionProvider>
          <LanguageProvider>
            {children}
            <Toaster richColors closeButton position="top-right" toastOptions={{ style: { zIndex: 9999 } }} />
          </LanguageProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
