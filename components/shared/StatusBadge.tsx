'use client'

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StatusVariant = 'idle' | 'active' | 'warning' | 'success' | 'error'

const variantStyles: Record<StatusVariant, string> = {
  idle: '',
  active: 'animate-pulse',
  warning: 'bg-amber-500 text-white',
  success: '',
  error: '',
}

const variantBadge: Record<StatusVariant, 'default' | 'secondary' | 'destructive'> = {
  idle: 'secondary',
  active: 'default',
  warning: 'default',
  success: 'default',
  error: 'destructive',
}

interface StatusBadgeProps {
  variant?: StatusVariant
  icon?: React.ReactNode
  label: string
  className?: string
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}

export function StatusBadge({
  variant = 'idle',
  icon,
  label,
  className,
  size = 'md',
  style,
}: StatusBadgeProps) {
  return (
    <Badge
      variant={variantBadge[variant]}
      className={cn(
        size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs',
        variantStyles[variant],
        className
      )}
      style={style}
    >
      {icon && <span className="mr-0.5 inline-flex items-center">{icon}</span>}
      {label}
    </Badge>
  )
}
