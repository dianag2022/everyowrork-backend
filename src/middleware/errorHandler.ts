// your error handler code here (example, may be empty)
export function createError(message: string, status: number) {
    const error: any = new Error(message);
    error.status = status;
    return error;
}

export function errorHandler(
    err: any,
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction
) {
    const status = err.status || 500;
    res.status(status).json({
        error: {
            message: err.message || 'Internal Server Error',
            status,
        },
    });
}

export function notFoundHandler(
    req: import('express').Request,
    res: import('express').Response,
    next: import('express').NextFunction
) {
    next(createError('Not Found', 404));
}