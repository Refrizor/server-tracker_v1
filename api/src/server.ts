import express from 'express';
import serverRoutes from './routes/server-routes';

export function createServer() {
    const app = express();

    // Middleware
    app.use(express.json());

    // Routes
    app.use('/', serverRoutes);

    app.get('/health', (_req, res) => {
        res.json({ ok: true});
    })

    return app;
}