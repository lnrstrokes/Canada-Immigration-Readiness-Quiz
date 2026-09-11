import React, { useState } from 'react';
import { DEFAULT_CHALLENGE } from './data/defaultChallenge';
import { SetupView } from './components/SetupView';
import { LivestreamBroadcast } from './components/LivestreamBroadcast';
import { VideoRecorderStudio } from './components/VideoRecorderStudio';

type AppView = 'setup' | 'assessment' | 'recorder_studio';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('setup');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Array.from(new Set(DEFAULT_CHALLENGE.questions.map((q) => q.category)))
  );
  const [shuffle, setShuffle] = useState(true);
  const [questionCount, setQuestionCount] = useState<number>(10);

  const handleStartAssessment = (
    categories: string[],
    isShuffle: boolean,
    count: number
  ) => {
    setSelectedCategories(categories);
    setShuffle(isShuffle);
    setQuestionCount(count);
    setCurrentView('assessment');
  };

  if (currentView === 'setup') {
    return (
      <SetupView
        config={DEFAULT_CHALLENGE}
        onStartAssessment={handleStartAssessment}
        onOpenVideoStudio={() => setCurrentView('recorder_studio')}
      />
    );
  }

  if (currentView === 'recorder_studio') {
    return (
      <VideoRecorderStudio
        config={DEFAULT_CHALLENGE}
        onBack={() => setCurrentView('setup')}
      />
    );
  }

  return (
    <LivestreamBroadcast
      config={DEFAULT_CHALLENGE}
      selectedCategories={selectedCategories}
      shuffle={shuffle}
      questionCount={questionCount}
      onBackToSetup={() => setCurrentView('setup')}
      onOpenVideoStudio={() => setCurrentView('recorder_studio')}
    />
  );
}
