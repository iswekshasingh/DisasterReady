import React from 'react';

/** Shared translucent surface for page panels and feature cards. */
export const GlassCard = ({ as: Component = 'div', className = '', children, ...props }) => (
  <Component className={`glass-card${className ? ` ${className}` : ''}`} {...props}>
    {children}
  </Component>
);
