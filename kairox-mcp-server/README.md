# KAIROX Engine MCP Server

A powerful Model Context Protocol (MCP) server that exposes KAIROX, AIOX, Hivemind, and HYDRA capabilities to any MCP-compatible IDE like TRAE, Claude Desktop, Cursor, etc.

## 🚀 Features

- **AIOX Tools**: List squads, agents, skills, and get full agent definitions
- **KAIROX Tools**: System health check, read/write SELF_CONTEXT/STATUS, log artifacts, manage SKYROS isolation mode, run morning triage
- **Hivemind Tools**: Read/write decisions, manage agent states, handoffs between agents, task assignment
- **HYDRA Tools**: Spawn sub-agents, queue tasks for Night Shift, monitor execution

## 📦 Installation

### Prerequisites

- Node.js 20+
- npm or pnpm

### Setup

1. Navigate to the project root
2. Install dependencies:
   ```bash
   npm install
   ```

3. (Optional) Configure Supabase for HYDRA Night Shift:
   Copy `.env.example` to `.env` and fill in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`
   - Optional: `KAIROS_ROOT` to explicitly set the KAIROS workspace path

## 📖 Usage

### Build the Server

```bash
npm run build
```

### Run the Server

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Setup for TRAE IDE

We include a helper script to configure TRAE!

```bash
npm run setup
```

Then, follow the instructions in `.trae/README.md` to add KAIROX to your TRAE MCP configuration.

## 🧪 Testing

```bash
npm test
```

## 📚 MCP Configuration

### TRAE IDE Configuration

Add to your TRAE configuration:

```json
{
  "mcpServers": {
    "kairox": {
      "command": "node",
      "args": ["<path-to-kairox-mcp-server>/dist/mcp-server.js"],
      "env": {
        "KAIROS_ROOT": "<path-to-kairos-workspace>",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kairox": {
      "command": "node",
      "args": ["<path-to-kairox-mcp-server>/dist/mcp-server.js"]
    }
  }
}
```

## 🛠️ Available Tools

| Tool Name | Description |
|-----------|-------------|
| aiox_list_squads | List available AIOX squads |
| aiox_list_agents | List available agents (optionally filter by squad) |
| aiox_get_agent | Get an agent's full definition |
| aiox_list_skills | List available integrations (skills) |
| aiox_read_skill | Read a skill's documentation (SKILL.md) |
| kairos_health | Full KAIROX system health check |
| kairos_read_context | Read SELF_CONTEXT.md, STATUS.md, or both |
| kairos_write_context | Write or update SELF_CONTEXT/STATUS (with backups and patches) |
| kairos_explore_arsenal | List scripts in the KAIROS arsenal/ directory |
| kairos_read_script | Read a script from the arsenal/ directory |
| kairos_log_artifact | Log an artifact to hivemind/artifacts.json |
| kairos_list_artifacts | List artifacts with optional filters |
| skyros_isolation | Enable/disable/check SKYROS Deep Work isolation mode |
| skyros_triage | Execute the morning triage briefing |
| hivemind_read_decisions | Read recent decisions from Hivemind |
| hivemind_log_decision | Log a decision to Hivemind |
| hivemind_assign_task | Assign a task to another agent |
| hivemind_read_states | Read all current agent states |
| hivemind_update_state | Update an agent's state |
| hivemind_list_handoffs | List pending and consumed handoffs |
| hivemind_create_handoff | Create a new handoff between agents |
| hivemind_read_handoff | Read a handoff file |
| hivemind_mark_handoff_consumed | Mark a handoff as consumed |
| hydra_spawn_agent | Spawn a sub-agent (requires openclaude.bat) |
| hydra_queue_task | Queue a task for Night Shift (requires Supabase) |
| hydra_list_tasks | List Night Shift tasks |
| hydra_agent_status | Get HYDRA agent status |

## 📝 Version History

- **v3.1.0**: Renamed to KAIROX MCP Server, added proper env support, TRAE setup script, and more robustness
- **v2.0.0**: Previous version (kairos-mcp-server)
- **v1.0.0**: Initial release

## 📄 License

MIT
