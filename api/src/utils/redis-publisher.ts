import redisClient from '../config/redis';
import { randomUUID } from "crypto";

class RedisPublisher {
    async publish(channel: string, senderId: string, data: any) {
        if (!channel || !senderId || !data) {
            throw new Error("Missing required parameters for publish()");
        }

        // Construct a proper event payload
        const eventPayload = {
            senderId: String(senderId),  // Ensure senderId is always a string
            eventId: randomUUID(),       // Generate a unique event ID
            ...data                      // Spread additional fields directly into the payload
        };

        // Serialize to JSON before publishing
        const serializedPayload = JSON.stringify(eventPayload);

        console.log(`[DEBUG] Publishing to ${channel}: ${serializedPayload}`);

        try {
            await redisClient.publish(channel, serializedPayload);
        } catch (error) {
            console.error(`[ERROR] Failed to publish to ${channel}:`, error);
        }
    }
}

export default new RedisPublisher();