import {Request, Response} from 'express';
import serverService from '../services/server-service';
import {successResponse, errorResponse} from '../utils/response-handler';

class ServerController {
    async registerServer(req: Request, res: Response): Promise<void> {
        try {
            const server = req.body;
            console.log('Received server data:', JSON.stringify(server, null, 2));

            // Call the service to update server state
            await serverService.registerServer(server);
            successResponse(res, 'Environment data updated successfully');
        } catch (err: any) {
            errorResponse(res, err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    }

    async updateServer(req: Request, res: Response): Promise<void> {
        try {
            const serverId = req.params.uuid as string;
            const serverUpdate = req.body; // Expecting ServerUpdateRequest

            if (!serverId) {
                errorResponse(res, 'Missing server ID');
                return;
            }

            await serverService.updateServer(serverId, serverUpdate);
            successResponse(res, `Heartbeat received from ${serverId}`);
        } catch (err: any) {
            errorResponse(res, err instanceof Error ? err.message : 'Unexpected error');
        }
    }

    async getServer(req: Request, res: Response): Promise<void> {
        try {
            const {uuid} = req.params;

            const server = await serverService.getServer(uuid);
            if (!server) {
                res.status(404).json({success: false, message: 'Server not found'});
                return;
            }

            successResponse(res, {server});
        } catch (err: any) {
            errorResponse(res, err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    }

    async getAllServers(req: Request, res: Response): Promise<void> {
        try {
            const server = await serverService.getAllServers();
            if (!server) {
                res.status(404).json({success: false, message: 'Server not found'});
                return;
            }

            successResponse(res, {server});
        } catch (err: any) {
            errorResponse(res, err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    }
}

export default new ServerController();
