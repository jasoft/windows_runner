import { CommandRequestPayload, CommandRecord } from '../types/command';
export interface CommandServiceOptions {
    allowedCommands?: string[];
    defaultTimeoutMs?: number;
    maxOutputLength?: number;
}
export declare class CommandService {
    private readonly commands;
    private readonly processes;
    private readonly allowedCommands?;
    private readonly defaultTimeoutMs?;
    private readonly maxOutputLength;
    constructor(options?: CommandServiceOptions);
    listCommands(): CommandRecord[];
    getCommand(id: string): CommandRecord | undefined;
    killCommand(id: string): Promise<CommandRecord | undefined>;
    execute(payload: CommandRequestPayload): {
        record: CommandRecord;
        completion: Promise<CommandRecord>;
    };
    private buildSpawnConfig;
    private appendWithLimit;
    private guardCommand;
}
export declare const commandService: CommandService;
//# sourceMappingURL=commandService.d.ts.map