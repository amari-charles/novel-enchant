/**
 * Flow Tester Component
 * UI component for testing orchestration flows
 */

import React, { useState } from 'react';
import { Button } from '../../shared/ui-components/button';
import { Card } from '../../shared/ui-components/card';
import { 
  testCreateStoryFlowHandler, 
  testProcessChapterFlowHandler, 
  testFullPipelineHandler 
} from './flow-test-helpers';

interface FlowResult {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
  timestamp: string;
}

interface TestResults {
  createStory?: FlowResult;
  processChapter?: FlowResult;
  fullPipeline?: FlowResult;
}

export const FlowTester: React.FC = () => {
  const [results, setResults] = useState<TestResults>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [userId] = useState('test-user-' + Date.now());

  const updateResult = (key: keyof TestResults, result: FlowResult) => {
    setResults(prev => ({
      ...prev,
      [key]: result
    }));
  };

  const updateLoading = (key: string, isLoading: boolean) => {
    setLoading(prev => ({
      ...prev,
      [key]: isLoading
    }));
  };

  const testCreateStoryFlow = async () => {
    updateLoading('createStory', true);
    
    try {
      // Call the Edge Function handler directly with mocks
      const result = await testCreateStoryFlowHandler(userId, 'fantasy');
      updateResult('createStory', result);
      
    } catch (error) {
      updateResult('createStory', {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      updateLoading('createStory', false);
    }
  };

  const testProcessChapterFlow = async () => {
    updateLoading('processChapter', true);
    
    try {
      // Call the Edge Function handler directly with mocks
      const result = await testProcessChapterFlowHandler('test-chapter-' + Date.now(), {
        skipImageGeneration: false
      });
      updateResult('processChapter', result);
      
    } catch (error) {
      updateResult('processChapter', {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      updateLoading('processChapter', false);
    }
  };

  const testFullPipeline = async () => {
    updateLoading('fullPipeline', true);
    
    try {
      // Call the full pipeline handler directly with mocks
      const result = await testFullPipelineHandler(userId, 'fantasy', false);
      updateResult('fullPipeline', result);
      
    } catch (error) {
      updateResult('fullPipeline', {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      updateLoading('fullPipeline', false);
    }
  };

  const ResultCard: React.FC<{ title: string; result?: FlowResult }> = ({ title, result }) => (
    <Card className="p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {result ? (
        <div className="space-y-2">
          <div className={`p-2 rounded ${result.success ? 'bg-green-100' : 'bg-red-100'}`}>
            <div className="flex items-center gap-2">
              <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                {result.success ? '✅' : '❌'}
              </span>
              <span className="font-medium">
                {result.success ? 'Success' : 'Failed'}
              </span>
            </div>
            {result.message && (
              <p className="text-sm mt-1">{result.message}</p>
            )}
          </div>
          
          {result.error && (
            <div className="bg-red-50 p-2 rounded">
              <p className="text-red-600 text-sm font-medium">Error:</p>
              <p className="text-red-700 text-sm">{result.error}</p>
            </div>
          )}
          
          {result.data && (
            <details className="bg-gray-50 p-2 rounded">
              <summary className="cursor-pointer text-sm font-medium">View Data</summary>
              <pre className="text-xs mt-2 overflow-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </details>
          )}
          
          <p className="text-xs text-gray-500">
            {new Date(result.timestamp).toLocaleTimeString()}
          </p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No results yet</p>
      )}
    </Card>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Flow Tester</h1>
        <p className="text-gray-600">Test Novel Enchant orchestration flows</p>
        <p className="text-sm text-gray-500 mt-2">User ID: {userId}</p>
      </div>

      {/* Test Controls */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={testCreateStoryFlow}
            disabled={loading.createStory}
            className="h-auto py-4 flex flex-col items-center space-y-2"
          >
            <span className="text-lg">📚</span>
            <span>Test Create Story Flow</span>
            {loading.createStory && <span className="text-sm">Processing...</span>}
          </Button>

          <Button 
            onClick={testProcessChapterFlow}
            disabled={loading.processChapter}
            className="h-auto py-4 flex flex-col items-center space-y-2"
          >
            <span className="text-lg">⚙️</span>
            <span>Test Process Chapter Flow</span>
            {loading.processChapter && <span className="text-sm">Processing...</span>}
          </Button>

          <Button 
            onClick={testFullPipeline}
            disabled={loading.fullPipeline}
            className="h-auto py-4 flex flex-col items-center space-y-2"
          >
            <span className="text-lg">🚀</span>
            <span>Test Full Pipeline</span>
            {loading.fullPipeline && <span className="text-sm">Processing...</span>}
          </Button>
        </div>
      </Card>

      {/* Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ResultCard title="Create Story Flow" result={results.createStory} />
        <ResultCard title="Process Chapter Flow" result={results.processChapter} />
        <ResultCard title="Full Pipeline" result={results.fullPipeline} />
      </div>

      {/* Instructions */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-3">How to Use</h2>
        <div className="space-y-2 text-sm">
          <p>• <strong>Create Story Flow:</strong> Tests file parsing, chapter detection, and story creation</p>
          <p>• <strong>Process Chapter Flow:</strong> Tests scene extraction, entity tracking, and image generation</p>
          <p>• <strong>Full Pipeline:</strong> Tests the complete end-to-end workflow</p>
        </div>
        
        <h3 className="text-lg font-semibold mt-4 mb-2">Expected Flow</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click "Test Create Story Flow" to create a story with chapters</li>
          <li>Click "Test Process Chapter Flow" to process scenes and generate images</li>
          <li>Click "Test Full Pipeline" to run both flows in sequence</li>
        </ol>
      </Card>
    </div>
  );
};

export default FlowTester;