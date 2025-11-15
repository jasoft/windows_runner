export type CommandStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'terminated';
export interface CommandRequestPayload {
    command: string;
    args?: string[];
    cwd?: string;
    env?: Record<string, string>;
    waitForExit?: boolean;
    startDetached?: boolean;
    shell?: boolean;
    timeoutMs?: number;
}
export interface CommandRecord {
    id: string;
    command: string;
    args: string[];
    cwd?: string;
    requestedAt: string;
    startedAt?: string;
    finishedAt?: string;
    status: CommandStatus;
    stdout: string;
    stderr: string;
    exitCode?: number | null;
    errorMessage?: string;
    pid?: number;
}
export interface CommandExecutionResult extends CommandRecord {
    durationMs?: number;
}
//# sourceMappingURL=command.d.ts.map