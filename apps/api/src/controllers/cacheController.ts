import { Request, Response, NextFunction } from 'express';
import * as noteService from '../services/noteService';

export async function invalidateCache(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    await noteService.invalidateCache();
    res.json({ message: 'Cache invalidated successfully' });
  } catch (error) {
    next(error);
  }
}
