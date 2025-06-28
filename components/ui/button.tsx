import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-800 text-white hover:bg-blue-700': variant === 'default',
            'bg-red-900 text-white border border-red-800/50 hover:bg-red-800': variant === 'destructive',
            'border border-gray-700 bg-black text-gray-300 hover:bg-gray-950 hover:text-white hover:border-blue-900/50': variant === 'outline',
            'bg-gray-900 text-gray-200 border border-gray-800/50 hover:bg-gray-800/90': variant === 'secondary',
            'hover:bg-gray-900/50 text-gray-300 hover:text-white': variant === 'ghost',
            'text-blue-400 underline-offset-4 hover:underline hover:text-blue-300': variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button };