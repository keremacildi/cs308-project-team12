'use client';

import '../styles/globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen flex flex-col bg-gray-50 text-gray-900 antialiased">
        <SessionProvider>
          <Header />
          <main className="flex-1 w-full mx-auto">
            {children}
          </main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}
