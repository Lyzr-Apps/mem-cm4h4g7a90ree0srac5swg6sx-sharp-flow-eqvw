'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SectionCardProps {
  icon?: React.ReactNode
  title: string
  titleExtra?: React.ReactNode
  action?: React.ReactNode
  className?: string
  contentClassName?: string
  headerClassName?: string
  children: React.ReactNode
  noPadding?: boolean
}

export function SectionCard({
  icon,
  title,
  titleExtra,
  action,
  className,
  contentClassName,
  headerClassName,
  children,
  noPadding = false,
}: SectionCardProps) {
  return (
    <Card className={cn('border shadow-none', className)}>
      <CardHeader className={cn('p-3 pb-2', headerClassName)}>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            {icon}
            {title}
            {titleExtra}
          </CardTitle>
          {action}
        </div>
      </CardHeader>
      <CardContent className={cn(noPadding ? 'p-0' : 'p-3 pt-0', contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}
