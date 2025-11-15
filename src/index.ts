import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import commandRoutes from './routes/commandRoutes';
import { swaggerSpec } from './swagger';
import { config } from './config';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/commands', commandRoutes);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  const message = error.message || 'Unknown error';
  return res.status(400).json({ message });
});

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on port ${config.port}`);
});
