import React from 'react';

export const Modal = ({ children, onClose }) => {
  return (
    <div 
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
      onClick={onClose}
    >
      <div 
        style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '14px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'transparent',
            color: '#666',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: 0,
            boxShadow: 'none'
          }}
        >
          &times;
        </button>
        {children}
      </div>
    </div>
  );
};
