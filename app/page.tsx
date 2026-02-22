'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { callAIAgent } from '@/lib/aiAgent'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
} from 'react-icons/fi'

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

type AppState = 'idle' | 'running'

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

function renderMarkdown(text: string) {
  if (!text) return null
  return (
    <div className="space-y-1">
      {text.split('\n').map((line, i) => {
        if (line.startsWith('### '))
          return (
            <h4 key={i} className="font-semibold text-sm mt-2 mb-1">
              {line.slice(4)}
            </h4>
          )
        if (line.startsWith('## '))
          return (
            <h3 key={i} className="font-semibold text-base mt-2 mb-1">
              {line.slice(3)}
            </h3>
          )
        if (line.startsWith('# '))
          return (
            <h2 key={i} className="font-bold text-lg mt-3 mb-1">
              {line.slice(2)}
            </h2>
          )
        if (line.startsWith('- ') || line.startsWith('* '))
          return (
            <li key={i} className="ml-4 list-disc text-sm">
              {formatInline(line.slice(2))}
            </li>
          )
        if (/^\d+\.\s/.test(line))
          return (
            <li key={i} className="ml-4 list-decimal text-sm">
              {formatInline(line.replace(/^\d+\.\s/, ''))}
            </li>
          )
        if (!line.trim()) return <div key={i} className="h-1" />
        return (
          <p key={i} className="text-sm">
            {formatInline(line)}
          </p>
        )
      })}
    </div>
  )
}

function formatInline(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  if (parts.length === 1) return text
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold">
        {part}
      </strong>
    ) : (
      part
    )
  )
}

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
}) {
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
              disabled={appState === 'running'}
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
              disabled={appState === 'running'}
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
              disabled={appState === 'running'}
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Button
              size="sm"
              onClick={onStart}
              disabled={appState === 'running' || !targetWord.trim()}
              className="h-8 gap-1 text-xs"
            >
              <FiPlay className="w-3 h-3" />
              시작
            </Button>
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
            <Badge
              variant={appState === 'running' ? 'default' : 'secondary'}
              className={cn('text-xs', appState === 'running' && 'animate-pulse')}
            >
              {appState === 'running' ? (
                <>
                  <FiActivity className="w-3 h-3 mr-1" />
                  동작
                </>
              ) : (
                '대기'
              )}
            </Badge>
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
}: {
  targetCount: number
  currentCount: number
  successCount: number
  failCount: number
  avgResponseTime: number
  elapsedTime: string
}) {
  const progressPercent = targetCount > 0 ? Math.min(100, (currentCount / targetCount) * 100) : 0

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        <Card className="border shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              <FiTarget className="inline w-3 h-3 mr-1" />목표수
            </div>
            <div className="text-2xl font-semibold">{targetCount}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              <FiTrendingUp className="inline w-3 h-3 mr-1" />현재수
            </div>
            <div className="text-2xl font-semibold text-primary">{currentCount}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              <FiCheckCircle className="inline w-3 h-3 mr-1" />성공
            </div>
            <div className="text-2xl font-semibold" style={{ color: 'hsl(160, 65%, 40%)' }}>{successCount}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              <FiXCircle className="inline w-3 h-3 mr-1" />실패
            </div>
            <div className="text-2xl font-semibold text-destructive">{failCount}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              <FiZap className="inline w-3 h-3 mr-1" />평균 응답
            </div>
            <div className="text-2xl font-semibold">{avgResponseTime > 0 ? `${avgResponseTime}ms` : '-'}</div>
          </CardContent>
        </Card>
        <Card className="border shadow-none">
          <CardContent className="p-3 text-center">
            <div className="text-xs text-muted-foreground font-medium mb-1">
              <FiClock className="inline w-3 h-3 mr-1" />경과시간
            </div>
            <div className="text-2xl font-semibold">{elapsedTime || '-'}</div>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center gap-3">
        <Progress value={progressPercent} className="flex-1 h-3" />
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          {currentCount} / {targetCount} ({progressPercent.toFixed(1)}%)
        </span>
      </div>
    </div>
  )
}

function DataGrid({ records }: { records: DataRecord[] }) {
  return (
    <Card className="border shadow-none flex-1 flex flex-col min-h-0">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-1">
          <FiFileText className="w-4 h-4" />
          데이터 기록
          <Badge variant="secondary" className="text-xs ml-2">{records.length}건</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1 min-h-0">
        {records.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
            <div className="text-center">
              <FiFileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>데이터가 없습니다. 테스트를 시작하세요.</p>
            </div>
          </div>
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
                {[...records].reverse().map((record) => (
                  <TableRow key={record.id} className="text-xs">
                    <TableCell className="py-1.5 px-4 font-mono text-muted-foreground">{record.id}</TableCell>
                    <TableCell className="py-1.5 px-4">{record.date}</TableCell>
                    <TableCell className="py-1.5 px-4 font-mono">{record.sequence}</TableCell>
                    <TableCell className="py-1.5 px-4 font-medium">{record.targetWord}</TableCell>
                    <TableCell className="py-1.5 px-4 font-mono text-muted-foreground">{record.savedAt}</TableCell>
                    <TableCell className="py-1.5 px-4 font-mono">{record.responseTime}ms</TableCell>
                    <TableCell className="py-1.5 px-4">
                      {record.success ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0" style={{ backgroundColor: 'hsl(160, 65%, 40%)' }}>
                          <FiCheckCircle className="w-2.5 h-2.5 mr-0.5" />OK
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          <FiXCircle className="w-2.5 h-2.5 mr-0.5" />FAIL
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
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
  const reportFields: { key: keyof AnalysisResult; label: string; icon: React.ReactNode }[] = [
    { key: 'summary', label: '테스트 결과 요약', icon: <FiFileText className="w-4 h-4" /> },
    { key: 'success_rate', label: '저장 성공률', icon: <FiCheckCircle className="w-4 h-4" /> },
    { key: 'avg_response_time', label: '평균 응답시간', icon: <FiClock className="w-4 h-4" /> },
    { key: 'min_response_time', label: '최소 응답시간', icon: <FiZap className="w-4 h-4" /> },
    { key: 'max_response_time', label: '최대 응답시간', icon: <FiAlertTriangle className="w-4 h-4" /> },
    { key: 'total_duration', label: '전체 소요시간', icon: <FiClock className="w-4 h-4" /> },
    { key: 'error_analysis', label: '오류 패턴 분석', icon: <FiXCircle className="w-4 h-4" /> },
    { key: 'evaluation', label: '종합 평가', icon: <FiBarChart2 className="w-4 h-4" /> },
    { key: 'recommendations', label: '개선 권고사항', icon: <FiTrendingUp className="w-4 h-4" /> },
  ]

  return (
    <Card className="border shadow-none">
      <CardHeader className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            <FiBarChart2 className="w-4 h-4" />
            결과 분석 리포트
          </CardTitle>
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
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {analysisError && (
          <div className="p-2 mb-2 border border-destructive/30 bg-destructive/5 rounded text-sm text-destructive">
            <FiAlertTriangle className="inline w-3 h-3 mr-1" />
            {analysisError}
          </div>
        )}
        {!analysis && !analysisLoading && !analysisError && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <FiBarChart2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>테스트 완료 후 &quot;결과 분석&quot; 버튼을 클릭하세요.</p>
            <p className="text-xs mt-1">AI 에이전트가 테스트 데이터를 분석합니다.</p>
          </div>
        )}
        {analysisLoading && (
          <div className="text-center py-8">
            <FiLoader className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">AI 에이전트가 테스트 결과를 분석하고 있습니다...</p>
            <p className="text-xs text-muted-foreground mt-1">잠시만 기다려주세요.</p>
          </div>
        )}
        {analysis && !analysisLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {reportFields.map((field) => {
              const value = analysis?.[field.key] ?? ''
              const isLongText = typeof value === 'string' && (value.length > 100 || value.includes('\n'))
              const isMetric = ['success_rate', 'avg_response_time', 'min_response_time', 'max_response_time', 'total_duration'].includes(field.key)

              if (isLongText) {
                return (
                  <Card key={field.key} className="border shadow-none col-span-1 md:col-span-2 lg:col-span-3">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
                        {field.icon}
                        <span className="text-xs font-medium">{field.label}</span>
                      </div>
                      <div className="text-sm">{renderMarkdown(value)}</div>
                    </CardContent>
                  </Card>
                )
              }

              return (
                <Card key={field.key} className="border shadow-none">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1.5 mb-1 text-muted-foreground">
                      {field.icon}
                      <span className="text-xs font-medium">{field.label}</span>
                    </div>
                    {isMetric ? (
                      <div className="text-lg font-semibold">{value || '-'}</div>
                    ) : (
                      <div className="text-sm">{value ? renderMarkdown(value) : <span className="text-muted-foreground">-</span>}</div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
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
            <Badge variant="default" className="text-[10px] px-1.5 py-0 animate-pulse ml-auto">
              <FiActivity className="w-2.5 h-2.5 mr-0.5" />활성
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-auto">대기</Badge>
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
  const [startTime, setStartTime] = useState<number | null>(null)
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

  // Refs for interval management
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const idCounterRef = useRef(0)
  const dailySequenceRef = useRef<{ [date: string]: number }>({})
  const currentCountRef = useRef(0)
  const targetCountRef = useRef(10)

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

  // Elapsed time timer
  useEffect(() => {
    if (appState === 'running' && startTime) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000)
        const mins = Math.floor(elapsed / 60)
        const secs = elapsed % 60
        setElapsedTime(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`)
      }, 1000)
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [appState, startTime])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
    }
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

    const now = Date.now()
    setStartTime(now)
    setAppState('running')

    // Create the save interval
    intervalRef.current = setInterval(() => {
      if (currentCountRef.current >= targetCountRef.current) {
        // Target reached - stop
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        setAppState('idle')
        setTestCompleted(true)
        return
      }

      const timestamp = new Date()
      const dateStr = formatDate(timestamp)
      idCounterRef.current += 1

      // Compute daily sequence
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
        targetWord: `${targetWord}${idCounterRef.current}`,
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

      // Check if target reached after this save
      if (currentCountRef.current >= targetCountRef.current) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        setAppState('idle')
        setTestCompleted(true)
      }
    }, saveInterval * 1000)
  }, [targetWord, targetCount, saveInterval])

  const handleStop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setAppState('idle')
    if (currentCountRef.current > 0) {
      setTestCompleted(true)
    }
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
            <div className="flex items-center gap-2">
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
                disabled={appState === 'running'}
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
          />

          {/* Status Cards */}
          <StatusCards
            targetCount={displayTargetCount}
            currentCount={displayCurrentCount}
            successCount={displaySuccessCount}
            failCount={displayFailCount}
            avgResponseTime={computeAvgResponseTime()}
            elapsedTime={showSample ? '00:30' : elapsedTime}
          />

          {/* Data Grid */}
          <DataGrid records={displayRecords} />

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
      </div>
    </ErrorBoundary>
  )
}
