import { Response } from 'express';
import { sendResponse } from './response-utils';
import { ResponseType } from './response-type';

export function successResponse(res: Response, data: any, statusCode = 200, meta = {}) {
    if (Object.keys(meta).length === 0) {
        // If no metadata, wrap data in an object with a success flag
        return res.status(statusCode).json({ success: true, ...data });
    } else {
        // Include metadata and wrap data in the response
        return res.status(statusCode).json({
            success: true,
            ...meta,
            data  // wrap the data in a data field to avoid key collisions
        });
    }
}


export function errorResponse(res: Response, error: any, statusCode = 500) {
    return res.status(statusCode).json({ success: false, error });
}

/**
 * Maps service return values to HTTP responses.
 */
export function handleServiceResponse(
    res: Response,
    result: ResponseType,
    customMessages: Partial<Record<ResponseType, string>> = {},
    target?: string
): void {
    const statusMap: Record<ResponseType, number> = {
        [ResponseType.SUCCESS]: 201,
        [ResponseType.NOT_FOUND]: 404,
        [ResponseType.ALREADY_EXISTS]: 409,
        [ResponseType.ERROR]: 500,
        [ResponseType.INVALID_INPUT]: 400,
    };

    // These are fallback messages, in case you don't provide one in `customMessages`.
    const defaultMessages: Record<ResponseType, string> = {
        [ResponseType.SUCCESS]: "Success",
        [ResponseType.NOT_FOUND]: "The requested resource was not found.",
        [ResponseType.ALREADY_EXISTS]: "The resource already exists.",
        [ResponseType.ERROR]: "An unexpected error occurred.",
        [ResponseType.INVALID_INPUT]: "Invalid input parameters.",
    };

    // Use the custom message if provided, otherwise fall back
    const finalMessage = customMessages[result] ?? defaultMessages[result];

    sendResponse(
        res,
        statusMap[result],
        result === ResponseType.SUCCESS,
        result,
        finalMessage,
        target ?? undefined
    );
}