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
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    brand: 'bg-[#EBF1F6] text-brand-navy border border-[#D5E1EC]',
    success: 'bg-semantic-success-subtle text-semantic-success border border-[#C5DDD2]',
    warning: 'bg-semantic-warning-subtle text-semantic-warning border border-[#E9DCBE]',
    danger: 'bg-semantic-danger-subtle text-semantic-danger border border-[#ECCECE]',
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
