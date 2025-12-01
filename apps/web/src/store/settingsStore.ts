import { create } from 'zustand';
import { NoteOptions } from '@/types/note';

interface SettingsState {
  defaultOptions: NoteOptions;
  cacheEnabled: boolean;
  modelSettings: {
    name: string;
    temperature: number;
    maxTokens: number;
  };
  updateDefaultOptions: (options: Partial<NoteOptions>) => void;
  setCacheEnabled: (enabled: boolean) => void;
  updateModelSettings: (settings: Partial<SettingsState['modelSettings']>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  defaultOptions: {
    tone: 'original',
    formattingStrictness: 'moderate',
    exportMode: 'all',
    useCached: true,
  },
  cacheEnabled: true,
  modelSettings: {
    name: 'gpt-4-turbo-preview',
    temperature: 0.7,
    maxTokens: 4000,
  },
  updateDefaultOptions: (options) =>
    set((state) => ({
      defaultOptions: { ...state.defaultOptions, ...options },
    })),
  setCacheEnabled: (enabled) => set({ cacheEnabled: enabled }),
  updateModelSettings: (settings) =>
    set((state) => ({
      modelSettings: { ...state.modelSettings, ...settings },
    })),
}));
