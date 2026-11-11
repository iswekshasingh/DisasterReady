import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-subtle)',
      padding: '2rem 0',
      marginTop: 'auto'
    }}>
      <div className="container" style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        fontSize: '0.85rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldAlert size={18} color="var(--accent-orange)" />
          <span style={{ fontWeight: 700, color: '#FFF' }}>
            Disaster<span style={{ color: 'var(--accent-orange)' }}>Ready</span>
          </span>
          <span>— Companion Web Portal</span>
        </div>

        <div>
          © {new Date().getFullYear()} DisasterReady. All simulations run inside the Unity client.
        </div>
      </div>
    </footer>
  );
};
