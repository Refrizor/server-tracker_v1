import cron from 'node-cron';
import { logger } from '../utils/logger';
import { checkForDownedServers, updateGlobalPlayerCounts } from '../services/server-service';

export function startSchedulers() {
    startServerStatusChecker();
    startPlayerCountChecker();
}

function startServerStatusChecker() {
    cron.schedule('*/5 * * * * *', async () => {
        try {
            logger.info('Running server status check...');
            await checkForDownedServers();
        } catch (error) {
            logger.error('Error in server status checker:', error);
        }
    });
}

function startPlayerCountChecker() {
    setInterval(async () => {
        try {
            logger.info('Running player count update...');
            await updateGlobalPlayerCounts();
        } catch (error) {
            logger.error('Error in player count checker:', error);
        }
    }, 5000);
}
