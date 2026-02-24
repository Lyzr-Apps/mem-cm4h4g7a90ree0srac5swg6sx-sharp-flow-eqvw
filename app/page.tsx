'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FiPlay,
  FiPause,
  FiSquare,
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTarget,
  FiHash,
  FiTrendingUp,
  FiAlertTriangle,
  FiFileText,
  FiLoader,
  FiZap,
  FiServer,
  FiTrash2,
  FiDatabase,
  FiGrid,
} from 'react-icons/fi'
import {
  MetricCard,
  SectionCard,
  StatusBadge,
  InlineMessage,
  MarkdownContent,
} from '@/components/shared'
import { ComponentDemo } from '@/components/shared/ComponentDemo'

// --- Constants ---
const AGENT_ID = '699af8fa6bdd139cd6b4f10c'

// --- TypeScript Interfaces ---
interface DataRecord {
  id: number
  date: string
  sequence: number
  targetWord: string
  savedAt: string
  responseTime: number
  success: boolean
}

interface AnalysisResult {
  summary?: string
  success_rate?: string
  avg_response_time?: string
  min_response_time?: string
  max_response_time?: string
  total_duration?: string
  error_analysis?: string
  evaluation?: string
  recommendations?: string
}

type AppState = 'idle' | 'running' | 'paused'

// --- Sample Data ---
function generateSampleData(): DataRecord[] {
  const now = new Date()
  const records: DataRecord[] = []
  for (let i = 1; i <= 10; i++) {
    const ts = new Date(now.getTime() - (10 - i) * 3000)
    records.push({
      id: i,
      date: formatDate(ts),
      sequence: i,
      targetWord: `sample_test${i}`,
      savedAt: formatTimestamp(ts),
      responseTime: Math.floor(50 + Math.random() * 450),
      success: Math.random() > 0.05,
    })
  }
  return records
}

const SAMPLE_ANALYSIS: AnalysisResult = {
  summary: '10건의 요청 중 9건 성공, 1건 실패로 전반적으로 양호한 결과를 보였습니다.',
  success_rate: '90.0%',
  avg_response_time: '245ms',
  min_response_time: '52ms',
  max_response_time: '487ms',
  total_duration: '30초',
  error_analysis: '1건의 타임아웃 오류가 발견되었습니다. 서버 부하에 의한 일시적 지연으로 판단됩니다.',
  evaluation: '전반적으로 안정적인 성능을 보이고 있으나, 최대 응답시간이 다소 높아 개선 여지가 있습니다.',
  recommendations: '1. 서버 캐싱 전략 도입을 권장합니다.\n2. 타임아웃 임계값을 조정하여 재시도 로직을 추가하세요.\n3. 부하 분산 설정을 검토하세요.',
}

// --- Helper Functions ---
function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTimestamp(d: Date): string {
  const date = formatDate(d)
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${date} ${h}:${min}:${s}`
}

// renderMarkdown and formatInline moved to @/components/shared/MarkdownContent

// --- ErrorBoundary ---
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: '' }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
          <div className="text-center p-8 max-w-md">
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4 text-sm">{this.state.error}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: '' })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// --- Sub-Components ---

function HeaderToolbar({
  targetWord,
  setTargetWord,
  targetCount,
  setTargetCount,
  saveInterval,
  setSaveInterval,
  appState,
  onStart,
  onStop,
  onPause,
  onResume,
}: {
  targetWord: string
  setTargetWord: (v: string) => void
  targetCount: number
  setTargetCount: (v: number) => void
  saveInterval: number
  setSaveInterval: (v: number) => void
  appState: AppState
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
}) {
  const isInputDisabled = appState === 'running' || appState === 'paused'

  return (
    <Card className="border shadow-none">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <Label htmlFor="targetWord" className="text-xs font-medium text-muted-foreground mb-1 block">
              <FiTarget className="inline mr-1 w-3 h-3" />
              대상어
            </Label>
            <Input
              id="targetWord"
              placeholder="검색어 입력"
              value={targetWord}
              onChange={(e) => setTargetWord(e.target.value)}
              disabled={isInputDisabled}
              className="h-8 text-sm"
            />
          </div>
          <div className="w-[100px]">
            <Label htmlFor="targetCount" className="text-xs font-medium text-muted-foreground mb-1 block">
              <FiHash className="inline mr-1 w-3 h-3" />
              목표수
            </Label>
            <Input
              id="targetCount"
              type="number"
              min={1}
              value={targetCount}
              onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isInputDisabled}
              className="h-8 text-sm"
            />
          </div>
          <div className="w-[120px]">
            <Label htmlFor="saveInterval" className="text-xs font-medium text-muted-foreground mb-1 block">
              <FiClock className="inline mr-1 w-3 h-3" />
              저장간격 (초)
            </Label>
            <Input
              id="saveInterval"
              type="number"
              min={1}
              value={saveInterval}
              onChange={(e) => setSaveInterval(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={isInputDisabled}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              onClick={onStart}
              disabled={appState !== 'idle' || !targetWord.trim()}
              className="h-8 gap-1 text-xs"
            >
              <FiPlay className="w-3 h-3" />
              시작
            </Button>
            {appState === 'running' && (
              <Button
                size="sm"
                variant="secondary"
                onClick={onPause}
                className="h-8 gap-1 text-xs"
              >
                <FiPause className="w-3 h-3" />
                일시중지
              </Button>
            )}
            {appState === 'paused' && (
              <Button
                size="sm"
                variant="default"
                onClick={onResume}
                className="h-8 gap-1 text-xs"
              >
                <FiPlay className="w-3 h-3" />
                재개
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={onStop}
              disabled={appState === 'idle'}
              className="h-8 gap-1 text-xs"
            >
              <FiSquare className="w-3 h-3" />
              종료
            </Button>
            {appState === 'running' ? (
              <StatusBadge
                variant="active"
                icon={<FiActivity className="w-3 h-3" />}
                label="동작"
              />
            ) : appState === 'paused' ? (
              <StatusBadge
                variant="warning"
                icon={<FiPause className="w-3 h-3" />}
                label="일시중지"
              />
            ) : (
              <StatusBadge variant="idle" label="대기" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusCards({
  targetCount,
  currentCount,
  successCount,
  failCount,
  avgResponseTime,
  elapsedTime,
  totalRecords,
  appState,
}: {
  targetCount: number
  currentCount: number
  successCount: number
  failCount: number
  avgResponseTime: number
  elapsedTime: string
  totalRecords: number
  appState: AppState
}) {
  const progressPercent = targetCount > 0 ? Math.min(100, (currentCount / targetCount) * 100) : 0

  return (
    <div className="space-y-2">
      {/* Row 1: 목표수, 현재수, 성공건수, 실패건수 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <MetricCard
          icon={<FiTarget className="w-3 h-3" />}
          label="목표수"
          value={targetCount}
        />
        <MetricCard
          icon={<FiTrendingUp className="w-3 h-3" />}
          label="현재수"
          value={currentCount}
          valueClassName="text-primary"
        />
        <MetricCard
          icon={<FiCheckCircle className="w-3 h-3" />}
          label="성공건수"
          value={<span style={{ color: 'hsl(160, 65%, 40%)' }}>{successCount}</span>}
        />
        <MetricCard
          icon={<FiXCircle className="w-3 h-3" />}
          label="실패건수"
          value={failCount}
          valueClassName="text-destructive"
        />
      </div>
      {/* Row 2: 평균응답, 동작시간, 전체건수 */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard
          icon={<FiZap className="w-3 h-3" />}
          label="평균응답"
          value={avgResponseTime > 0 ? `${avgResponseTime}ms` : '-'}
        />
        <MetricCard
          icon={<FiClock className="w-3 h-3" />}
          label="동작시간"
          value={
            <>
              {elapsedTime || '00:00'}
              {appState === 'running' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary ml-1.5 animate-pulse align-middle" />
              )}
            </>
          }
          valueClassName={cn(appState === 'running' && 'text-primary')}
        />
        <MetricCard
          icon={<FiDatabase className="w-3 h-3" />}
          label="전체건수"
          value={totalRecords}
        />
      </div>
      {/* Row 3: 프로그레스바 */}
      <div className="flex items-center gap-3">
        <Progress value={progressPercent} className="flex-1 h-3" />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {currentCount} / {targetCount} ({progressPercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

function DataGrid({
  records,
  totalSavedCount,
  onClearRecords,
}: {
  records: DataRecord[]
  totalSavedCount: number
  onClearRecords: () => void
}) {
  // Show only the latest 100 records in the grid (reversed for newest first)
  const displayRecords = records.length > 100
    ? records.slice(records.length - 100).reverse()
    : [...records].reverse()

  return (
    <SectionCard
      icon={<FiFileText className="w-4 h-4" />}
      title="데이터 기록"
      titleExtra={
        <>
          <StatusBadge variant="idle" label={`저장 ${totalSavedCount}건`} size="sm" className="ml-2" />
          {records.length > 100 && (
            <span className="text-[10px] text-muted-foreground ml-1">(최근 100건 표시)</span>
          )}
        </>
      }
      action={
        <Button
          size="sm"
          variant="destructive"
          onClick={onClearRecords}
          disabled={records.length === 0}
          className="h-7 text-xs gap-1"
        >
          <FiTrash2 className="w-3 h-3" />
          기록삭제
        </Button>
      }
      className="flex-1 flex flex-col min-h-0"
      noPadding
    >
        {records.length === 0 ? (
          <InlineMessage
            variant="empty"
            icon={<FiFileText className="w-8 h-8" />}
            title="데이터가 없습니다. 테스트를 시작하세요."
            className="h-[200px] flex items-center justify-center"
          />
        ) : (
          <ScrollArea className="h-[360px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="h-8 text-xs w-[60px]">번호</TableHead>
                  <TableHead className="h-8 text-xs w-[100px]">날짜</TableHead>
                  <TableHead className="h-8 text-xs w-[60px]">순서</TableHead>
                  <TableHead className="h-8 text-xs">대상어</TableHead>
                  <TableHead className="h-8 text-xs w-[150px]">저장일시</TableHead>
                  <TableHead className="h-8 text-xs w-[80px]">응답시간</TableHead>
                  <TableHead className="h-8 text-xs w-[60px]">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRecords.map((record) => (
                  <TableRow key={record.id} className="text-xs">
                    <TableCell className="py-1.5 px-4 font-mono text-muted-foreground">{record.id}</TableCell>
                    <TableCell className="py-1.5 px-4">{record.date}</TableCell>
                    <TableCell className="py-1.5 px-4 font-mono">{record.sequence}</TableCell>
                    <TableCell className="py-1.5 px-4 font-medium">{record.targetWord}</TableCell>
                    <TableCell className="py-1.5 px-4 font-mono text-muted-foreground">{record.savedAt}</TableCell>
                    <TableCell className="py-1.5 px-4 font-mono">{record.responseTime}ms</TableCell>
                    <TableCell className="py-1.5 px-4">
                      {record.success ? (
                        <StatusBadge
                          variant="success"
                          icon={<FiCheckCircle className="w-2.5 h-2.5" />}
                          label="OK"
                          size="sm"
                          className=""
                          style={{ backgroundColor: 'hsl(160, 65%, 40%)' }}
                        />
                      ) : (
                        <StatusBadge
                          variant="error"
                          icon={<FiXCircle className="w-2.5 h-2.5" />}
                          label="FAIL"
                          size="sm"
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
    </SectionCard>
  )
}

function AnalysisReportSection({
  analysis,
  analysisLoading,
  analysisError,
  canAnalyze,
  onAnalyze,
}: {
  analysis: AnalysisResult | null
  analysisLoading: boolean
  analysisError: string
  canAnalyze: boolean
  onAnalyze: () => void
}) {
  return (
    <SectionCard
      icon={<FiBarChart2 className="w-4 h-4" />}
      title="결과 분석 리포트"
      action={
        <Button
          size="sm"
          onClick={onAnalyze}
          disabled={!canAnalyze || analysisLoading}
          className="h-7 text-xs gap-1"
        >
          {analysisLoading ? (
            <>
              <FiLoader className="w-3 h-3 animate-spin" />
              분석 중...
            </>
          ) : (
            <>
              <FiBarChart2 className="w-3 h-3" />
              결과 분석
            </>
          )}
        </Button>
      }
    >
        {analysisError && (
          <InlineMessage
            variant="error"
            icon={<FiAlertTriangle className="w-3 h-3" />}
            title={analysisError}
            className="mb-2"
          />
        )}
        {!analysis && !analysisLoading && !analysisError && (
          <InlineMessage
            variant="empty"
            icon={<FiBarChart2 className="w-8 h-8" />}
            title={'테스트 완료 후 "결과 분석" 버튼을 클릭하세요.'}
            description="AI 에이전트가 테스트 데이터를 분석합니다."
          />
        )}
        {analysisLoading && (
          <InlineMessage
            variant="loading"
            icon={<FiLoader className="w-8 h-8 animate-spin text-primary" />}
            title="AI 에이전트가 테스트 결과를 분석하고 있습니다..."
            description="잠시만 기다려주세요."
          />
        )}
        {analysis && !analysisLoading && (
          <div className="space-y-2">
            {/* Row 1: 테스트 결과 요약, 저장성공률 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Card className="border shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                    <FiFileText className="w-4 h-4" />
                    <span className="text-xs font-medium">테스트 결과 요약</span>
                  </div>
                  <div className="text-sm">
                    <MarkdownContent text={analysis.summary} fallback={<span className="text-muted-foreground">-</span>} />
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <FiCheckCircle className="w-4 h-4" />
                    <span className="text-xs font-medium">저장 성공률</span>
                  </div>
                  <div className="text-lg font-semibold">{analysis.success_rate || '-'}</div>
                </CardContent>
              </Card>
            </div>
            {/* Row 2: 평균응답시간, 전체소요시간 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Card className="border shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <FiClock className="w-4 h-4" />
                    <span className="text-xs font-medium">평균 응답시간</span>
                  </div>
                  <div className="text-lg font-semibold">{analysis.avg_response_time || '-'}</div>
                </CardContent>
              </Card>
              <Card className="border shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <FiClock className="w-4 h-4" />
                    <span className="text-xs font-medium">전체 소요시간</span>
                  </div>
                  <div className="text-lg font-semibold">{analysis.total_duration || '-'}</div>
                </CardContent>
              </Card>
            </div>
            {/* Row 3: 최소응답시간, 최대응답시간 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Card className="border shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <FiZap className="w-4 h-4" />
                    <span className="text-xs font-medium">최소 응답시간</span>
                  </div>
                  <div className="text-lg font-semibold">{analysis.min_response_time || '-'}</div>
                </CardContent>
              </Card>
              <Card className="border shadow-none">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                    <FiAlertTriangle className="w-4 h-4" />
                    <span className="text-xs font-medium">최대 응답시간</span>
                  </div>
                  <div className="text-lg font-semibold">{analysis.max_response_time || '-'}</div>
                </CardContent>
              </Card>
            </div>
            {/* Row 4: 오류 패턴 분석 (full width) */}
            <Card className="border shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                  <FiXCircle className="w-4 h-4" />
                  <span className="text-xs font-medium">오류 패턴 분석</span>
                </div>
                <div className="text-sm">
                  <MarkdownContent text={analysis.error_analysis} fallback={<span className="text-muted-foreground">-</span>} />
                </div>
              </CardContent>
            </Card>
            {/* Row 5: 종합 평가 (full width) */}
            <Card className="border shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                  <FiBarChart2 className="w-4 h-4" />
                  <span className="text-xs font-medium">종합 평가</span>
                </div>
                <div className="text-sm">
                  <MarkdownContent text={analysis.evaluation} fallback={<span className="text-muted-foreground">-</span>} />
                </div>
              </CardContent>
            </Card>
            {/* Row 6: 개선 권고사항 (full width) */}
            <Card className="border shadow-none">
              <CardContent className="p-3">
                <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                  <FiTrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">개선 권고사항</span>
                </div>
                <div className="text-sm">
                  <MarkdownContent text={analysis.recommendations} fallback={<span className="text-muted-foreground">-</span>} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
    </SectionCard>
  )
}

function AgentInfoSection({ activeAgentId }: { activeAgentId: string | null }) {
  return (
    <Card className="border shadow-none">
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <FiServer className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">AI Agent</span>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs font-mono text-muted-foreground">{AGENT_ID.slice(0, 8)}...</span>
          <span className="text-xs text-muted-foreground">테스트 결과 분석 에이전트</span>
          {activeAgentId ? (
            <StatusBadge
              variant="active"
              icon={<FiActivity className="w-2.5 h-2.5" />}
              label="활성"
              size="sm"
              className="ml-auto"
            />
          ) : (
            <StatusBadge variant="idle" label="대기" size="sm" className="ml-auto" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// --- Main Page ---
export default function Page() {
  // Form state
  const [targetWord, setTargetWord] = useState('')
  const [targetCount, setTargetCount] = useState(10)
  const [saveInterval, setSaveInterval] = useState(3)

  // App state
  const [appState, setAppState] = useState<AppState>('idle')
  const [records, setRecords] = useState<DataRecord[]>([])
  const [currentCount, setCurrentCount] = useState(0)
  const [successCount, setSuccessCount] = useState(0)
  const [failCount, setFailCount] = useState(0)
  const [elapsedTime, setElapsedTime] = useState('')
  const [testCompleted, setTestCompleted] = useState(false)

  // Analysis state
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisError, setAnalysisError] = useState('')
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)

  // Sample data
  const [showSample, setShowSample] = useState(false)
  const [sampleRecords] = useState<DataRecord[]>(() => generateSampleData())

  // Component demo
  const [showComponentDemo, setShowComponentDemo] = useState(false)

  // Refs for interval management
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idCounterRef = useRef(0)
  const dailySequenceRef = useRef<{ [date: string]: number }>({})
  const currentCountRef = useRef(0)
  const targetCountRef = useRef(10)
  // Track elapsed time across pause/resume cycles
  const elapsedSecondsRef = useRef(0)
  const timerStartRef = useRef<number | null>(null)
  const saveIntervalRef = useRef(3)

  // Computed values for display
  const displayRecords = showSample ? sampleRecords : records
  const displayCurrentCount = showSample ? 10 : currentCount
  const displayTargetCount = showSample ? 10 : targetCount
  const displaySuccessCount = showSample ? 9 : successCount
  const displayFailCount = showSample ? 1 : failCount
  const displayAnalysis = showSample ? SAMPLE_ANALYSIS : analysis

  const computeAvgResponseTime = useCallback(() => {
    const recs = showSample ? sampleRecords : records
    if (recs.length === 0) return 0
    const total = recs.reduce((sum, r) => sum + r.responseTime, 0)
    return Math.round(total / recs.length)
  }, [showSample, sampleRecords, records])

  // Elapsed time timer - supports pause/resume
  useEffect(() => {
    if (appState === 'running') {
      timerStartRef.current = Date.now()
      timerRef.current = setInterval(() => {
        const additionalSeconds = Math.floor((Date.now() - (timerStartRef.current ?? Date.now())) / 1000)
        const totalSeconds = elapsedSecondsRef.current + additionalSeconds
        const mins = Math.floor(totalSeconds / 60)
        const secs = totalSeconds % 60
        setElapsedTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
      }, 1000)
    } else if (appState === 'paused') {
      // Accumulate elapsed seconds when pausing
      if (timerStartRef.current) {
        elapsedSecondsRef.current += Math.floor((Date.now() - timerStartRef.current) / 1000)
        timerStartRef.current = null
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [appState])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Shared function to create the save interval
  const startSaveInterval = useCallback((word: string) => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    intervalRef.current = setInterval(() => {
      if (currentCountRef.current >= targetCountRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        // Accumulate final elapsed seconds
        if (timerStartRef.current) {
          elapsedSecondsRef.current += Math.floor((Date.now() - timerStartRef.current) / 1000)
          timerStartRef.current = null
        }
        setAppState('idle')
        setTestCompleted(true)
        return
      }

      const timestamp = new Date()
      const dateStr = formatDate(timestamp)
      idCounterRef.current += 1

      if (!dailySequenceRef.current[dateStr]) {
        dailySequenceRef.current[dateStr] = 0
      }
      dailySequenceRef.current[dateStr] += 1

      const responseTime = Math.floor(50 + Math.random() * 450)
      const success = Math.random() > 0.05

      const record: DataRecord = {
        id: idCounterRef.current,
        date: dateStr,
        sequence: dailySequenceRef.current[dateStr],
        targetWord: `${word}${idCounterRef.current}`,
        savedAt: formatTimestamp(timestamp),
        responseTime,
        success,
      }

      setRecords((prev) => [...prev, record])
      currentCountRef.current += 1
      setCurrentCount(currentCountRef.current)

      if (success) {
        setSuccessCount((prev) => prev + 1)
      } else {
        setFailCount((prev) => prev + 1)
      }

      if (currentCountRef.current >= targetCountRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        if (timerStartRef.current) {
          elapsedSecondsRef.current += Math.floor((Date.now() - timerStartRef.current) / 1000)
          timerStartRef.current = null
        }
        setAppState('idle')
        setTestCompleted(true)
      }
    }, saveIntervalRef.current * 1000)
  }, [])

  const handleStart = useCallback(() => {
    if (!targetWord.trim()) return

    // Reset state
    setRecords([])
    setCurrentCount(0)
    setSuccessCount(0)
    setFailCount(0)
    setTestCompleted(false)
    setAnalysis(null)
    setAnalysisError('')
    setElapsedTime('00:00')
    idCounterRef.current = 0
    dailySequenceRef.current = {}
    currentCountRef.current = 0
    targetCountRef.current = targetCount
    elapsedSecondsRef.current = 0
    saveIntervalRef.current = saveInterval

    setAppState('running')
    startSaveInterval(targetWord)
  }, [targetWord, targetCount, saveInterval, startSaveInterval])

  const handlePause = useCallback(() => {
    // Stop the save interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setAppState('paused')
  }, [])

  const handleResume = useCallback(() => {
    setAppState('running')
    startSaveInterval(targetWord)
  }, [targetWord, startSaveInterval])

  const handleStop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    // Accumulate final elapsed seconds
    if (timerStartRef.current) {
      elapsedSecondsRef.current += Math.floor((Date.now() - timerStartRef.current) / 1000)
      timerStartRef.current = null
    }
    setAppState('idle')
    if (currentCountRef.current > 0) {
      setTestCompleted(true)
    }
  }, [])

  const handleClearRecords = useCallback(() => {
    setRecords([])
    setCurrentCount(0)
    setSuccessCount(0)
    setFailCount(0)
    setTestCompleted(false)
    setAnalysis(null)
    setAnalysisError('')
    setElapsedTime('')
    idCounterRef.current = 0
    dailySequenceRef.current = {}
    currentCountRef.current = 0
    elapsedSecondsRef.current = 0
  }, [])

  const handleAnalyze = useCallback(async () => {
    const dataRecords = showSample ? sampleRecords : records
    if (dataRecords.length === 0) return

    setAnalysisLoading(true)
    setAnalysisError('')
    setAnalysis(null)
    setActiveAgentId(AGENT_ID)

    const totalAttempts = dataRecords.length
    const successes = dataRecords.filter((r) => r.success).length
    const failures = totalAttempts - successes
    const responseTimes = dataRecords.map((r) => r.responseTime)
    const avgResp = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    const minResp = Math.min(...responseTimes)
    const maxResp = Math.max(...responseTimes)
    const successRate = ((successes / totalAttempts) * 100).toFixed(1)

    const message = `다음은 장기 요청/응답 테스트 결과입니다. 분석해주세요.

테스트 개요:
- 대상어: ${showSample ? 'sample_test' : targetWord}
- 총 시도 횟수: ${totalAttempts}건
- 성공 횟수: ${successes}건
- 실패 횟수: ${failures}건
- 성공률: ${successRate}%
- 평균 응답시간: ${avgResp}ms
- 최소 응답시간: ${minResp}ms
- 최대 응답시간: ${maxResp}ms
- 전체 소요시간: ${showSample ? '30초' : elapsedTime}

실패 기록:
${dataRecords.filter((r) => !r.success).map((r) => `- ID ${r.id}: ${r.targetWord} (응답시간: ${r.responseTime}ms, 시간: ${r.savedAt})`).join('\n') || '없음'}

응답시간 분포:
- 100ms 이하: ${responseTimes.filter((t) => t <= 100).length}건
- 100-200ms: ${responseTimes.filter((t) => t > 100 && t <= 200).length}건
- 200-300ms: ${responseTimes.filter((t) => t > 200 && t <= 300).length}건
- 300-400ms: ${responseTimes.filter((t) => t > 300 && t <= 400).length}건
- 400ms 이상: ${responseTimes.filter((t) => t > 400).length}건

종합 분석, 오류 패턴, 평가 및 개선 권고사항을 포함하여 리포트를 작성해주세요.`

    try {
      const result = await callAIAgent(message, AGENT_ID)

      if (result?.success && result?.response?.result) {
        const data = result.response.result
        setAnalysis({
          summary: data?.summary ?? '',
          success_rate: data?.success_rate ?? '',
          avg_response_time: data?.avg_response_time ?? '',
          min_response_time: data?.min_response_time ?? '',
          max_response_time: data?.max_response_time ?? '',
          total_duration: data?.total_duration ?? '',
          error_analysis: data?.error_analysis ?? '',
          evaluation: data?.evaluation ?? '',
          recommendations: data?.recommendations ?? '',
        })
      } else {
        setAnalysisError(result?.error ?? result?.response?.message ?? '분석 요청에 실패했습니다. 다시 시도해주세요.')
      }
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : '네트워크 오류가 발생했습니다.')
    } finally {
      setAnalysisLoading(false)
      setActiveAgentId(null)
    }
  }, [showSample, sampleRecords, records, targetWord, elapsedTime])

  const canAnalyze = showSample || (testCompleted && records.length > 0)

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background text-foreground font-sans">
        {/* Top bar */}
        <div className="border-b bg-card px-4 py-2">
          <div className="max-w-[1400px] mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FiActivity className="w-5 h-5 text-primary" />
              <h1 className="text-base font-semibold">장기 요청/응답 테스트 모니터링</h1>
            </div>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowComponentDemo(true)}
                className="h-7 text-xs gap-1"
              >
                <FiGrid className="w-3 h-3" />
                Components
              </Button>
              <Separator orientation="vertical" className="h-4" />
              <Label htmlFor="sample-toggle" className="text-xs text-muted-foreground">Sample Data</Label>
              <Switch
                id="sample-toggle"
                checked={showSample}
                onCheckedChange={(checked) => {
                  setShowSample(checked)
                  if (checked) {
                    setTestCompleted(true)
                  }
                }}
                disabled={appState !== 'idle'}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-[1400px] mx-auto p-3 space-y-3">
          {/* Header Toolbar */}
          <HeaderToolbar
            targetWord={targetWord}
            setTargetWord={setTargetWord}
            targetCount={targetCount}
            setTargetCount={setTargetCount}
            saveInterval={saveInterval}
            setSaveInterval={setSaveInterval}
            appState={appState}
            onStart={handleStart}
            onStop={handleStop}
            onPause={handlePause}
            onResume={handleResume}
          />

          {/* Status Cards */}
          <StatusCards
            targetCount={displayTargetCount}
            currentCount={displayCurrentCount}
            successCount={displaySuccessCount}
            failCount={displayFailCount}
            avgResponseTime={computeAvgResponseTime()}
            elapsedTime={showSample ? '00:30' : elapsedTime}
            totalRecords={showSample ? sampleRecords.length : records.length}
            appState={appState}
          />

          {/* Data Grid */}
          <DataGrid
            records={displayRecords}
            totalSavedCount={showSample ? sampleRecords.length : records.length}
            onClearRecords={handleClearRecords}
          />

          {/* Analysis Report */}
          <AnalysisReportSection
            analysis={displayAnalysis}
            analysisLoading={analysisLoading}
            analysisError={analysisError}
            canAnalyze={canAnalyze}
            onAnalyze={handleAnalyze}
          />

          {/* Agent Info */}
          <AgentInfoSection activeAgentId={activeAgentId} />
        </div>

        {/* Component Demo Modal */}
        {showComponentDemo && (
          <ComponentDemo onClose={() => setShowComponentDemo(false)} />
        )}
      </div>
    </ErrorBoundary>
  )
}
