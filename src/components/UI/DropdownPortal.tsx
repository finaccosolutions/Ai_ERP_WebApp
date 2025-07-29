// src/components/UI/DropdownPortal.tsx
import React from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  children: React.ReactNode;
  style: React.CSSProperties;
}

const DropdownPortal = ({ children, style }: DropdownPortalProps) => {
  return createPortal(
    <div style={{ position: 'absolute', zIndex: 9999, ...style }}>
      {children}
    </div>,
    document.body
  );
};

export default DropdownPortal;
