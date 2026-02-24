'use client'

import React from 'react'
import { MetricCard } from './MetricCard'
import { SectionCard } from './SectionCard'
import { StatusBadge } from './StatusBadge'
import { InlineMessage } from './InlineMessage'
import { MarkdownContent } from './MarkdownContent'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FiTarget,
  FiCheckCircle,
  FiXCircle,
  FiActivity,
  FiPause,
  FiBarChart2,
  FiFileText,
  FiLoader,
  FiAlertTriangle,
  FiZap,
  FiX,
} from 'react-icons/fi'

interface ComponentDemoProps {
  onClose: () => void
}

export function ComponentDemo({ onClose }: ComponentDemoProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg w-full max-w-[900px] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h2 className="text-base font-semibold">Design System - Component Demo</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Reusable shared components for the monitoring dashboard
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0">
            <FiX className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-6">
            {/* 1. MetricCard */}
            <section>
              <h3 className="text-sm font-semibold mb-1">MetricCard</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Compact metric display with icon, label, and large value. Used for KPI dashboards.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <MetricCard
                  icon={<FiTarget className="w-3 h-3" />}
                  label="Default"
                  value={100}
                />
                <MetricCard
                  icon={<FiCheckCircle className="w-3 h-3" />}
                  label="Success"
                  value={95}
                  valueClassName="text-primary"
                />
                <MetricCard
                  icon={<FiXCircle className="w-3 h-3" />}
                  label="Error"
                  value={5}
                  valueClassName="text-destructive"
                />
                <MetricCard
                  icon={<FiZap className="w-3 h-3" />}
                  label="Response"
                  value="245ms"
                  valueClassName=""
                />
              </div>
            </section>

            <Separator />

            {/* 2. SectionCard */}
            <section>
              <h3 className="text-sm font-semibold mb-1">SectionCard</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Card with header containing icon, title, optional extras, and action slot.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <SectionCard
                  icon={<FiFileText className="w-4 h-4" />}
                  title="Basic Section"
                >
                  <p className="text-sm text-muted-foreground">
                    Basic section card with icon and title.
                  </p>
                </SectionCard>
                <SectionCard
                  icon={<FiBarChart2 className="w-4 h-4" />}
                  title="With Action"
                  titleExtra={
                    <StatusBadge variant="success" label="3 items" size="sm" />
                  }
                  action={
                    <Button size="sm" className="h-7 text-xs gap-1">
                      <FiBarChart2 className="w-3 h-3" />
                      Action
                    </Button>
                  }
                >
                  <p className="text-sm text-muted-foreground">
                    Section with title badge and action button in the header.
                  </p>
                </SectionCard>
              </div>
            </section>

            <Separator />

            {/* 3. StatusBadge */}
            <section>
              <h3 className="text-sm font-semibold mb-1">StatusBadge</h3>
              <p className="text-xs text-muted-foreground mb-3">
                State-aware badge with variant styling. Supports idle, active, warning, success, error.
              </p>
              <div className="flex flex-wrap gap-2 items-center">
                <StatusBadge variant="idle" label="Idle" />
                <StatusBadge
                  variant="active"
                  icon={<FiActivity className="w-3 h-3" />}
                  label="Active"
                />
                <StatusBadge
                  variant="warning"
                  icon={<FiPause className="w-3 h-3" />}
                  label="Warning"
                />
                <StatusBadge
                  variant="success"
                  icon={<FiCheckCircle className="w-3 h-3" />}
                  label="Success"
                />
                <StatusBadge
                  variant="error"
                  icon={<FiXCircle className="w-3 h-3" />}
                  label="Error"
                />
              </div>
              <div className="flex flex-wrap gap-2 items-center mt-2">
                <span className="text-xs text-muted-foreground mr-1">Small:</span>
                <StatusBadge variant="idle" label="Idle" size="sm" />
                <StatusBadge
                  variant="active"
                  icon={<FiActivity className="w-2.5 h-2.5" />}
                  label="Active"
                  size="sm"
                />
                <StatusBadge
                  variant="success"
                  icon={<FiCheckCircle className="w-2.5 h-2.5" />}
                  label="OK"
                  size="sm"
                />
                <StatusBadge
                  variant="error"
                  icon={<FiXCircle className="w-2.5 h-2.5" />}
                  label="FAIL"
                  size="sm"
                />
              </div>
            </section>

            <Separator />

            {/* 4. InlineMessage */}
            <section>
              <h3 className="text-sm font-semibold mb-1">InlineMessage</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Contextual message for error, empty state, loading, and info scenarios.
              </p>
              <div className="space-y-2">
                <InlineMessage
                  variant="error"
                  icon={<FiAlertTriangle className="w-3 h-3" />}
                  title="An error occurred while processing the request."
                />
                <InlineMessage
                  variant="empty"
                  icon={<FiFileText className="w-8 h-8" />}
                  title="No data available."
                  description="Start a test to begin collecting records."
                />
                <InlineMessage
                  variant="loading"
                  icon={<FiLoader className="w-8 h-8 animate-spin text-primary" />}
                  title="Analyzing test results..."
                  description="Please wait a moment."
                />
                <InlineMessage
                  variant="info"
                  icon={<FiActivity className="w-3 h-3" />}
                  title="System is operating normally."
                />
              </div>
            </section>

            <Separator />

            {/* 5. MarkdownContent */}
            <section>
              <h3 className="text-sm font-semibold mb-1">MarkdownContent</h3>
              <p className="text-xs text-muted-foreground mb-3">
                Renders simple markdown text with headings, lists, bold, and paragraphs.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <SectionCard
                  icon={<FiFileText className="w-4 h-4" />}
                  title="Markdown Example"
                >
                  <MarkdownContent
                    text={`## Analysis Summary\nOverall performance is **stable** with minor issues.\n\n### Key Findings\n- Success rate: **95.0%**\n- Average response: **245ms**\n\n### Recommendations\n1. Implement server caching strategy\n2. Add retry logic for timeouts\n3. Review load balancing configuration`}
                  />
                </SectionCard>
                <SectionCard
                  icon={<FiFileText className="w-4 h-4" />}
                  title="With Fallback"
                >
                  <MarkdownContent
                    text={null}
                    fallback={<span className="text-muted-foreground text-sm">-</span>}
                  />
                  <Separator className="my-2" />
                  <p className="text-xs text-muted-foreground">
                    When text is null/undefined, the fallback is rendered.
                  </p>
                </SectionCard>
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
