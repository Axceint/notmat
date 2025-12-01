import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { logger } from '../utils/logger';
import { processNoteJob } from '../services/noteService';

interface NoteJobData {
  revisionId: string;
  noteId: string;
  rawText: string;
  options: Record<string, unknown>;
  userId: string;
}

let queue: Queue<NoteJobData> | null = null;
let worker: Worker<NoteJobData> | null = null;
let inMemoryQueue: InMemoryQueue | null = null;

const USE_REDIS = process.env.USE_REDIS_QUEUE === 'true' && process.env.REDIS_URL;

// In-memory queue fallback
class InMemoryQueue {
  private jobs: Map<string, { data: NoteJobData; status: string }> = new Map();
  private processing = false;
  private concurrency: number;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  async add(jobId: string, data: NoteJobData): Promise<void> {
    console.log('\n=== [QUEUE] add() START ===');
    console.log('[QUEUE] Adding job:', jobId);
    console.log(
      '[QUEUE] Job data:',
      JSON.stringify({ revisionId: data.revisionId, textLength: data.rawText.length }, null, 2)
    );

    this.jobs.set(jobId, { data, status: 'queued' });
    console.log('[QUEUE] Job stored in Map');
    console.log('[QUEUE] Current queue size:', this.jobs.size);

    logger.info(`Job added to in-memory queue: ${jobId}`);

    console.log('[QUEUE] Calling processNext()...');
    this.processNext();
    console.log('=== [QUEUE] add() END ===\n');
  }

  async getStatus(jobId: string): Promise<string | null> {
    return this.jobs.get(jobId)?.status || null;
  }

  private async processNext(): Promise<void> {
    console.log('\n=== [QUEUE] processNext() START ===');
    console.log('[QUEUE] Processing flag:', this.processing);
    console.log('[QUEUE] Total jobs in queue:', this.jobs.size);

    if (this.processing) {
      console.log('[QUEUE] Already processing, returning early');
      console.log('=== [QUEUE] processNext() END (early return) ===\n');
      return;
    }

    this.processing = true;
    console.log('[QUEUE] Set processing = true');

    const queuedJobs = Array.from(this.jobs.entries())
      .filter(([_jobId, job]) => job.status === 'queued')
      .slice(0, this.concurrency);

    console.log('[QUEUE] Queued jobs found:', queuedJobs.length);
    console.log('[QUEUE] Concurrency limit:', this.concurrency);
    console.log(
      '[QUEUE] Job IDs to process:',
      queuedJobs.map(([id]) => id)
    );

    if (queuedJobs.length === 0) {
      console.log('[QUEUE] No queued jobs to process');
      this.processing = false;
      console.log('=== [QUEUE] processNext() END (no jobs) ===\n');
      return;
    }

    for (const [jobId, job] of queuedJobs) {
      console.log(`[QUEUE] Processing job ${jobId}...`);
      this.jobs.set(jobId, { ...job, status: 'processing' });
      console.log(`[QUEUE] Job ${jobId} status set to 'processing'`);

      try {
        console.log(`[QUEUE] Calling processNoteJob for ${jobId}...`);
        await processNoteJob(job.data);
        console.log(`[QUEUE] processNoteJob completed successfully for ${jobId}`);
        this.jobs.set(jobId, { ...job, status: 'done' });
        console.log(`[QUEUE] Job ${jobId} status set to 'done'`);
        logger.info(`Job completed: ${jobId}`);
      } catch (error: unknown) {
        console.error(`[QUEUE] Job ${jobId} FAILED:`, error);
        this.jobs.set(jobId, { ...job, status: 'failed' });
        logger.error(`Job failed: ${jobId}`, { error });
      }
    }

    this.processing = false;
    console.log('[QUEUE] Set processing = false');

    // Check if more jobs need processing
    const hasMoreQueued = Array.from(this.jobs.values()).some((j) => j.status === 'queued');
    console.log('[QUEUE] More queued jobs?', hasMoreQueued);

    if (hasMoreQueued) {
      console.log('[QUEUE] Scheduling next batch in 100ms');
      setTimeout(() => this.processNext(), 100);
    }

    console.log('=== [QUEUE] processNext() END ===\n');
  }
}

export async function initializeQueue(): Promise<void> {
  const concurrency = parseInt(process.env.QUEUE_CONCURRENCY || '2');

  if (USE_REDIS) {
    try {
      const connection = new IORedis(process.env.REDIS_URL!, {
        maxRetriesPerRequest: null,
      });

      queue = new Queue<NoteJobData>('notes-processing', { connection });

      worker = new Worker<NoteJobData>(
        'notes-processing',
        async (job: Job<NoteJobData>) => {
          logger.info(`Processing job: ${job.id}`, { data: job.data });
          await processNoteJob(job.data);
        },
        { connection, concurrency }
      );

      worker.on('completed', (job) => {
        logger.info(`Job completed: ${job.id}`);
      });

      worker.on('failed', (job, _err) => {
        logger.error(`Job failed: ${job?.id}`, { error: _err });
      });

      logger.info('BullMQ queue initialized with Redis');
    } catch (error: unknown) {
      logger.warn('Failed to initialize Redis queue, falling back to in-memory', { error });
      inMemoryQueue = new InMemoryQueue(concurrency);
    }
  } else {
    inMemoryQueue = new InMemoryQueue(concurrency);
    logger.info('Using in-memory queue (Redis not configured)');
  }
}

export async function addJob(jobId: string, data: NoteJobData): Promise<void> {
  if (queue) {
    await queue.add(jobId, data, { jobId });
  } else if (inMemoryQueue) {
    await inMemoryQueue.add(jobId, data);
  } else {
    throw new Error('Queue not initialized');
  }
}

export async function getJobStatus(jobId: string): Promise<string | null> {
  if (queue) {
    const job = await queue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    return state;
  } else if (inMemoryQueue) {
    return inMemoryQueue.getStatus(jobId);
  }
  return null;
}
