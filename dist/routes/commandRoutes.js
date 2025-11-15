"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const commandService_1 = require("../services/commandService");
const router = (0, express_1.Router)();
const toBoolean = (value, defaultValue) => {
    if (typeof value === 'boolean') {
        return value;
    }
    return defaultValue;
};
const normalizePayload = (body) => {
    if (!body || typeof body !== 'object') {
        throw new Error('Invalid request body');
    }
    if (typeof body.command !== 'string' || body.command.trim().length === 0) {
        throw new Error('command is required');
    }
    if (body.args &&
        (!Array.isArray(body.args) || !body.args.every((item) => typeof item === 'string'))) {
        throw new Error('args must be a string array');
    }
    if (body.env && typeof body.env !== 'object') {
        throw new Error('env must be an object');
    }
    const payload = {
        command: body.command.trim(),
        args: body.args ?? undefined,
        cwd: typeof body.cwd === 'string' ? body.cwd : undefined,
        env: body.env ?? undefined,
        waitForExit: toBoolean(body.waitForExit, true),
        startDetached: toBoolean(body.startDetached, false),
        shell: typeof body.shell === 'boolean' ? body.shell : undefined,
    };
    if (body.timeoutMs !== undefined) {
        const parsedTimeout = Number(body.timeoutMs);
        if (!Number.isFinite(parsedTimeout) || parsedTimeout < 0) {
            throw new Error('timeoutMs must be a positive number');
        }
        payload.timeoutMs = parsedTimeout;
    }
    return payload;
};
const serializeRecord = (record) => {
    const durationMs = record.startedAt && record.finishedAt
        ? new Date(record.finishedAt).getTime() - new Date(record.startedAt).getTime()
        : undefined;
    return { ...record, durationMs };
};
router.post('/', async (req, res, next) => {
    try {
        const payload = normalizePayload(req.body);
        const waitForExit = payload.waitForExit !== false;
        const { record, completion } = commandService_1.commandService.execute(payload);
        if (!waitForExit) {
            return res.status(202).json({ id: record.id, status: record.status });
        }
        const finalRecord = await completion;
        return res.json(serializeRecord(finalRecord));
    }
    catch (error) {
        return next(error);
    }
});
router.get('/', (_req, res) => {
    const items = commandService_1.commandService.listCommands().map(serializeRecord);
    return res.json(items);
});
router.get('/:id', (req, res) => {
    const record = commandService_1.commandService.getCommand(req.params.id);
    if (!record) {
        return res.status(404).json({ message: 'Command not found' });
    }
    return res.json(serializeRecord(record));
});
router.post('/:id/kill', async (req, res) => {
    const record = await commandService_1.commandService.killCommand(req.params.id);
    if (!record) {
        return res.status(404).json({ message: 'Command not found or already finished' });
    }
    return res.json(serializeRecord(record));
});
exports.default = router;
//# sourceMappingURL=commandRoutes.js.map