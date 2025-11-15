"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandService = exports.CommandService = void 0;
const child_process_1 = require("child_process");
const uuid_1 = require("uuid");
const config_1 = require("../config");
const isWindows = process.platform === 'win32';
class CommandService {
    constructor(options) {
        this.commands = new Map();
        this.processes = new Map();
        this.allowedCommands = options?.allowedCommands;
        this.defaultTimeoutMs = options?.defaultTimeoutMs;
        this.maxOutputLength = options?.maxOutputLength ?? 200000;
    }
    listCommands() {
        return Array.from(this.commands.values());
    }
    getCommand(id) {
        return this.commands.get(id);
    }
    async killCommand(id) {
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
    execute(payload) {
        this.guardCommand(payload.command);
        const id = (0, uuid_1.v4)();
        const args = payload.args ?? [];
        const requestedAt = new Date().toISOString();
        const record = {
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
        const child = (0, child_process_1.spawn)(bin, binArgs, spawnOptions);
        record.status = 'running';
        record.startedAt = new Date().toISOString();
        record.pid = child.pid ?? undefined;
        this.processes.set(id, child);
        const completion = new Promise((resolve) => {
            const timeoutMs = payload.timeoutMs ?? this.defaultTimeoutMs;
            let timeoutHandle;
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
            child.stdout?.on('data', (data) => {
                record.stdout = this.appendWithLimit(record.stdout, data.toString());
            });
            child.stderr?.on('data', (data) => {
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
    buildSpawnConfig(payload) {
        const env = { ...process.env, ...payload.env };
        const baseOptions = {
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
    appendWithLimit(current, incoming) {
        const next = `${current}${incoming}`;
        if (next.length <= this.maxOutputLength) {
            return next;
        }
        const overflow = next.length - this.maxOutputLength;
        return next.substring(overflow);
    }
    guardCommand(command) {
        if (!command) {
            throw new Error('command is required');
        }
        if (this.allowedCommands && this.allowedCommands.length > 0) {
            const isAllowed = this.allowedCommands.some((allowed) => allowed === command.toLowerCase());
            if (!isAllowed) {
                throw new Error('Command is not allowed by server policy');
            }
        }
    }
}
exports.CommandService = CommandService;
exports.commandService = new CommandService({
    allowedCommands: config_1.config.allowedCommands,
    defaultTimeoutMs: config_1.config.defaultTimeoutMs,
    maxOutputLength: config_1.config.maxOutputLength,
});
//# sourceMappingURL=commandService.js.map