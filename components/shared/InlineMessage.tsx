'use client'

import React from 'react'
import { cn } from '@/lib/utils'

type MessageVariant = 'error' | 'empty' | 'loading' | 'info'

interface InlineMessageProps {
  variant?: MessageVariant
  icon?: React.ReactNode
  title?: string
  description?: string
  className?: string
  children?: React.ReactNode
}

const variantContainerStyles: Record<MessageVariant, string> = {
  error: 'p-2 border border-destructive/30 bg-destructive/5 rounded text-sm text-destructive',
  empty: 'text-center py-6 text-muted-foreground text-sm',
  loading: 'text-center py-8',
  info: 'p-2 border border-primary/30 bg-primary/5 rounded text-sm text-primary',
}

export function InlineMessage({
  variant = 'info',
  icon,
  title,
  description,
  className,
  children,
}: InlineMessageProps) {
  if (variant === 'error') {
    return (
      <div className={cn(variantContainerStyles.error, className)}>
        {icon && <span className="inline mr-1">{icon}</span>}
        {title || children}
        {description && <p className="text-xs mt-1">{description}</p>}
      </div>
    )
  }

  if (variant === 'loading') {
    return (
      <div className={cn(variantContainerStyles.loading, className)}>
        {icon && <div className="w-8 h-8 mx-auto mb-2">{icon}</div>}
        {title && <p className="text-sm text-muted-foreground">{title}</p>}
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {children}
      </div>
    )
  }

  if (variant === 'empty') {
    return (
      <div className={cn(variantContainerStyles.empty, className)}>
        <div className="text-center">
          {icon && <div className="w-8 h-8 mx-auto mb-2 opacity-30">{icon}</div>}
          {title && <p>{title}</p>}
          {description && <p className="text-xs mt-1">{description}</p>}
          {children}
        </div>
      </div>
    )
  }

  // info
  return (
    <div className={cn(variantContainerStyles.info, className)}>
      {icon && <span className="inline mr-1">{icon}</span>}
      {title || children}
      {description && <p className="text-xs mt-1">{description}</p>}
    </div>
  )
}
