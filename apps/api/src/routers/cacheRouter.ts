import { Router } from 'express';
import * as cacheController from '../controllers/cacheController';

export const cacheRouter = Router();

// Cache invalidation route
cacheRouter.post('/invalidate', cacheController.invalidateCache);
