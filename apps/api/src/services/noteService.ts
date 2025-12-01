// import { db } from '../db';
// import { notes, revisions, jobs, caches } from '../db/schema';
// import { eq } from 'drizzle-orm';
// import { v4 as uuidv4 } from 'uuid';
// import { NoteOptions, NoteResult } from '../types/note';
// import { generateCacheKey } from '../utils/hash';
// import { createAIProvider } from './aiProvider';
// import { addJob } from '../queue/queueManager';
// import { logger } from '../utils/logger';

// const aiProvider = createAIProvider();

// export async function createNote(
//   userId: string,
//   rawText: string,
//   options: NoteOptions
// ): Promise<{ jobId: string; revisionId: string; cached: boolean }> {
//   console.log('\n=== [SERVICE] createNote START ===');
//   console.log('[SERVICE] User ID:', userId);
//   console.log('[SERVICE] Raw text length:', rawText.length);
//   console.log('[SERVICE] Options:', JSON.stringify(options));

//   // Check cache if enabled
//   if (options.useCached !== false) {
//     console.log('[SERVICE] Checking cache...');
//     const cacheKey = generateCacheKey(userId, rawText, options);
//     const cached = await db.query.caches.findFirst({
//       where: eq(caches.keyHash, cacheKey),
//     });

//     if (cached) {
//       console.log('[SERVICE] Cache entry found, checking revision...');
//       const cachedRevision = await db.query.revisions.findFirst({
//         where: eq(revisions.revisionId, cached.revisionId),
//       });

//       if (cachedRevision && cachedRevision.status === 'done') {
//         console.log('[SERVICE] Cache HIT! Returning cached result');
//         logger.info('Returning cached result', { revisionId: cached.revisionId });
//         return {
//           jobId: `cached-${cached.revisionId}`,
//           revisionId: cached.revisionId,
//           cached: true,
//         };
//       }
//     }
//     console.log('[SERVICE] Cache MISS');
//   }

//   // Create new note
//   console.log('[SERVICE] Creating note in database...');
//   const [note] = await db
//     .insert(notes)
//     .values({
//       userId,
//       rawText,
//       options: options as any,
//     })
//     .returning();
//   console.log('[SERVICE] Note created with ID:', note.id);

//   const revisionId = uuidv4();
//   console.log('[SERVICE] Generated revision ID:', revisionId);

//   // Create revision
//   console.log('[SERVICE] Creating revision...');
//   await db.insert(revisions).values({
//     noteId: note.id,
//     revisionId,
//     status: 'queued',
//     cached: false,
//   });
//   console.log('[SERVICE] Revision created');

//   const jobId = `job-${uuidv4()}`;
//   console.log('[SERVICE] Generated job ID:', jobId);

//   // Create job
//   console.log('[SERVICE] Creating job in database...');
//   await db.insert(jobs).values({
//     jobId,
//     revisionId,
//     status: 'queued',
//     queuePayload: { revisionId, noteId: note.id, rawText, options, userId } as any,
//   });
//   console.log('[SERVICE] Job created in database');

//   // Add to queue
//   console.log('[SERVICE] Adding job to queue...');
//   await addJob(jobId, {
//     revisionId,
//     noteId: note.id,
//     rawText,
//     options,
//     userId,
//   });
//   console.log('[SERVICE] Job added to queue');

//   logger.info('Note created and queued', { noteId: note.id, revisionId, jobId });
//   console.log('=== [SERVICE] createNote END ===\n');

//   return { jobId, revisionId, cached: false };
// }

// export async function processNoteJob(data: {
//   revisionId: string;
//   noteId: string;
//   rawText: string;
//   options: NoteOptions;
//   userId: string;
// }): Promise<void> {
//   const { revisionId, rawText, options, userId } = data;

//   console.log('\n=== [WORKER] processNoteJob START ===');
//   console.log('[WORKER] Revision ID:', revisionId);
//   console.log('[WORKER] Note ID:', data.noteId);
//   console.log('[WORKER] Raw text length:', rawText.length);
//   console.log('[WORKER] Options:', JSON.stringify(options));

//   try {
//     logger.info('Starting note processing', { revisionId });

//     // Update status to processing
//     console.log('[WORKER] Updating revision status to processing...');
//     await db
//       .update(revisions)
//       .set({ status: 'processing' })
//       .where(eq(revisions.revisionId, revisionId));
//     console.log('[WORKER] Revision status updated to processing');

//     // Call AI provider
//     console.log('[WORKER] Calling AI provider (Gemini)...');
//     console.log('[WORKER] Text preview:', rawText.substring(0, 100) + '...');
//     const result = await aiProvider.generateNoteStructure(rawText, options);
//     console.log('[WORKER] AI response received!');
//     console.log('[WORKER] Result preview:', JSON.stringify(result).substring(0, 200) + '...');

//     // Update result with revisionId
//     result.meta.revisionId = revisionId;

//     // Update revision with result
//     console.log('[WORKER] Saving result to database...');
//     await db
//       .update(revisions)
//       .set({
//         status: 'done',
//         result: result as any,
//         exportMarkdown: result.exports.markdown,
//         exportHtml: result.exports.html,
//         exportText: result.exports.plainText,
//         modelUsed: process.env.MODEL_NAME || 'gemini-1.5-pro',
//         processedAt: new Date(),
//       })
//       .where(eq(revisions.revisionId, revisionId));
//     console.log('[WORKER] Revision updated with result, status set to done');

//     // Update job status
//     console.log('[WORKER] Updating job status to done...');
//     await db
//       .update(jobs)
//       .set({ status: 'done', updatedAt: new Date() })
//       .where(eq(jobs.revisionId, revisionId));
//     console.log('[WORKER] Job status updated to done');

//     // Cache result
//     console.log('[WORKER] Caching result...');
//     const cacheKey = generateCacheKey(userId, rawText, options);
//     await db
//       .insert(caches)
//       .values({
//         keyHash: cacheKey,
//         revisionId,
//         ttl: parseInt(process.env.CACHE_TTL_HOURS || '24'),
//       })
//       .onConflictDoNothing();
//     console.log('[WORKER] Result cached');

//     logger.info('Note processing completed', { revisionId });
//     console.log('=== [WORKER] processNoteJob END (SUCCESS) ===\n');
//   } catch (error) {
//     console.error('[WORKER] ERROR processing note:', error);
//     logger.error('Note processing failed', { revisionId, error });

//     console.log('[WORKER] Updating revision status to failed...');
//     await db
//       .update(revisions)
//       .set({ status: 'failed' })
//       .where(eq(revisions.revisionId, revisionId));

//     await db
//       .update(jobs)
//       .set({ status: 'failed', updatedAt: new Date() })
//       .where(eq(jobs.revisionId, revisionId));
//     console.log('[WORKER] Status updated to failed');
//     console.log('=== [WORKER] processNoteJob END (FAILED) ===\n');

//     throw error;
//   }
// }

// export async function getRevisionStatus(revisionId: string): Promise<{
//   status: string;
//   progress?: number;
//   cached?: boolean;
//   error?: string;
// }> {
//   const revision = await db.query.revisions.findFirst({
//     where: eq(revisions.revisionId, revisionId),
//   });

//   if (!revision) {
//     throw new Error('Revision not found');
//   }

//   return {
//     status: revision.status,
//     cached: revision.cached,
//   };
// }

// export async function getRevisionResult(revisionId: string): Promise<
//   NoteResult & {
//     modelUsed?: string;
//     cached?: boolean;
//     createdAt: string;
//     processedAt?: string;
//   }
// > {
//   const revision = await db.query.revisions.findFirst({
//     where: eq(revisions.revisionId, revisionId),
//   });

//   if (!revision) {
//     throw new Error('Revision not found');
//   }

//   if (revision.status !== 'done') {
//     throw new Error('Revision not ready');
//   }

//   return {
//     ...(revision.result as NoteResult),
//     modelUsed: revision.modelUsed || undefined,
//     cached: revision.cached,
//     createdAt: revision.createdAt.toISOString(),
//     processedAt: revision.processedAt?.toISOString(),
//   };
// }

// export async function getRevisionExport(
//   revisionId: string,
//   format: 'markdown' | 'html' | 'text'
// ): Promise<string> {
//   const revision = await db.query.revisions.findFirst({
//     where: eq(revisions.revisionId, revisionId),
//   });

//   if (!revision) {
//     throw new Error('Revision not found');
//   }

//   if (revision.status !== 'done') {
//     throw new Error('Revision not ready');
//   }

//   switch (format) {
//     case 'markdown':
//       return revision.exportMarkdown || '';
//     case 'html':
//       return revision.exportHtml || '';
//     case 'text':
//       return revision.exportText || '';
//     default:
//       throw new Error('Invalid format');
//   }
// }

// export async function listUserNotes(userId: string): Promise<
//   Array<{
//     revisionId: string;
//     title?: string;
//     createdAt: string;
//     status: string;
//     cached: boolean;
//   }>
// > {
//   const userNotes = await db.query.notes.findMany({
//     where: eq(notes.userId, userId),
//     with: {
//       // This would need proper relations setup in schema
//     },
//   });

//   const noteIds = userNotes.map((n) => n.id);

//   const allRevisions = await db.select().from(revisions).where(eq(revisions.noteId, noteIds[0])); // Simplified for POC

//   return allRevisions.map((rev) => ({
//     revisionId: rev.revisionId,
//     title: (rev.result as any)?.meta?.userProvidedTitle,
//     createdAt: rev.createdAt.toISOString(),
//     status: rev.status,
//     cached: rev.cached,
//   }));
// }

// export async function invalidateCache(): Promise<void> {
//   await db.delete(caches);
//   logger.info('Cache invalidated');
// }

import { v4 as uuidv4 } from 'uuid';
import { NoteOptions, NoteResult } from '../types/note';
import { generateCacheKey } from '../utils/hash';
import { createAIProvider } from './aiProvider';
import { logger } from '../utils/logger';

const aiProvider = createAIProvider();

// In-memory storage (temporary, no PostgreSQL)
const inMemoryRevisions = new Map<string, NoteResult>();
const inMemoryCache = new Map<string, string>();

export async function createNote(
  userId: string,
  rawText: string,
  options: NoteOptions
): Promise<{ jobId: string; revisionId: string; cached: boolean }> {
  console.log('\n=== [SERVICE] createNote START (IN-MEMORY MODE) ===');
  console.log('[SERVICE] User ID:', userId);
  console.log('[SERVICE] Raw text length:', rawText.length);
  console.log('[SERVICE] Options:', JSON.stringify(options));

  // Check cache if enabled
  if (options.useCached !== false) {
    console.log('[SERVICE] Checking in-memory cache...');
    const cacheKey = generateCacheKey(userId, rawText, options);
    const cachedRevisionId = inMemoryCache.get(cacheKey);

    if (cachedRevisionId) {
      const cachedRevision = inMemoryRevisions.get(cachedRevisionId);
      if (cachedRevision && cachedRevision.status === 'done') {
        console.log('[SERVICE] Cache HIT! Returning cached result');
        logger.info('Returning cached result', { revisionId: cachedRevisionId });
        return {
          jobId: `cached-${cachedRevisionId}`,
          revisionId: cachedRevisionId,
          cached: true,
        };
      }
    }
    console.log('[SERVICE] Cache MISS');
  }

  const revisionId = uuidv4();
  const jobId = `job-${uuidv4()}`;

  console.log('[SERVICE] Generated revision ID:', revisionId);
  console.log('[SERVICE] Generated job ID:', jobId);

  // Store in memory
  inMemoryRevisions.set(revisionId, {
    status: 'queued',
    cached: false,
    createdAt: new Date(),
  });

  // Process immediately (no queue needed for POC)
  console.log('[SERVICE] Processing note directly (no queue)...');
  processNoteJob({ revisionId, noteId: revisionId, rawText, options, userId }).catch((err) => {
    console.error('[SERVICE] Processing failed:', err);
  });

  console.log('=== [SERVICE] createNote END ===\n');

  return { jobId, revisionId, cached: false };
}

export async function processNoteJob(data: {
  revisionId: string;
  noteId: string;
  rawText: string;
  options: NoteOptions;
  userId: string;
}): Promise<void> {
  const { revisionId, rawText, options, userId } = data;

  console.log('\n=== [WORKER] processNoteJob START (IN-MEMORY) ===');
  console.log('[WORKER] Revision ID:', revisionId);

  try {
    // Update status to processing
    const revision = inMemoryRevisions.get(revisionId);
    if (revision) {
      revision.status = 'processing';
    }

    // Call AI provider
    console.log('[WORKER] Calling AI provider (Gemini)...');
    const result = await aiProvider.generateNoteStructure(rawText, options);
    console.log('[WORKER] AI response received!');

    result.meta.revisionId = revisionId;

    // Store result in memory
    inMemoryRevisions.set(revisionId, {
      status: 'done',
      result,
      cached: false,
      createdAt: revision?.createdAt || new Date(),
      processedAt: new Date(),
      exportMarkdown: result.exports.markdown,
      exportHtml: result.exports.html,
      exportText: result.exports.plainText,
      modelUsed: process.env.MODEL_NAME || 'gemini-2.5-flash',
    });

    // Cache result
    const cacheKey = generateCacheKey(userId, rawText, options);
    inMemoryCache.set(cacheKey, revisionId);

    logger.info('Note processing completed (in-memory)', { revisionId });
    console.log('=== [WORKER] processNoteJob END (SUCCESS) ===\n');
  } catch (error) {
    console.error('[WORKER] ERROR processing note:', error);
    const revision = inMemoryRevisions.get(revisionId);
    if (revision) {
      revision.status = 'failed';
      revision.error = error;
    }
    throw error;
  }
}

export async function getRevisionStatus(revisionId: string): Promise<{
  status: string;
  progress?: number;
  cached?: boolean;
  error?: string;
}> {
  console.log('\n=== [SERVICE] getRevisionStatus START ===');
  console.log('[SERVICE] Requested revisionId:', revisionId);

  const revision = inMemoryRevisions.get(revisionId);

  if (!revision) {
    console.log('[SERVICE] ERROR: Revision not found');
    throw new Error('Revision not found');
  }

  console.log('[SERVICE] Revision status:', revision.status);
  console.log('[SERVICE] Revision cached:', revision.cached);
  console.log('=== [SERVICE] getRevisionStatus END ===\n');

  return {
    status: revision.status,
    cached: revision.cached,
  };
}

export async function getRevisionResult(revisionId: string): Promise<
  NoteResult & {
    modelUsed?: string;
    cached?: boolean;
    createdAt: string;
    processedAt?: string;
  }
> {
  console.log('\n=== [SERVICE] getRevisionResult START ===');
  console.log('[SERVICE] Requested revisionId:', revisionId);

  const revision = inMemoryRevisions.get(revisionId);

  if (!revision) {
    console.log('[SERVICE] ERROR: Revision not found in memory');
    console.log('[SERVICE] Available revisions:', Array.from(inMemoryRevisions.keys()));
    throw new Error('Revision not found');
  }

  console.log('[SERVICE] Revision found in memory');
  console.log('[SERVICE] Revision status:', revision.status);

  if (revision.status !== 'done') {
    console.log('[SERVICE] ERROR: Revision not ready (status is not "done")');
    throw new Error('Revision not ready');
  }

  console.log('[SERVICE] Revision result exists:', !!revision.result);
  console.log(
    '[SERVICE] Result structure:',
    revision.result
      ? {
          hasMeta: !!revision.result.meta,
          hasExports: !!revision.result.exports,
          hasStructure: !!revision.result.structure,
          structureCount: revision.result.structure?.length || 0,
        }
      : null
  );

  const returnValue = {
    ...revision.result,
    modelUsed: revision.modelUsed,
    cached: revision.cached,
    createdAt: revision.createdAt.toISOString(),
    processedAt: revision.processedAt?.toISOString(),
  };

  console.log('[SERVICE] Return value structure:', {
    hasMeta: !!returnValue.meta,
    hasExports: !!returnValue.exports,
    hasStructure: !!returnValue.structure,
    structureCount: returnValue.structure?.length || 0,
    modelUsed: returnValue.modelUsed,
    cached: returnValue.cached,
  });
  console.log(
    '[SERVICE] Full return value preview:',
    JSON.stringify(returnValue).substring(0, 500)
  );
  console.log('=== [SERVICE] getRevisionResult END ===\n');

  return returnValue;
}

export async function getRevisionExport(
  revisionId: string,
  format: 'markdown' | 'html' | 'text'
): Promise<string> {
  const revision = inMemoryRevisions.get(revisionId);

  if (!revision) {
    throw new Error('Revision not found');
  }

  if (revision.status !== 'done') {
    throw new Error('Revision not ready');
  }

  switch (format) {
    case 'markdown':
      return revision.exportMarkdown || '';
    case 'html':
      return revision.exportHtml || '';
    case 'text':
      return revision.exportText || '';
    default:
      throw new Error('Invalid format');
  }
}

export async function listUserNotes(_userId: string): Promise<
  Array<{
    revisionId: string;
    title?: string;
    createdAt: string;
    status: string;
    cached: boolean;
  }>
> {
  // Return all in-memory revisions
  return Array.from(inMemoryRevisions.entries()).map(([revisionId, rev]) => ({
    revisionId,
    title: rev.result?.meta?.userProvidedTitle,
    createdAt: rev.createdAt.toISOString(),
    status: rev.status,
    cached: rev.cached,
  }));
}

export async function invalidateCache(): Promise<void> {
  inMemoryCache.clear();
  logger.info('In-memory cache invalidated');
}
