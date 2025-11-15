import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { v4 as uuid } from 'uuid';
import { CommandRequestPayload, CommandRecord } from '../types/command';
import { config } from '../config';

export interface CommandServiceOptions {
  allowedCommands?: string[];
  defaultTimeoutMs?: number;
  maxOutputLength?: number;
}

const isWindows = process.platform === 'win32';

export class CommandService {
  private readonly commands = new Map<string, CommandRecord>();
  private readonly processes = new Map<string, ChildProcess>();
  private readonly allowedCommands?: string[];
  private readonly defaultTimeoutMs?: number;
  private readonly maxOutputLength: number;

  constructor(options?: CommandServiceOptions) {
    this.allowedCommands = options?.allowedCommands;
    this.defaultTimeoutMs = options?.defaultTimeoutMs;
    this.maxOutputLength = options?.maxOutputLength ?? 200_000;
  }

  public listCommands(): CommandRecord[] {
    return Array.from(this.commands.values());
  }

  public getCommand(id: string): CommandRecord | undefined {
    return this.commands.get(id);
  }

  public async killCommand(id: string): Promise<CommandRecord | undefined> {
    const child = this.processes.get(id);
    const record = this.commands.get(id);
    if (!child || !record) {
      return undefined;
    }

    child.kill('SIGTERM');
    record.status = 'terminated';
    record.finishedAt = new Date().toISOString();
    record.errorMessage = 'Process terminated by user';
    this.processes.delete(id);
    return record;
  }

  public execute(payload: CommandRequestPayload): {
    record: CommandRecord;
    completion: Promise<CommandRecord>;
  } {
    this.guardCommand(payload.command);

    const id = uuid();
    const args = payload.args ?? [];
    const requestedAt = new Date().toISOString();
    const record: CommandRecord = {
      id,
      command: payload.command,
      args,
      cwd: payload.cwd,
      requestedAt,
      status: 'queued',
      stdout: '',
      stderr: '',
    };

    this.commands.set(id, record);

    const { bin, binArgs, spawnOptions } = this.buildSpawnConfig(payload);

    const child = spawn(bin, binArgs, spawnOptions);
    record.status = 'running';
    record.startedAt = new Date().toISOString();
    record.pid = child.pid ?? undefined;
    this.processes.set(id, child);

    const completion = new Promise<CommandRecord>((resolve) => {
      const timeoutMs = payload.timeoutMs ?? this.defaultTimeoutMs;
      let timeoutHandle: NodeJS.Timeout | undefined;

      if (timeoutMs && timeoutMs > 0) {
        timeoutHandle = setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGTERM');
            record.status = 'failed';
            record.errorMessage = `Process timed out after ${timeoutMs}ms`;
            record.finishedAt = new Date().toISOString();
            this.processes.delete(id);
            resolve(record);
          }
        }, timeoutMs);
      }

      child.stdout?.on('data', (data: Buffer) => {
        record.stdout = this.appendWithLimit(record.stdout, data.toString());
      });

      child.stderr?.on('data', (data: Buffer) => {
        record.stderr = this.appendWithLimit(record.stderr, data.toString());
      });

      child.on('error', (error) => {
        record.status = 'failed';
        record.errorMessage = error.message;
      });

      child.on('close', (code) => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
        record.exitCode = code;
        if (record.status !== 'failed' && record.status !== 'terminated') {
          record.status = code === 0 ? 'succeeded' : 'failed';
        }
        record.finishedAt = new Date().toISOString();
        this.processes.delete(id);
        resolve(record);
      });
    });

    return { record, completion };
  }

  private buildSpawnConfig(payload: CommandRequestPayload): {
    bin: string;
    binArgs: string[];
    spawnOptions: SpawnOptions;
  } {
    const env = { ...process.env, ...payload.env };
    const baseOptions: SpawnOptions = {
      cwd: payload.cwd,
      env,
      shell: payload.shell ?? false,
      detached: payload.startDetached ?? false,
    };

    if (payload.startDetached && isWindows) {
      return {
        bin: 'cmd.exe',
        binArgs: ['/c', 'start', '""', payload.command, ...(payload.args ?? [])],
        spawnOptions: { ...baseOptions, windowsHide: false },
      };
    }

    if (isWindows) {
      return {
        bin: 'cmd.exe',
        binArgs: ['/c', payload.command, ...(payload.args ?? [])],
        spawnOptions: { ...baseOptions, windowsHide: false },
      };
    }

    return {
      bin: payload.command,
      binArgs: payload.args ?? [],
      spawnOptions: baseOptions,
    };
  }

  private appendWithLimit(current: string, incoming: string): string {
    const next = `${current}${incoming}`;
    if (next.length <= this.maxOutputLength) {
      return next;
    }
    const overflow = next.length - this.maxOutputLength;
    return next.substring(overflow);
  }

  private guardCommand(command: string) {
    if (!command) {
      throw new Error('command is required');
    }

    if (this.allowedCommands && this.allowedCommands.length > 0) {
      const isAllowed = this.allowedCommands.some(
        (allowed) => allowed === command.toLowerCase()
      );
      if (!isAllowed) {
        throw new Error('Command is not allowed by server policy');
      }
    }
  }
}

export const commandService = new CommandService({
  allowedCommands: config.allowedCommands,
  defaultTimeoutMs: config.defaultTimeoutMs,
  maxOutputLength: config.maxOutputLength,
});
