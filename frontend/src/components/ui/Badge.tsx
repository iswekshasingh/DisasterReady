import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    brand: 'bg-brand-blue-subtle text-brand-blue border border-blue-200',
    success: 'bg-safety-green-subtle text-safety-green border border-green-200',
    warning: 'bg-safety-amber-subtle text-safety-amber border border-amber-200',
    danger: 'bg-safety-red-subtle text-safety-red border border-red-200',
    outline: 'bg-transparent text-slate-600 border border-slate-200',
  };

  const sizes = {
    sm: 'text-[11px] px-1.5 py-0.5 leading-none font-medium rounded',
    md: 'text-xs px-2 py-0.5 font-medium rounded-md',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1 font-medium tracking-tight', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
