export default function Footer() {
    return (
      <footer style={styles.footer}>
        <p>© 2025 CS308 Online Store - All rights reserved.</p>
        <nav style={styles.nav}>
          <a href="#" style={styles.link}>Privacy Policy</a>
          <a href="#" style={styles.link}>Terms of Service</a>
          <a href="#" style={styles.link}>Contact Us</a>
        </nav>
      </footer>
    );
  }
  
  const styles = {
    footer: {
      width: '100%',
      padding: '10px 20px',
      backgroundColor: '#f1f1f1',
      color: '#333',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 'auto',
    },
    nav: {
      display: 'flex',
      gap: '15px',
    },
    link: {
      color: '#0070f3',
      textDecoration: 'none',
      fontWeight: '500',
    },
  };
  