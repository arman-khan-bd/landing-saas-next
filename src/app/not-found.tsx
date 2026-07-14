export const runtime = 'edge';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#020617',
      color: '#f8fafc',
      padding: '24px',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }}>
      <h2 style={{ fontSize: '48px', fontWeight: '900', color: '#6366f1', margin: '0 0 8px 0' }}>404</h2>
      <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 8px 0' }}>Page Not Found</h1>
      <p style={{ color: '#94a3b8', fontSize: '12px', margin: '0 0 24px 0', maxWidth: '320px', lineHeight: '1.6' }}>
        The store page or dashboard section you are trying to reach does not exist or has been moved.
      </p>
      <a href="/" style={{
        borderRadius: '12px',
        height: '40px',
        padding: '0 20px',
        fontWeight: '900',
        backgroundColor: '#4f46e5',
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '10px',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        textDecoration: 'none',
        boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.15)'
      }}>
        Return Home
      </a>
    </div>
  );
}
