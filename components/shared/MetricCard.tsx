'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
  valueClassName?: string
  className?: string
  children?: React.ReactNode
}

export function MetricCard({
  icon,
  label,
  value,
  valueClassName,
  className,
  children,
}: MetricCardProps) {
  return (
    <Card className={cn('border shadow-none', className)}>
      <CardContent className="p-3 text-center">
        <div className="text-xs text-muted-foreground font-medium mb-1">
          {icon && <span className="inline-flex items-center mr-1 align-middle">{icon}</span>}
          {label}
        </div>
        <div className={cn('text-2xl font-semibold', valueClassName)}>
          {value}
        </div>
        {children}
      </CardContent>
    </Card>
  )
}
