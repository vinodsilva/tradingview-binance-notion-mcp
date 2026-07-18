import { readdirSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = join(__dirname, '../../agents');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return {};
  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const sep = line.indexOf(':');
    if (sep > 0) {
      const key = line.slice(0, sep).trim();
      const val = line.slice(sep + 1).trim().replace(/^"(.*)"$/, '$1');
      frontmatter[key] = val;
    }
  }
  return frontmatter;
}

function listAgents() {
  let files;
  try {
    files = readdirSync(AGENTS_DIR);
  } catch {
    return [];
  }
  return files
    .filter(f => f.endsWith('.md'))
    .map(f => {
      const content = readFileSync(join(AGENTS_DIR, f), 'utf-8');
      const meta = parseFrontmatter(content);
      return {
        name: meta.name || f.replace('.md', ''),
        description: meta.description || '',
        trigger: `Act as **${meta.name || f.replace('.md', '')}**`,
        file: f,
      };
    });
}

export function registerAgentPrompts(server) {
  server.prompt(
    'list_agents',
    'List all available agent roles with descriptions',
    {},
    async () => {
      const agents = listAgents();
      const rows = agents.map(a =>
        `| \`${a.trigger}\` | ${a.description} |`
      ).join('\n');
      const table = `| Trigger | Description |\n|---------|-------------|\n${rows}`;
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `## Available Agents\n\n${table}\n\nChoose an agent by typing its trigger phrase.`,
            },
          },
        ],
      };
    }
  );
}
