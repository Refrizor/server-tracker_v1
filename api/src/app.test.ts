import request from 'supertest';
import { createServer } from './server';

describe('server', () => {
    it('GET /health -> 200 { ok: true }', async () => {
        const app = createServer();
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body).toEqual({ ok: true });
    });
});
