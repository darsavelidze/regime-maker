import { cn } from './utils'

function Input({ className, type, ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-border bg-input px-4 py-2 text-base',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all',
        className
      )}
      {...props}
    />
  )
}

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[120px] w-full rounded-lg border border-border bg-input px-4 py-3 text-base',
        'placeholder:text-muted-foreground',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all resize-none',
        className
      )}
      {...props}
    />
  )
}

export { Input, Textarea }
