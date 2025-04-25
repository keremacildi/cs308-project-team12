'use client';

import '../styles/home.module.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { SessionProvider } from 'next-auth/react';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <SessionProvider>
          <Header />
          <main style={styles.main}>{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}

const styles = {
  body: {
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    flex: 1,
    padding: '20px',
  },
};
