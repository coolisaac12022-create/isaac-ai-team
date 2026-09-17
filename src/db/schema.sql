CREATE TABLE IF NOT EXISTS agent_messages (
    id SERIAL PRIMARY KEY,
    agent VARCHAR(20) NOT NULL,
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_agent ON agent_messages(agent, created_at);

CREATE TABLE IF NOT EXISTS agent_memories (
    id SERIAL PRIMARY KEY,
    agent VARCHAR(50) NOT NULL,
    memory TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (agent, memory)
);

CREATE INDEX IF NOT EXISTS idx_agent_memories_agent ON agent_memories(agent, updated_at DESC);
