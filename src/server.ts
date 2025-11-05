import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import apiRouter from './routes/api';
import { logger } from './logger';
import { errorHandler } from './middleware/errorHandler';
import { config } from './config';

const app = express();

app.use(cors());
app.use(express.json());
app.use((req, _res, next) => {
  // lightweight structured log
  // avoid heavy body logging to keep console clean
  const { method, url } = req;
  const start = Date.now();
  _res.on('finish', () => {
    const duration = Date.now() - start;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (logger as any).info(`${method} ${url} -> ${_res.statusCode} ${duration}ms`);
  });
  next();
});

// Health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Docs
// eslint-disable-next-line @typescript-eslint/no-var-requires
const swaggerDoc = require('./swagger.json');
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));

// API
app.use('/api', apiRouter);

// Error handler
app.use(errorHandler);

export function createApp() { return app; }

export function startServer() {
  const port = config.port;
  app.listen(port, () => logger.info(`Server listening on :${port}`));
}
