CREATE TABLE IF NOT EXISTS agent_messages (
  id SERIAL PRIMARY KEY,
  agent VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_agent_created_at
  ON agent_messages (agent, created_at DESC);
