import { cn } from './utils'

function Tabs({ className, children, value, onValueChange, ...props }) {
  return (
    <div className={cn('w-full', className)} {...props}>
      {children}
    </div>
  )
}

function TabsList({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex w-full bg-card rounded-2xl overflow-hidden border border-border',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function TabsTrigger({ className, active, children, ...props }) {
  return (
    <button
      className={cn(
        'flex-1 py-4 text-center font-medium text-sm uppercase tracking-wide transition-colors',
        active
          ? 'bg-card border-b-2 border-primary text-foreground'
          : 'bg-muted text-muted-foreground hover:text-foreground',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({ className, children, ...props }) {
  return (
    <div className={cn('mt-4', className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
