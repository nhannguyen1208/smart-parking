import type { Response } from "express";

export function sendData<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ data });
}

export function sendError(
  res: Response,
  error: string,
  message: string,
  status: number,
) {
  return res.status(status).json({ error, message });
}
