const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false }
    })
  : null;

async function saveMessage(agent, role, content) {
  if (!pool || !agent || !role || !content) {
    return null;
  }

  const query = `
    INSERT INTO agent_messages (agent, role, content, created_at)
    VALUES ($1, $2, $3, NOW())
    RETURNING *
  `;

  const result = await pool.query(query, [agent, role, content]);
  return result.rows[0];
}

async function listMessages(agent) {
  if (!pool) {
    return [];
  }

  const query = `
    SELECT id, agent, role, content, created_at
    FROM agent_messages
    WHERE agent = $1
    ORDER BY created_at ASC
    LIMIT 30
  `;

  const result = await pool.query(query, [agent]);
  return result.rows;
}

async function listMemories(agent) {
  if (!pool || !agent) {
    return [];
  }

  const result = await pool.query(`
    SELECT id, agent, memory, created_at, updated_at
    FROM agent_memories
    WHERE agent = $1
    ORDER BY updated_at DESC
    LIMIT 30
  `, [agent]);

  return result.rows;
}

async function saveMemory(agent, memory) {
  if (!pool || !agent || !memory) {
    return null;
  }

  const result = await pool.query(`
    INSERT INTO agent_memories (agent, memory)
    VALUES ($1, $2)
    ON CONFLICT (agent, memory) DO UPDATE SET updated_at = NOW()
    RETURNING *
  `, [agent, memory]);

  return result.rows[0];
}

module.exports = {
  saveMessage,
  listMessages,
  listMemories,
  saveMemory
};
