import { spawn } from 'child_process';

function run(cmd: string, args: string[]) {
  return new Promise<void>((resolve) => {
    const p = spawn(cmd, args, { stdio: 'inherit', shell: true });
    p.on('close', () => resolve());
  });
}

async function loop() {
  while (true) {
    try {
      await run('npx', ['tsx', 'سحب بيانات المستشفيات/enrich-hospitals-lite.ts']);
      await run('npx', ['tsx', 'سحب بيانات المستشفيات/sync-working-hours.ts']);
    } catch {}
    await new Promise((r) => setTimeout(r, 10 * 60 * 1000));
  }
}

loop();
