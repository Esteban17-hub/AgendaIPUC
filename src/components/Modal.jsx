import React from 'react';

export const Modal = ({ children, onClose }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'var(--color-surface)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: 'var(--glass-border)',
          padding: '2.2rem',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          maxWidth: '520px',
          boxShadow: 'var(--glass-shadow)',
          position: 'relative',
          color: 'var(--color-text-main)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'transparent',
            color: 'var(--color-text-muted)',
            border: 'none',
            fontSize: '1.6rem',
            cursor: 'pointer',
            padding: 0,
            boxShadow: 'none',
            lineHeight: 1
          }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};
