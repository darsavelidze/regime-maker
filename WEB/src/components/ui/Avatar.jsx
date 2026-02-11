import { cn } from './utils'

function Avatar({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

function AvatarFallback({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export { Avatar, AvatarFallback }
