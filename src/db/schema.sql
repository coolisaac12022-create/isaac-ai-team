CREATE TABLE IF NOT EXISTS agent_messages (
    id SERIAL PRIMARY KEY,
    agent VARCHAR(20) NOT NULL,
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_messages_agent ON agent_messages(agent, created_at);
