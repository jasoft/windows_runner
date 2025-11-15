"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swaggerSpec = void 0;
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const options = {
    definition: {
        openapi: '3.0.1',
        info: {
            title: 'Windows Command Runner API',
            version: '1.0.0',
            description: 'REST API 用于在托管它的 Windows 主机上执行命令（包括 GUI 程序）。' +
                ' 提供同步/异步执行、进程状态查询和终止功能。',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: '本地开发环境',
            },
        ],
        components: {
            schemas: {
                CommandRequest: {
                    type: 'object',
                    required: ['command'],
                    properties: {
                        command: { type: 'string', description: '要执行的命令或可执行文件' },
                        args: {
                            type: 'array',
                            description: '命令参数列表',
                            items: { type: 'string' },
                        },
                        cwd: { type: 'string', description: '命令执行目录' },
                        env: {
                            type: 'object',
                            additionalProperties: { type: 'string' },
                            description: '要覆盖/附加的环境变量',
                        },
                        waitForExit: {
                            type: 'boolean',
                            description: '是否等待命令完成后返回结果',
                            default: true,
                        },
                        startDetached: {
                            type: 'boolean',
                            description: '在 Windows 上通过 start 以 GUI/独立窗口方式启动',
                            default: false,
                        },
                        shell: {
                            type: 'boolean',
                            description: '是否通过 Shell 执行命令',
                        },
                        timeoutMs: {
                            type: 'integer',
                            description: '超时时间（毫秒），超时会终止进程',
                        },
                    },
                },
                CommandRecord: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        command: { type: 'string' },
                        args: {
                            type: 'array',
                            items: { type: 'string' },
                        },
                        cwd: { type: 'string', nullable: true },
                        requestedAt: { type: 'string', format: 'date-time' },
                        startedAt: { type: 'string', format: 'date-time', nullable: true },
                        finishedAt: { type: 'string', format: 'date-time', nullable: true },
                        status: {
                            type: 'string',
                            enum: ['queued', 'running', 'succeeded', 'failed', 'terminated'],
                        },
                        stdout: { type: 'string' },
                        stderr: { type: 'string' },
                        exitCode: { type: 'integer', nullable: true },
                        errorMessage: { type: 'string', nullable: true },
                        pid: { type: 'integer', nullable: true },
                        durationMs: { type: 'integer', nullable: true },
                    },
                },
            },
        },
        paths: {
            '/api/commands': {
                post: {
                    summary: '执行命令',
                    description: '创建一次命令执行任务，可选择同步等待或异步获取结果。',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/CommandRequest' },
                            },
                        },
                    },
                    responses: {
                        200: {
                            description: '命令执行完毕',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/CommandRecord' },
                                },
                            },
                        },
                        202: {
                            description: '命令已接受（异步）',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            id: { type: 'string' },
                                            status: { type: 'string' },
                                        },
                                    },
                                },
                            },
                        },
                        400: { description: '请求参数错误' },
                    },
                },
                get: {
                    summary: '列出命令任务',
                    responses: {
                        200: {
                            description: '命令记录列表',
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/CommandRecord' },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            '/api/commands/{id}': {
                get: {
                    summary: '查询指定命令任务',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: '命令详情',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/CommandRecord' },
                                },
                            },
                        },
                        404: { description: '未找到命令' },
                    },
                },
            },
            '/api/commands/{id}/kill': {
                post: {
                    summary: '终止正在运行的命令',
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            required: true,
                            schema: { type: 'string' },
                        },
                    ],
                    responses: {
                        200: {
                            description: '终止成功或进程已结束',
                            content: {
                                'application/json': {
                                    schema: { $ref: '#/components/schemas/CommandRecord' },
                                },
                            },
                        },
                        404: { description: '未找到可终止的命令' },
                    },
                },
            },
        },
    },
    apis: [],
};
exports.swaggerSpec = (0, swagger_jsdoc_1.default)(options);
//# sourceMappingURL=swagger.js.map