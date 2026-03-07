import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import React from 'react';

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-xl text-sm font-semibold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
	{
		variants: {
			variant: {
				default: 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-600/30',
				destructive:
          'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:bg-red-600',
				outline:
          'border border-gray-200 bg-white hover:bg-gray-50 hover:text-gray-900 shadow-sm',
				secondary:
          'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
				ghost: 'hover:bg-gray-100 hover:text-gray-900',
				link: 'text-emerald-600 underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-11 px-5 py-2.5',
				sm: 'h-9 rounded-lg px-3',
				lg: 'h-12 rounded-xl px-8 text-base',
				icon: 'h-11 w-11',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	const Comp = asChild ? Slot : 'button';
	return (
		<Comp
			className={cn(buttonVariants({ variant, size, className }))}
			ref={ref}
			{...props}
		/>
	);
});
Button.displayName = 'Button';

export { Button, buttonVariants };