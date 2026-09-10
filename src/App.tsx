import React, { useState } from 'react';
import { DEFAULT_CHALLENGE } from './data/defaultChallenge';
import { SetupView } from './components/SetupView';
import { LivestreamBroadcast } from './components/LivestreamBroadcast';
import { VideoDownloadView } from './components/VideoDownloadView';
import { VideoRecorderStudio } from './components/VideoRecorderStudio';

type AppView = 'setup' | 'broadcast' | 'download_guide' | 'recorder_studio';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('setup');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Array.from(new Set(DEFAULT_CHALLENGE.questions.map((q) => q.category)))
  );
  const [shuffle, setShuffle] = useState(true);
  const [questionCount, setQuestionCount] = useState<number>(10);

  const handleStartStream = (
    categories: string[],
    isShuffle: boolean,
    count: number
  ) => {
    setSelectedCategories(categories);
    setShuffle(isShuffle);
    setQuestionCount(count);
    setCurrentView('broadcast');
  };

  if (currentView === 'setup') {
    return (
      <SetupView
        config={DEFAULT_CHALLENGE}
        onStartStream={handleStartStream}
        onOpenDownloadGuide={() => setCurrentView('download_guide')}
      />
    );
  }

  if (currentView === 'download_guide') {
    return (
      <VideoDownloadView
        onBack={() => setCurrentView('setup')}
        onOpenRecorderStudio={() => setCurrentView('recorder_studio')}
      />
    );
  }

  if (currentView === 'recorder_studio') {
    return <VideoRecorderStudio onBack={() => setCurrentView('download_guide')} />;
  }

  return (
    <LivestreamBroadcast
      config={DEFAULT_CHALLENGE}
      selectedCategories={selectedCategories}
      shuffle={shuffle}
      questionCount={questionCount}
      onBackToSetup={() => setCurrentView('setup')}
    />
  );
}
