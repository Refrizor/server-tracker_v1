import { Response } from 'express';
import {ResponseType} from "./response-type";

/**
 * The shape of the standardized response object.
 */
interface StandardResponse<T = unknown> {
    success: boolean;
    result_type: ResponseType;
    message: string;
    target?: string;
}

/**
 * Utility to send a standardized response from an Express.js controllers.
 *
 * @param res - Express.js response object
 * @param statusCode - HTTP status code
 * @param success - Whether the operation was successful
 * @param resultType - The operation result type (e.g., SUCCESS, NOT_FOUND, etc.)
 * @param message - A human-readable message
 * @param target
 */
export function sendResponse<T>(
    res: Response,
    statusCode: number,
    success: boolean,
    resultType: ResponseType,
    message: string,
    target?: string | null,
): void {
    const response: StandardResponse<T> = {
        success,
        result_type: resultType,
        message,
        target: target ?? undefined
    };
    res.status(statusCode).json(response);
}