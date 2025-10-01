import React, { useState } from 'react';
import { WorksList } from './WorksList';
import { WorkEditorPage } from './WorkEditorPage';
import { CreateWorkForm } from './CreateWorkForm';

interface MyWorksPageProps {
  onNavigate?: (route: string) => void;
}

type PageView = 'list' | 'create' | 'edit';

export const MyWorksPage: React.FC<MyWorksPageProps> = () => {
  const [currentView, setCurrentView] = useState<PageView>('list');
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  const handleCreateWork = () => {
    setCurrentView('create');
  };

  const handleEditWork = (workId: string) => {
    setSelectedWorkId(workId);
    setCurrentView('edit');
  };

  const handleWorkCreated = () => {
    setCurrentView('list');
  };

  const handleBackToList = () => {
    setSelectedWorkId(null);
    setCurrentView('list');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {currentView === 'list' && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">My Works</h1>
            <p className="mt-2 text-muted-foreground">
              Create and manage your stories with AI-enhanced imagery
            </p>
          </div>

          <WorksList
            onCreateWork={handleCreateWork}
            onEditWork={handleEditWork}
          />
        </>
      )}

      {currentView === 'create' && (
        <CreateWorkForm
          onCancel={handleBackToList}
          onSuccess={handleWorkCreated}
        />
      )}

      {currentView === 'edit' && selectedWorkId && (
        <WorkEditorPage
          workId={selectedWorkId}
          onBack={handleBackToList}
        />
      )}
    </div>
  );
};