import { Router } from 'express';
import { commandService } from '../services/commandService';
import { CommandRecord, CommandRequestPayload } from '../types/command';

const router = Router();

const toBoolean = (value: unknown, defaultValue: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  return defaultValue;
};

const normalizePayload = (body: any): CommandRequestPayload => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }
  if (typeof body.command !== 'string' || body.command.trim().length === 0) {
    throw new Error('command is required');
  }

  if (
    body.args &&
    (!Array.isArray(body.args) || !body.args.every((item: unknown) => typeof item === 'string'))
  ) {
    throw new Error('args must be a string array');
  }

  if (body.env && typeof body.env !== 'object') {
    throw new Error('env must be an object');
  }

  const payload: CommandRequestPayload = {
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

const serializeRecord = (record: CommandRecord) => {
  const durationMs = record.startedAt && record.finishedAt
    ? new Date(record.finishedAt).getTime() - new Date(record.startedAt).getTime()
    : undefined;
  return { ...record, durationMs };
};

router.post('/', async (req, res, next) => {
  try {
    const payload = normalizePayload(req.body);
    const waitForExit = payload.waitForExit !== false;
    const { record, completion } = commandService.execute(payload);

    if (!waitForExit) {
      return res.status(202).json({ id: record.id, status: record.status });
    }

    const finalRecord = await completion;
    return res.json(serializeRecord(finalRecord));
  } catch (error) {
    return next(error);
  }
});

router.get('/', (_req, res) => {
  const items = commandService.listCommands().map(serializeRecord);
  return res.json(items);
});

router.get('/:id', (req, res) => {
  const record = commandService.getCommand(req.params.id);
  if (!record) {
    return res.status(404).json({ message: 'Command not found' });
  }
  return res.json(serializeRecord(record));
});

router.post('/:id/kill', async (req, res) => {
  const record = await commandService.killCommand(req.params.id);
  if (!record) {
    return res.status(404).json({ message: 'Command not found or already finished' });
  }
  return res.json(serializeRecord(record));
});

export default router;
