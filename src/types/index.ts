export interface Interaction {
  interaction_id: string
  language_name: string
  channel_type: string
  channel_direction: 'inbound' | 'outbound' | string
  connectivity_status: string
  duration_in_seconds: number
  end_reason: string
  ended_by: string
  num_messages: number
  goal_overall_status: string
  user_contact: string
  user_contact_masked: string
  agent_variables?: Record<string, unknown>
  original_transcript?: TranscriptMessage[]
  created_at?: string
  started_at?: string
}

export interface Attempt {
  attempt_id: string
  interaction_id?: string
  connectivity_status: string
  failure_reason?: string
  channel_direction: string
  channel_type: string
  user_contact_masked: string
  created_at?: string
  started_at?: string
}

export interface TranscriptMessage {
  role: 'user' | 'assistant' | string
  content: string
  timestamp?: string
}

export interface Transcript {
  interaction_id: string
  messages: TranscriptMessage[]
}

export interface LifecycleEvent {
  event: string
  timestamp: string
  data?: Record<string, unknown>
}

export interface TraceTurn {
  turn_id: number
  asr_latency_ms?: number
  llm_latency_ms?: number
  tts_latency_ms?: number
  user_text?: string
  assistant_text?: string
  events?: LifecycleEvent[]
}

export interface Trace {
  interaction_id: string
  lifecycle_events: LifecycleEvent[]
  turns: TraceTurn[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
  next_page_uri?: string
  prev_page_uri?: string
}

export interface DateRange {
  start: Date
  end: Date
}

export interface CallSummary {
  speakerTurns: { user: number; assistant: number }
  estimatedTopics: string[]
  outcome: string
  duration: number
  language: string
  endedBy: string
  agentVariables: Record<string, unknown>
}

// --- Campaign types ---
export interface Campaign {
  campaign_id: string
  name: string
  status: 'scheduled' | 'active' | 'ended' | 'paused' | 'cancelled'
  app_id: string
  created_by: string
  created_at: string
  updated_at: string
  start_timestamp: string
  end_timestamp: string
  description?: string | null
  app_version?: number | null
  updated_by?: string | null
}

// --- Board types ---
export interface Board {
  id: string
  name: string
  created_by: { name?: string }
  created_at: string
  updated_at: string
  tabs: BoardTab[]
  filters: BoardFilter[]
  tag?: string | null
}

export interface BoardTab {
  id: string
  name: string
  widgets: BoardWidget[]
}

export interface BoardWidget {
  id: string
  name: string
}

export interface BoardFilter {
  internal_name: string
  label: string
  filter_type: 'string' | 'number' | 'date' | 'dropdown'
  default_value?: string | null
  is_required: boolean
}

export interface TabRunResult {
  results: WidgetResult[]
  filter_values_used: Record<string, string | null>
}

export interface WidgetResult {
  widget_id: string
  status: 'ok' | 'error'
  rows?: Record<string, unknown>[]
  columns?: { name: string; type: string }[]
  truncated?: boolean
  error?: { code: string; message: string }
}

// ── Webhook call — received from Sarvam POST after every call ──────────────
export interface WebhookTranscriptTurn {
  role: 'user' | 'agent' | string
  en_text: string
  indic_text?: string | null
}

export interface WebhookCall {
  // Identity
  interaction_id:   string
  app_id:           string | null
  app_version:      number | null
  deployment_id:    string | null

  // Parties
  user_phone_number:  string | null
  agent_phone_number: string | null

  // Timing
  duration:        number | null
  start_datetime:  string | null
  end_datetime:    string | null

  // Recording — direct URL from Sarvam, or null
  recording_url:   string | null

  // Raw agent variable blobs
  final_agent_variables:  Record<string, unknown>
  output_agent_variables: Record<string, unknown>

  // Promoted columns for the call-log table
  call_summary:          string | null
  call_disposition:      string | null
  caller_name:           string | null
  course_interested_in:  string | null
  human_transfer_needed: boolean | string | null
  lead_status:           string | null

  // Full conversation transcript
  interaction_transcript: WebhookTranscriptTurn[] | null

  // Metadata echoed by Sarvam
  metadata: Record<string, unknown> | null

  // Server-added
  received_at: string
  webhook_src: string
}

export interface WebhookCallsResponse {
  total:  number
  limit:  number
  offset: number
  items:  WebhookCall[]
}
