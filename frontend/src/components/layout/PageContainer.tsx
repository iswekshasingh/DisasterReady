import React from 'react';
import { cn } from '@/utils/cn';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  action,
  children,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-6 md:p-8 max-w-7xl mx-auto space-y-6', className)} {...props}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
          <div>
            {title && (
              <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
          {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};

