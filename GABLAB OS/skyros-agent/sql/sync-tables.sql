-- SKYROS Agent — Supabase Sync Tables
-- Multi-Instance synchronization for 4 agents across 2 machines
-- Run: supabase db push (or paste in Supabase SQL Editor)

-- Events bus: all agents publish/consume real-time events
CREATE TABLE IF NOT EXISTS kairos_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  machine TEXT NOT NULL,
  event_type TEXT NOT NULL,     -- 'decision', 'progress', 'heartbeat', 'context_update', 'session_start', 'session_end'
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task claims: prevents 2 agents from working on the same task
CREATE TABLE IF NOT EXISTS kairos_task_claims (
  task_id TEXT PRIMARY KEY,
  task_name TEXT,
  claimed_by TEXT,               -- agent_id
  machine TEXT,
  claimed_at TIMESTAMPTZ,
  heartbeat_at TIMESTAMPTZ,
  completed BOOLEAN DEFAULT false,
  result JSONB DEFAULT '{}'
);

-- Shared context: latest SELF_CONTEXT and STATUS synced across machines
CREATE TABLE IF NOT EXISTS kairos_shared_context (
  key TEXT PRIMARY KEY,          -- 'self_context' or 'status'
  content TEXT NOT NULL,
  updated_by TEXT NOT NULL,      -- agent_id
  machine TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Decisions log: immutable record of all decisions taken by any agent
CREATE TABLE IF NOT EXISTS kairos_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  machine TEXT NOT NULL,
  decision TEXT NOT NULL,
  context TEXT,
  impact TEXT,                   -- 'low', 'medium', 'high', 'critical'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_type ON kairos_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created ON kairos_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_agent ON kairos_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_claims_active ON kairos_task_claims(claimed_by) WHERE completed = false;
CREATE INDEX IF NOT EXISTS idx_decisions_created ON kairos_decisions(created_at DESC);

-- Enable Realtime on the events table for live sync
ALTER PUBLICATION supabase_realtime ADD TABLE kairos_events;
ALTER PUBLICATION supabase_realtime ADD TABLE kairos_task_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE kairos_shared_context;
