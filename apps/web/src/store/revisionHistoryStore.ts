import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RevisionHistoryItem {
  revisionId: string;
  title: string;
  createdAt: string;
}

interface RevisionHistoryState {
  revisions: RevisionHistoryItem[];
  addRevision: (revision: RevisionHistoryItem) => void;
  removeRevision: (revisionId: string) => void;
  clearHistory: () => void;
  validateRevisions: () => Promise<void>;
}

export const useRevisionHistoryStore = create<RevisionHistoryState>()(
  persist(
    (set) => ({
      revisions: [],
      addRevision: (revision) =>
        set((state) => {
          // Remove if exists, then add to front (max 50 items)
          const filtered = state.revisions.filter((r) => r.revisionId !== revision.revisionId);
          return { revisions: [revision, ...filtered].slice(0, 50) };
        }),
      removeRevision: (revisionId) =>
        set((state) => ({
          revisions: state.revisions.filter((r) => r.revisionId !== revisionId),
        })),
      clearHistory: () => set({ revisions: [] }),
      validateRevisions: async () => {
        const state = useRevisionHistoryStore.getState();
        const validRevisions: RevisionHistoryItem[] = [];

        // Check each revision to see if it still exists
        for (const revision of state.revisions) {
          try {
            const response = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/v1/notes/${revision.revisionId}/status`
            );
            if (response.ok) {
              validRevisions.push(revision);
            }
          } catch (error) {
            // Revision no longer exists, skip it
            console.log(`Removing stale revision: ${revision.revisionId}`);
          }
        }

        // Update store with only valid revisions
        if (validRevisions.length !== state.revisions.length) {
          set({ revisions: validRevisions });
          console.log(
            `Cleaned up ${state.revisions.length - validRevisions.length} stale revisions`
          );
        }
      },
    }),
    {
      name: 'revision-history',
    }
  )
);
