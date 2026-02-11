import { cn } from './utils'

function Card({ className, ...props }) {
  return (
    <div
      className={cn('bg-card text-card-foreground rounded-2xl border border-border', className)}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }) {
  return (
    <div className={cn('p-6 pb-0', className)} {...props} />
  )
}

function CardTitle({ className, ...props }) {
  return (
    <h3 className={cn('text-lg font-bold leading-none', className)} {...props} />
  )
}

function CardDescription({ className, ...props }) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
}

function CardContent({ className, ...props }) {
  return (
    <div className={cn('p-6', className)} {...props} />
  )
}

function CardFooter({ className, ...props }) {
  return (
    <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter }
