// ============================================================
// Auth
// ============================================================

export interface User {
  id: string
  email: string
  userRole: 'creative_director' | 'lead_writer'
}

export interface AuthState {
    token: string | null
    user: User | null
}

// ============================================================
// Star
// ============================================================

export interface Star {
    id: string
    name: string
    brand: 'raw' | 'smackdown'
    alignment: 'face' | 'heel' | 'neutral'
    status: 'active' | 'injured' | 'suspended'
    scheduleType: 'full_time' | 'part_time' | 'special_appearance'
    workloadThisMonth: number
    consecutiveAppearances: number
    fanScoreValue: number
    fanScoreTrend: string
    drawScoreValue: number
    backstageScoreValue?: number  //only present for creative_director
    backstageScoreBelowThreshold?: boolean
    available: boolean
    contractAppearancesRemaining?: number
}

// ============================================================
// Segment
// ============================================================
export interface Segment {
    id: string
    ppvEventId: string
    narrativeThreadId: string
    segmentType: 'match' | 'championship_match' | 'promo'|
                'backstage' | 'video_package' | 'special_match'
    segmentOrder: number
    durationMinutes: number
    status: 'valid' | 'warning' | 'error'
    contendershipReason: string
    stars: Star[]
}

// ============================================================
// Broadcast Window
// ============================================================

export interface BroadcastWindow {
    eventType: string
    contentMinutes: number
    constraintType: 'soft' | 'hard'
}

// ============================================================
// Card
// ============================================================

export interface Card {
    showId: string
    broadcastWindow: BroadcastWindow
    segments: Segment[]
    availableStars: Star[]
}

// ============================================================
// Narrative Thread
// ============================================================

export interface NarrativeThread {
    id: string
    name: string
    brand: 'raw' | 'smackdown'
    status: 'on_track' | 'stalling' | 'abandoned'
    heatTrajectory: 'rising' | 'falling' | 'stable'
    targetPleId: string
    buildWeeksTarget: number
    buildWeeksCompleted: number
    lastSegmentDate?: string
    stars: Star[]
}

// ============================================================
// Championship
// ============================================================

export interface Championship {
    id: string
    name: string
    brand: 'raw' | 'smackdown' | null
    prestigeTier: 'world' | 'secondary' | 'tag_team' |
                  'womens_world' | 'womens_secondary'
    currentHolderId: string
    reignStart?: string
}

// ============================================================
// Backup Plan
// ============================================================

export interface BackupPlan {
    id: string
    solverRunId: string
    rank: number
    confidenceScore: number
    modifiedSegments: Segment[]
    reasoning: string
    warnings: string[]
    accepted: boolean
}

// ============================================================
// Todo item
// ============================================================

export type TodoTier = 'blocker' | 'warning' | 'decision'

export interface TodoItem {
    id: string
    tier: TodoTier
    message: string
    segmentId?: string
    starId?: string
    threadId?: string
}

// ============================================================
// PLE Event
// ============================================================

export interface PpvEvent {
    id: string
    name: string
    eventType: 'raw' | 'smackdown' | 'ple' | 'special'
    eventDateStart: string
    eventDateEnd?: string
    location?: string
    prestigeTier: 'standard' | 'premium'
    brand?: 'raw' | 'smackdown'
}