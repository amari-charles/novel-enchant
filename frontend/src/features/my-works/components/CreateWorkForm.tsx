import React, { useState } from 'react';
import type { CreateWorkRequest } from '../types';
import { WorkService } from '../services';
import { getErrorMessage } from '../services/api-client';

interface CreateWorkFormProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateWorkForm: React.FC<CreateWorkFormProps> = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState<CreateWorkRequest>({
    title: '',
    description: '',
    auto_enhance_enabled: true,
    target_scenes_per_chapter: 4,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateWorkRequest, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await WorkService.createWork({
        ...formData,
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
      });

      onSuccess();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Create New Work</h1>
        <p className="mt-2 text-muted-foreground">
          Start your next creative project with AI-enhanced storytelling
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-lg shadow-sm border border-border p-6">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <p className="text-destructive/80">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-muted-foreground mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter your work's title"
              className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground"
              maxLength={255}
              required
            />
            <p className="mt-1 text-sm text-muted-foreground">
              {formData.title.length}/255 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your work's theme, genre, or plot"
              rows={4}
              className="w-full border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground"
              maxLength={2000}
            />
            <p className="mt-1 text-sm text-muted-foreground">
              {(formData.description || '').length}/2000 characters
            </p>
          </div>

          {/* Auto-enhance settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Enhancement Settings</h3>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto_enhance"
                checked={formData.auto_enhance_enabled}
                onChange={(e) => handleInputChange('auto_enhance_enabled', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
              />
              <label htmlFor="auto_enhance" className="ml-2 block text-sm text-muted-foreground">
                Enable automatic image enhancement
              </label>
            </div>

            {formData.auto_enhance_enabled && (
              <div>
                <label htmlFor="target_scenes" className="block text-sm font-medium text-muted-foreground mb-1">
                  Target scenes per chapter
                </label>
                <select
                  id="target_scenes"
                  value={formData.target_scenes_per_chapter}
                  onChange={(e) => handleInputChange('target_scenes_per_chapter', parseInt(e.target.value))}
                  className="w-32 border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-primary bg-input text-foreground"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-muted-foreground">
                  How many images should AI generate per chapter on average
                </p>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium text-foreground mb-2">Preview</h4>
            <div className="space-y-2">
              <p><span className="font-medium">Title:</span> {formData.title || 'Untitled Work'}</p>
              {formData.description && (
                <p><span className="font-medium">Description:</span> {formData.description}</p>
              )}
              <p>
                <span className="font-medium">Enhancement:</span>{' '}
                {formData.auto_enhance_enabled
                  ? `Enabled (${formData.target_scenes_per_chapter} scenes per chapter)`
                  : 'Disabled'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-border text-secondary-foreground px-4 py-2 rounded-lg hover:bg-secondary bg-secondary font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.title.trim()}
            className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
          >
            {loading ? 'Creating...' : 'Create Work'}
          </button>
        </div>
      </form>
    </div>
  );
};