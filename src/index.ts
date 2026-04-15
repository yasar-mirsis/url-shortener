import express, { Application, Server } from 'express';
import { registerRoutes } from './routes';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register routes
registerRoutes(app);

// Start server
export const start = async (port: number = PORT): Promise<Server> => {
  const server: Server = app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
  return server;
};

// Only start if this is the main module
if (require.main === module) {
  start()
    .then(() => {
      console.log(`URL Shortener API started on port ${PORT}`);
    })
    .catch((error: Error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });
}

export default app;
