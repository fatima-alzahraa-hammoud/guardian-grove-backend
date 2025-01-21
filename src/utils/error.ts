import { Response } from 'express';

interface ErrorProps {
  message: string;
  res: Response;
  status?: number;
}

export const throwError = ({ message = "Internal Server Error", res, status = 500 }: ErrorProps): void => {
  res.status(status).json({ error: message });
};
