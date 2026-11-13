// Stops leftover dev servers still holding the API / Vite ports.
// Runs automatically before `npm run dev`, and on its own with `npm run stop`.
// Only Node processes are killed, anything else on the port is reported and left alone.
import { execSync } from 'node:child_process';

try {
  process.loadEnvFile();
} catch {
  // No .env, use the default port
}

const PORTS = [Number(process.env.PORT ?? 3001), 5173];
const isWindows = process.platform === 'win32';

type ProcessInfo = { pid: number; parentPid: number; name: string; commandLine: string };

function run(command: string): string {
  try {
    return execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return ''; // e.g. lsof exits with 1 when nothing matches
  }
}

// PIDs of processes listening on a port
function pidsOnPort(port: number): number[] {
  const pids = new Set<number>();
  if (isWindows) {
    for (const line of run('netstat -ano').split('\n')) {
      // Proto  Local Address  Foreign Address  State  PID
      const [proto, local, , state, pid] = line.trim().split(/\s+/);
      if (proto === 'TCP' && state === 'LISTENING' && local?.endsWith(':' + port)) {
        pids.add(Number(pid));
      }
    }
  } else {
    for (const pid of run('lsof -ti tcp:' + port + ' -sTCP:LISTEN').split('\n')) {
      if (pid.trim() !== '') {
        pids.add(Number(pid));
      }
    }
  }
  pids.delete(0);
  return [...pids];
}

function processInfo(pid: number): ProcessInfo | null {
  if (isWindows) {
    const json = run(
      'powershell -NoProfile -Command "Get-CimInstance Win32_Process -Filter \'ProcessId=' + pid +
        '\' | Select-Object ParentProcessId,Name,CommandLine | ConvertTo-Json"',
    );
    if (json.trim() === '') {
      return null;
    }
    const data = JSON.parse(json) as { ParentProcessId: number; Name: string; CommandLine: string | null };
    return { pid, parentPid: data.ParentProcessId, name: data.Name, commandLine: data.CommandLine ?? '' };
  }
  const line = run('ps -o ppid=,comm=,args= -p ' + pid).trim();
  const match = /^(\d+)\s+(\S+)\s+(.*)$/.exec(line);
  if (match == null) {
    return null;
  }
  return { pid, parentPid: Number(match[1]), name: match[2], commandLine: match[3] };
}

const isNode = (info: ProcessInfo) => /(^|[\\/])node(\.exe)?$/i.test(info.name);

// `node --watch` keeps a parent process alive that would restart the server on the next file save,
// so kill that parent too
function topNodeProcess(info: ProcessInfo): ProcessInfo {
  const parent = processInfo(info.parentPid);
  if (parent != null && isNode(parent) && parent.commandLine.includes('--watch')) {
    return parent;
  }
  return info;
}

function kill(pid: number) {
  if (isWindows) {
    run('taskkill /PID ' + pid + ' /T /F'); // /T takes the whole process tree
  } else {
    try {
      process.kill(pid, 'SIGKILL');
    } catch {
      // Already gone
    }
  }
}

let stopped = 0;
for (const port of PORTS) {
  for (const pid of pidsOnPort(port)) {
    const info = processInfo(pid);
    if (info == null) {
      continue;
    }
    if (!isNode(info)) {
      console.warn('Port ' + port + ' is used by ' + info.name + ' (PID ' + pid + '), not a dev server, so it was left running.');
      continue;
    }
    const target = topNodeProcess(info);
    kill(target.pid);
    if (target.pid !== pid) {
      kill(pid);
    }
    console.log('Stopped leftover server on port ' + port + ' (PID ' + target.pid + ')');
    stopped++;
  }
}

if (stopped === 0) {
  console.log('Ports ' + PORTS.join(' and ') + ' are free');
}
