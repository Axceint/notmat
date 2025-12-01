'use client';

import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/store/settingsStore';
import { ArrowLeft, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const {
    defaultOptions,
    cacheEnabled,
    modelSettings,
    updateDefaultOptions,
    setCacheEnabled,
    updateModelSettings,
  } = useSettingsStore();

  const handleSave = () => {
    router.push('/');
  };

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
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 bg-primary-600 dark:bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-700 dark:hover:bg-primary-600"
            >
              <Save className="w-4 h-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Default Note Options
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Default Tone
                </label>
                <select
                  value={defaultOptions.tone}
                  onChange={(e) =>
                    updateDefaultOptions({ tone: e.target.value as NoteOptions['tone'] })
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
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Default Formatting Strictness
                </label>
                <select
                  value={defaultOptions.formattingStrictness}
                  onChange={(e) =>
                    updateDefaultOptions({
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
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Default Export Mode
                </label>
                <select
                  value={defaultOptions.exportMode}
                  onChange={(e) =>
                    updateDefaultOptions({
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
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Caching</h2>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="cacheEnabled"
                checked={cacheEnabled}
                onChange={(e) => setCacheEnabled(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label
                htmlFor="cacheEnabled"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Enable result caching (improves performance for repeated queries)
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              AI Model Settings
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Model Name
                </label>
                <input
                  type="text"
                  value={modelSettings.name}
                  onChange={(e) => updateModelSettings({ name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Temperature ({modelSettings.temperature})
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={modelSettings.temperature}
                  onChange={(e) => updateModelSettings({ temperature: parseFloat(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lower values make output more focused, higher values more creative
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">
                  Max Tokens
                </label>
                <input
                  type="number"
                  value={modelSettings.maxTokens}
                  onChange={(e) => updateModelSettings({ maxTokens: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
