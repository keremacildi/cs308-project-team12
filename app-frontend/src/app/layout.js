import '../styles/home.module.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <Header />
        <main style={styles.main}>{children}</main>
        <Footer />
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
