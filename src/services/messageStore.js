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

module.exports = {
  saveMessage,
  listMessages
};
