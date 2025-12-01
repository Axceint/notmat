import { Router } from 'express';
import * as notesController from '../controllers/notesController';

export const notesRouter = Router();

// Test endpoint (no auth required) - should be first
notesRouter.get('/test-ai', notesController.testAI);

// Create note
notesRouter.post('/', notesController.createNote);

// Get revision status
notesRouter.get('/:revisionId/status', notesController.getRevisionStatus);

// Get revision result
notesRouter.get('/:revisionId/result', notesController.getRevisionResult);

// Export revision
notesRouter.get('/:revisionId/export', notesController.exportRevision);

// List user notes
notesRouter.get('/', notesController.listNotes);
