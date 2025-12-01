'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { noteService } from '@/services/noteService';
import { NoteOptions } from '@/types/note';
import { useSettingsStore } from '@/store/settingsStore';
import { useRevisionHistoryStore } from '@/store/revisionHistoryStore';
import { ArrowLeft, Send, Loader2 } from 'lucide-react';

export default function NewNotePage() {
  const router = useRouter();
  const { defaultOptions } = useSettingsStore();
  const { addRevision } = useRevisionHistoryStore();
  const [rawText, setRawText] = useState('');
  const [options, setOptions] = useState<NoteOptions>(defaultOptions);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const wordCount = rawText.trim().split(/\s+/).filter(Boolean).length;
  const isValid = wordCount > 0 && wordCount <= 2000;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setSubmitting(true);
    setError('');

    try {
      const response = await noteService.createNote({ rawText, options });
      const title = rawText.split('\n')[0].substring(0, 50) || 'Untitled Note';

      // Add to revision history
      addRevision({
        revisionId: response.revisionId,
        title,
        createdAt: new Date().toISOString(),
      });

      router.push(`/note/${response.revisionId}`);
    } catch (err: unknown) {
      const error = err as { message?: string; response?: { data?: { message?: string } } };
      setError(error.message || error.response?.data?.message || 'Failed to create note');
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Create New Note</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <label
              htmlFor="rawText"
              className="block text-sm font-medium mb-2 text-gray-900 dark:text-white"
            >
              Your Note
            </label>
            <textarea
              id="rawText"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={15}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter your notes here... (up to 2000 words)"
            />
            <div className="mt-2 flex justify-between items-center">
              <span
                className={`text-sm ${wordCount > 2000 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {wordCount} / 2000 words
              </span>
              {wordCount > 2000 && (
                <span className="text-sm text-red-600 dark:text-red-400">
                  Exceeds maximum word count
                </span>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
            <h2 className="font-semibold mb-4 text-gray-900 dark:text-white">Options</h2>

            <div>
              <label
                htmlFor="tone"
                className="block text-sm font-medium mb-2 text-gray-900 dark:text-white"
              >
                Tone
              </label>
              <select
                id="tone"
                value={options.tone}
                onChange={(e) =>
                  setOptions({ ...options, tone: e.target.value as NoteOptions['tone'] })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="original">Original</option>
                <option value="formal">Formal</option>
                <option value="casual">Casual</option>
                <option value="professional">Professional</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="formatting"
                className="block text-sm font-medium mb-2 text-gray-900 dark:text-white"
              >
                Formatting Strictness
              </label>
              <select
                id="formatting"
                value={options.formattingStrictness}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    formattingStrictness: e.target.value as NoteOptions['formattingStrictness'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="loose">Loose</option>
                <option value="moderate">Moderate</option>
                <option value="strict">Strict</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="exportMode"
                className="block text-sm font-medium mb-2 text-gray-900 dark:text-white"
              >
                Export Mode
              </label>
              <select
                id="exportMode"
                value={options.exportMode}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    exportMode: e.target.value as NoteOptions['exportMode'],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Formats</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
                <option value="text">Plain Text</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                id="useCached"
                type="checkbox"
                checked={options.useCached}
                onChange={(e) => setOptions({ ...options, useCached: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor="useCached"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Use cached results if available
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!isValid || submitting}
            className="flex items-center justify-center space-x-2 w-full bg-primary-600 dark:bg-primary-500 text-white py-3 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Submit Note</span>
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
}
