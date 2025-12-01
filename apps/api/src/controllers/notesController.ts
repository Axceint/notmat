import { Request, Response, NextFunction } from 'express';
import * as noteService from '../services/noteService';
import { NoteOptions } from '../types/note';
import { ValidationError, NotFoundError } from '../middleware/errorHandler';
import { z } from 'zod';
import { createAIProvider } from '../services/aiProvider';

const CreateNoteSchema = z.object({
  rawText: z.string().min(1).max(50000),
  options: z.object({
    tone: z.enum(['formal', 'casual', 'professional', 'original']).optional(),
    formattingStrictness: z.enum(['strict', 'moderate', 'loose']).optional(),
    exportMode: z.enum(['markdown', 'html', 'text', 'all']).optional(),
    useCached: z.boolean().optional(),
  }),
});

// Test endpoint to verify Gemini API works (bypasses queue)
export async function testAI(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('\n=== [TEST] testAI START ===');
    console.log('[TEST] Testing direct Gemini API call...');

    const aiProvider = createAIProvider();
    const testText = 'Buy milk\\nCall John at 3pm\\nFinish project report';
    const testOptions: NoteOptions = {
      tone: 'original',
      formattingStrictness: 'moderate',
      exportMode: 'markdown',
    };

    console.log('[TEST] Calling AI provider with test text...');
    const result = await aiProvider.generateNoteStructure(testText, testOptions);
    console.log('[TEST] AI call successful!');
    console.log('[TEST] Result preview:', JSON.stringify(result).substring(0, 200));
    console.log('=== [TEST] testAI END ===\n');

    res.json({
      success: true,
      message: 'Gemini API is working correctly',
      result,
    });
  } catch (error) {
    console.error('[TEST] AI call FAILED:', error);
    next(error);
  }
}

export async function createNote(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    console.log('\n=== [CONTROLLER] createNote START ===');
    console.log('[CONTROLLER] Request body keys:', Object.keys(req.body));

    const validation = CreateNoteSchema.safeParse(req.body);

    if (!validation.success) {
      console.log('[CONTROLLER] Validation FAILED:', validation.error.errors);
      throw new ValidationError('Invalid request body', validation.error.errors);
    }

    console.log('[CONTROLLER] Validation PASSED');
    const { rawText, options } = validation.data;

    // Generate a simple user ID for tracking (no auth required)
    const userId = `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    console.log('[CONTROLLER] User ID:', userId);
    console.log('[CONTROLLER] Raw text length:', rawText.length);
    console.log('[CONTROLLER] Options:', JSON.stringify(options));

    console.log('[CONTROLLER] Calling noteService.createNote...');
    const result = await noteService.createNote(userId, rawText, options as NoteOptions);
    console.log('[CONTROLLER] Service returned:', JSON.stringify(result));
    console.log('=== [CONTROLLER] createNote END ===\n');

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function getRevisionStatus(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { revisionId } = req.params;

    const status = await noteService.getRevisionStatus(revisionId);

    res.json(status);
  } catch (error) {
    next(error);
  }
}

export async function getRevisionResult(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { revisionId } = req.params;

    console.log('\n=== [CONTROLLER] getRevisionResult START ===');
    console.log('[CONTROLLER] Request params:', req.params);
    console.log('[CONTROLLER] Fetching result for revisionId:', revisionId);

    const result = await noteService.getRevisionResult(revisionId);

    console.log('[CONTROLLER] Result received from service');
    console.log('[CONTROLLER] Result structure:', {
      hasMeta: !!result.meta,
      hasExports: !!result.exports,
      hasStructure: !!result.structure,
      structureCount: result.structure?.length || 0,
    });
    console.log('[CONTROLLER] Sending JSON response to client');
    console.log('=== [CONTROLLER] getRevisionResult END ===\n');

    res.json(result);
  } catch (error) {
    console.log(
      '[CONTROLLER] ERROR in getRevisionResult:',
      error instanceof Error ? error.message : error
    );
    if (error instanceof Error && error.message === 'Revision not found') {
      next(new NotFoundError('Revision not found'));
    } else {
      next(error);
    }
  }
}

export async function exportRevision(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { revisionId } = req.params;
    const format = req.query.format as 'markdown' | 'html' | 'text';

    if (!['markdown', 'html', 'text'].includes(format)) {
      throw new ValidationError('Invalid format. Must be markdown, html, or text');
    }

    const content = await noteService.getRevisionExport(revisionId, format);

    res.setHeader('Content-Type', 'text/plain');
    res.send(content);
  } catch (error) {
    next(error);
  }
}

export async function listNotes(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Generate a simple user ID for tracking (no auth required)
    const userId =
      (req.query.userId as string) ||
      `user-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    const notes = await noteService.listUserNotes(userId);

    res.json(notes);
  } catch (error) {
    next(error);
  }
}
