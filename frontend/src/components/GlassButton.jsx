import React from 'react';

/** Liquid-glass control. Pass `as={Link}` for router links or use a native button. */
export const GlassButton = ({
  as: Component = 'button',
  variant = 'secondary',
  iconOnly = false,
  className = '',
  children,
  ...props
}) => (
  <Component
    className={`glass-button glass-button--${variant}${iconOnly ? ' glass-button--icon' : ''}${className ? ` ${className}` : ''}`}
    {...props}
  >
    {children}
  </Component>
);
