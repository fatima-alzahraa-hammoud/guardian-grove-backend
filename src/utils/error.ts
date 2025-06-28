import { Response } from 'express';

interface ErrorProps {
  message: string;
  res: Response;
  status?: number;
}

export const throwError = ({ message, res, status = 500 }: ErrorProps): void => {
  // Handle falsy messages more robustly
  const errorMessage = (message && typeof message === 'string' && message.trim()) 
    ? message 
    : "Internal Server Error";

  // Ensure status is a valid number
  const statusCode = (typeof status === 'number' && !isNaN(status)) ? status : 500;

  res.status(statusCode).json({ error: errorMessage });
};