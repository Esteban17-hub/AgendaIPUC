import React from 'react';

export const Modal = ({ children, onClose }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
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
          background: 'var(--color-surface-solid)',
          border: '1.8px solid var(--color-secondary)',
          padding: '2rem',
          borderRadius: 'var(--radius-md)',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          position: 'relative',
          color: 'var(--color-text-main)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: 'var(--color-text-main)',
            border: '1px solid var(--color-border)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            cursor: 'pointer',
            boxShadow: 'none',
            lineHeight: 1,
            zIndex: 10
          }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};
