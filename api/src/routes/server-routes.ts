import { Router } from 'express';
import serverController from '../controllers/server-controller';

const router = Router();

router.get('/servers/:uuid', serverController.getServer);
router.get('/servers', serverController.getAllServers);

router.post('/servers', serverController.registerServer);
router.patch('/servers/:uuid', serverController.updateServer);

export default router;
