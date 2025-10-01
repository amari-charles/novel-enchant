/**
 * Enhanced Upload Component
 * Handles both text paste and file upload for enhancement
 */

import React, { useState, useCallback } from 'react';
import { FileUploadService, VALIDATION_LIMITS } from '../services/file-upload.service';
import type { EnhanceUploadProps, PasteFormData, FileFormData } from '@/features/reader-enhance/types';

export const EnhanceUpload: React.FC<EnhanceUploadProps> = ({
  onTextSubmit,
  onFileSubmit,
  isProcessing,
  maxFileSizeMB = VALIDATION_LIMITS.MAX_FILE_SIZE_MB,
  supportedFormats = FileUploadService.getSupportedFormats(),
}) => {
  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [pasteData, setPasteData] = useState<PasteFormData>({ text: '', title: '' });
  const [fileData, setFileData] = useState<FileFormData | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);


  const validateAndSubmitText = useCallback(() => {
    const validation = FileUploadService.validateText(pasteData.text);
    if (!validation.isValid) {
      setErrors([validation.error || 'Invalid text']);
      return;
    }

    setErrors([]);
    onTextSubmit(
      pasteData.text,
      pasteData.title || FileUploadService.generateTitleFromText(pasteData.text)
    );
  }, [pasteData, onTextSubmit]);

  const validateAndSubmitFile = useCallback(() => {
    if (!fileData?.file) {
      setErrors(['Please select a file']);
      return;
    }

    const validation = FileUploadService.validateFile(fileData.file);
    if (!validation.isValid) {
      setErrors([validation.error || 'Invalid file']);
      return;
    }

    setErrors([]);
    onFileSubmit(
      fileData.file,
      fileData.title || FileUploadService.generateTitleFromText(fileData.file.name.split('.')[0])
    );
  }, [fileData, onFileSubmit]);

  const handleFileSelect = useCallback((file: File) => {
    setFileData({
      file,
      title: FileUploadService.generateTitleFromText(file.name.split('.')[0]),
    });
    setErrors([]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const wordCount = FileUploadService.validateText(pasteData.text).wordCount || 0;
  const canSubmit = !isProcessing && errors.length === 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhance Your Story
        </h1>
        <p className="text-gray-600">
          Transform your text into an illustrated experience with AI-generated images
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('paste')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'paste'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Paste Text
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'file'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Upload File
          </button>
        </div>
      </div>

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <ul className="mt-2 text-sm text-red-700 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}


      {/* Paste Text Tab */}
      {activeTab === 'paste' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={pasteData.title}
              onChange={(e) => setPasteData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter a title for your story"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              maxLength={VALIDATION_LIMITS.MAX_TITLE_LENGTH}
              disabled={isProcessing}
            />
          </div>

          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-1">
              Story Text
            </label>
            <textarea
              id="text"
              role="textbox"
              value={pasteData.text}
              onChange={(e) => setPasteData(prev => ({ ...prev, text: e.target.value }))}
              placeholder="Paste your story text here..."
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              disabled={isProcessing}
            />
            <div className="mt-1 flex justify-between text-sm text-gray-500">
              <span>
                {wordCount} words ({wordCount > VALIDATION_LIMITS.MAX_WORD_COUNT ? 'exceeds limit' : 'within limit'})
              </span>
              <span>
                Maximum {VALIDATION_LIMITS.MAX_WORD_COUNT.toLocaleString()} words
              </span>
            </div>
          </div>

          <button
            onClick={validateAndSubmitText}
            disabled={!canSubmit || !pasteData.text.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Enhance Story'}
          </button>
        </div>
      )}

      {/* Upload File Tab */}
      {activeTab === 'file' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="file-title" className="block text-sm font-medium text-gray-700 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              id="file-title"
              value={fileData?.title || ''}
              onChange={(e) => setFileData(prev => prev ? { ...prev, title: e.target.value } : null)}
              placeholder="Enter a title for your story"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              maxLength={VALIDATION_LIMITS.MAX_TITLE_LENGTH}
              disabled={isProcessing}
            />
          </div>

          {/* File Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input
              type="file"
              id="file-upload"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              accept={supportedFormats.join(',')}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isProcessing}
              aria-label="Choose file or upload file"
            />

            <div className="space-y-2">
              {fileData ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{fileData.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">
                      <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Supported formats: {supportedFormats.join(', ')}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 text-xs text-gray-500">
              Maximum file size: {maxFileSizeMB}MB
            </div>
          </div>

          <button
            onClick={validateAndSubmitFile}
            disabled={!canSubmit || !fileData}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Enhance Story'}
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <h4 className="font-medium text-gray-900 mb-2">Tips for best results:</h4>
        <ul className="space-y-1">
          <li>• Stories with 500-5,000 words work best</li>
          <li>• Include descriptive scenes and settings</li>
          <li>• Chapter breaks help organize the enhancement</li>
          <li>• Supported formats: {supportedFormats.join(', ')}</li>
        </ul>
      </div>
    </div>
  );
};

export default EnhanceUpload;