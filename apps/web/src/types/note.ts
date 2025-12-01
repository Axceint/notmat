export interface NoteOptions {
  tone?: 'formal' | 'casual' | 'professional' | 'original';
  formattingStrictness?: 'strict' | 'moderate' | 'loose';
  exportMode?: 'markdown' | 'html' | 'text' | 'all';
  useCached?: boolean;
}

export interface CreateNoteRequest {
  rawText: string;
  options: NoteOptions;
}

export interface CreateNoteResponse {
  jobId: string;
  revisionId: string;
  cached: boolean;
}

export interface JobStatus {
  status: 'queued' | 'processing' | 'done' | 'failed';
  progress?: number;
  cached?: boolean;
  error?: string;
}

export interface Task {
  id: string;
  text: string;
  granularity: 'broad' | 'fine';
  steps?: string[];
  priority?: string | null;
  dependencies: string[];
}

export interface StructureNode {
  id: string;
  title: string;
  content: string;
  tasks: Task[];
  children: StructureNode[];
}

export interface AmbiguousSegment {
  text: string;
  locationHint: string;
}

export interface Contradiction {
  segments: string[];
  note: string;
}

export interface NoteMeta {
  revisionId: string;
  userProvidedTitle?: string;
  detectedLanguage: string;
  topTags: string[];
  dates: string[];
  priorities: string[];
}

export interface NoteExports {
  markdown: string;
  html: string;
  plainText: string;
}

export interface NoteResult {
  meta: NoteMeta;
  structure: StructureNode[];
  ambiguousSegments: AmbiguousSegment[];
  contradictions: Contradiction[];
  exports: NoteExports;
  modelUsed?: string;
  cached?: boolean;
  createdAt: string;
  processedAt?: string;
}

export interface NoteListItem {
  revisionId: string;
  title?: string;
  createdAt: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  cached: boolean;
}
