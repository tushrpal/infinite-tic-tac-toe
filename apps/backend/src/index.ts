import { createServer } from './server';
import { createServer as createHttpServer } from 'http';
import { wsManager } from './websocket';

const PORT = process.env.PORT || 3000;

const app = createServer();

// Create HTTP server and attach WebSocket server
const httpServer = createHttpServer(app);
wsManager.initialize(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket server ready for real-time PvP`);
});
