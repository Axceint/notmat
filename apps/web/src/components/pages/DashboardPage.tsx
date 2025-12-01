'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { noteService } from '@/services/noteService';
import { NoteListItem } from '@/types/note';
import { useRevisionHistoryStore } from '@/store/revisionHistoryStore';
import { FileText, Plus } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardPage() {
  const router = useRouter();
  const { revisions, validateRevisions } = useRevisionHistoryStore();
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<NoteListItem[]>([]);

  useEffect(() => {
    // Clean up stale revisions on mount
    validateRevisions().catch(console.error);
  }, []);

  useEffect(() => {
    loadNotes();
  }, [revisions]);

  const loadNotes = async () => {
    try {
      setLoading(true);

      // Load note details from revision history
      const notePromises = revisions.map(async (rev) => {
        try {
          const result = await noteService.getNoteResult(rev.revisionId);
          return {
            revisionId: rev.revisionId,
            title: result.meta.userProvidedTitle || rev.title || 'Untitled Note',
            createdAt: result.createdAt,
            cached: result.cached ?? false,
            status: 'done' as const,
          };
        } catch (err) {
          // If note can't be loaded, return the basic info from history
          return {
            revisionId: rev.revisionId,
            title: rev.title || 'Untitled Note',
            createdAt: rev.createdAt,
            cached: false,
            status: 'failed' as const,
          };
        }
      });

      const loadedNotes = await Promise.all(notePromises);
      setNotes(loadedNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100';
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100';
      case 'queued':
        return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => router.push('/note/new')}
            className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create New Note</span>
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Your Notes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Notes are stored in your browser's local storage
            </p>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                Loading notes...
              </div>
            ) : notes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg font-medium mb-2">No notes yet</p>
                <p className="text-sm">Create your first note to get started!</p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.revisionId}
                  onClick={() => router.push(`/note/${note.revisionId}`)}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <FileText className="w-5 h-5 text-gray-400 dark:text-gray-500 mt-1" />
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {note.title || 'Untitled Note'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Created {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {note.cached && (
                        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 px-2 py-1 rounded">
                          Cached
                        </span>
                      )}
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(note.status)}`}>
                        {note.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
