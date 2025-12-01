import { apiClient } from '@/lib/api-client';
import {
  CreateNoteRequest,
  CreateNoteResponse,
  JobStatus,
  NoteResult,
  NoteListItem,
} from '@/types/note';

export const noteService = {
  async createNote(request: CreateNoteRequest): Promise<CreateNoteResponse> {
    console.log('[Frontend noteService] Creating note...');
    const result = await apiClient.post<CreateNoteResponse>('/api/v1/notes', request);
    console.log('[Frontend noteService] Create note response:', result);
    return result;
  },

  async getJobStatus(revisionId: string): Promise<JobStatus> {
    console.log('[Frontend noteService] Getting job status for:', revisionId);
    const result = await apiClient.get<JobStatus>(`/api/v1/notes/${revisionId}/status`);
    console.log('[Frontend noteService] Job status:', result);
    return result;
  },

  async getNoteResult(revisionId: string): Promise<NoteResult> {
    console.log('[Frontend noteService] Getting note result for:', revisionId);
    const result = await apiClient.get<NoteResult>(`/api/v1/notes/${revisionId}/result`);
    console.log('[Frontend noteService] Note result received:', {
      hasMeta: !!result.meta,
      hasExports: !!result.exports,
      hasStructure: !!result.structure,
      structureCount: result.structure?.length || 0,
    });
    console.log(
      '[Frontend noteService] Full result preview:',
      JSON.stringify(result).substring(0, 500)
    );
    return result;
  },

  async exportNote(revisionId: string, format: 'markdown' | 'html' | 'text'): Promise<string> {
    return apiClient.get<string>(`/api/v1/notes/${revisionId}/export?format=${format}`);
  },

  async listNotes(userId?: string): Promise<NoteListItem[]> {
    const params = userId ? `?userId=${userId}` : '';
    return apiClient.get<NoteListItem[]>(`/api/v1/notes${params}`);
  },

  async invalidateCache(): Promise<void> {
    return apiClient.post<void>('/api/v1/cache/invalidate');
  },
};
