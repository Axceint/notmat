'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { noteService } from '@/services/noteService';
import { NoteResult, JobStatus } from '@/types/note';
import { useRevisionHistoryStore } from '@/store/revisionHistoryStore';
import { ArrowLeft, Download, Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

interface NoteViewPageProps {
  params: { revisionId: string };
}

export default function NoteViewPage({ params }: NoteViewPageProps) {
  const router = useRouter();
  const { revisionId } = params;
  const { addRevision } = useRevisionHistoryStore();
  const [note, setNote] = useState<NoteResult | null>(null);
  const [status, setStatus] = useState<JobStatus | null>(null);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const isLoadingRef = useRef(false);

  // Debug: Log state on every render
  console.log('[Frontend Page] RENDER - Current state:', {
    hasNote: !!note,
    notePreview: note ? `Has ${note.structure?.length || 0} structure items` : 'null',
    statusStatus: status?.status,
    error,
    isLoadingRef: isLoadingRef.current,
  });

  useEffect(() => {
    // Prevent duplicate calls
    if (isLoadingRef.current) {
      console.log('[Frontend Page] Already loading, skipping useEffect');
      return;
    }

    isLoadingRef.current = true;
    console.log('[Frontend Page] useEffect triggered, calling checkStatus');
    checkStatus();
  }, [revisionId]);

  const checkStatus = async () => {
    try {
      console.log('[Frontend Page] checkStatus called');
      const jobStatus = await noteService.getJobStatus(revisionId);
      console.log('[Frontend Page] Job status received:', jobStatus);
      setStatus(jobStatus);

      if (jobStatus.status === 'done') {
        console.log('[Frontend Page] Status is DONE, calling loadNote...');
        await loadNote();
        console.log('[Frontend Page] loadNote completed');
        return;
      } else if (jobStatus.status === 'processing' || jobStatus.status === 'queued') {
        console.log('[Frontend Page] Status is', jobStatus.status, '- will poll again in 2s');
        setTimeout(checkStatus, 2000);
      } else if (jobStatus.status === 'failed') {
        console.log('[Frontend Page] Status is FAILED');
        setError(jobStatus.error || 'Processing failed');
      }
    } catch (err: unknown) {
      console.error('[Frontend Page] Error in checkStatus:', err);
      setError('Failed to check status');
    }
  };

  const loadNote = async () => {
    try {
      console.log('[Frontend Page] loadNote called for revisionId:', revisionId);
      const result = await noteService.getNoteResult(revisionId);
      console.log('[Frontend Page] Result received from noteService:', result);
      console.log('[Frontend Page] Result type:', typeof result);
      console.log('[Frontend Page] Result keys:', Object.keys(result || {}));

      if (!result) {
        console.error('[Frontend Page] Result is null or undefined!');
        setError('Received empty result from server');
        return;
      }

      console.log('[Frontend Page] Setting note state with:', {
        hasMeta: !!result.meta,
        hasExports: !!result.exports,
        hasStructure: !!result.structure,
        structureCount: result.structure?.length || 0,
      });

      // Add to revision history
      addRevision({
        revisionId: result.meta.revisionId,
        title: result.meta.userProvidedTitle || 'Untitled Note',
        createdAt: result.createdAt,
      });

      setNote(result);
      console.log('[Frontend Page] setNote called, note state should update on next render');
    } catch (err: unknown) {
      console.error('[Frontend Page] Error loading note:', err);
      setError('Failed to load note');
    }
  };

  const handleExport = async (format: 'markdown' | 'html' | 'text') => {
    try {
      if (!note?.exports) return;

      const content = note.exports[format === 'text' ? 'plainText' : format];
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `note-${revisionId}.${format === 'text' ? 'txt' : format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderStructure = (nodes: NoteResult['structure'], level = 0) => {
    return nodes.map((node) => {
      const isExpanded = expandedSections.has(node.id);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <div key={node.id} className={`${level > 0 ? 'ml-6 mt-4' : 'mt-4'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <button
                  onClick={() => toggleSection(node.id)}
                  className="flex items-center space-x-2 text-left w-full"
                >
                  {hasChildren && (
                    <span>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </span>
                  )}
                  <h3
                    className={`font-semibold text-gray-900 dark:text-white ${level === 0 ? 'text-lg' : 'text-base'}`}
                  >
                    {node.title}
                  </h3>
                </button>
                {node.content && (
                  <p className="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {node.content}
                  </p>
                )}
                {node.tasks && node.tasks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {node.tasks.map((task) => (
                      <div key={task.id} className="flex items-start space-x-2 text-sm">
                        <input type="checkbox" className="mt-1" />
                        <div className="flex-1">
                          <span className="text-gray-800 dark:text-gray-200">{task.text}</span>
                          {task.priority && (
                            <span className="ml-2 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-0.5 rounded">
                              {task.priority}
                            </span>
                          )}
                          {task.steps && task.steps.length > 0 && (
                            <ul className="mt-1 ml-4 space-y-1 text-gray-600 dark:text-gray-400">
                              {task.steps.map((step, idx) => (
                                <li key={idx}>• {step}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {isExpanded && hasChildren && (
            <div className="mt-2">{renderStructure(node.children, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 dark:text-primary-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {status?.status === 'queued' && 'Note queued for processing...'}
            {status?.status === 'processing' && `Processing note... ${status.progress || 0}%`}
            {status?.status === 'done' && 'Loading note...'}
            {!status && 'Loading note...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/')}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleExport('markdown')}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                <span>Markdown</span>
              </button>
              <button
                onClick={() => handleExport('html')}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                <span>HTML</span>
              </button>
              <button
                onClick={() => handleExport('text')}
                className="flex items-center space-x-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300"
              >
                <Download className="w-4 h-4" />
                <span>Text</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
              <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                {note.meta.userProvidedTitle || 'Note Result'}
              </h1>
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <span>Created {format(new Date(note.createdAt), 'MMM d, yyyy h:mm a')}</span>
                {note.cached && (
                  <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded">
                    Cached
                  </span>
                )}
              </div>
            </div>

            <div>{renderStructure(note.structure)}</div>

            {note.ambiguousSegments && note.ambiguousSegments.length > 0 && (
              <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                  Ambiguous Segments
                </h3>
                <ul className="space-y-2">
                  {note.ambiguousSegments.map((seg, idx) => (
                    <li key={idx} className="text-sm text-yellow-800 dark:text-yellow-400">
                      <span className="font-medium">[{seg.locationHint}]</span> {seg.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {note.contradictions && note.contradictions.length > 0 && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 dark:text-red-300 mb-2">
                  Contradictions
                </h3>
                <ul className="space-y-2">
                  {note.contradictions.map((contra, idx) => (
                    <li key={idx} className="text-sm text-red-800 dark:text-red-400">
                      <p className="font-medium mb-1">{contra.note}</p>
                      <ul className="ml-4 space-y-1">
                        {contra.segments.map((seg, segIdx) => (
                          <li key={segIdx}>• {seg}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-6">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Metadata</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-gray-600 dark:text-gray-400">Revision ID</dt>
                  <dd className="font-mono text-xs mt-1 text-gray-900 dark:text-gray-200">
                    {note.meta.revisionId}
                  </dd>
                </div>
                {note.meta.detectedLanguage && (
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Language</dt>
                    <dd className="mt-1 text-gray-900 dark:text-gray-200">
                      {note.meta.detectedLanguage}
                    </dd>
                  </div>
                )}
                {note.meta.topTags && note.meta.topTags.length > 0 && (
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Tags</dt>
                    <dd className="mt-1 flex flex-wrap gap-1">
                      {note.meta.topTags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {note.meta.dates && note.meta.dates.length > 0 && (
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Dates</dt>
                    <dd className="mt-1 space-y-1">
                      {note.meta.dates.map((date, idx) => (
                        <div key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                          {date}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
                {note.meta.priorities && note.meta.priorities.length > 0 && (
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Priorities</dt>
                    <dd className="mt-1 space-y-1">
                      {note.meta.priorities.map((priority, idx) => (
                        <div key={idx} className="text-xs text-gray-700 dark:text-gray-300">
                          {priority}
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
                {note.modelUsed && (
                  <div>
                    <dt className="text-gray-600 dark:text-gray-400">Model Used</dt>
                    <dd className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                      {note.modelUsed}
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
