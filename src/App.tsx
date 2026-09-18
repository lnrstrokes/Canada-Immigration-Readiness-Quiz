import React, { useState } from 'react';
import { DEFAULT_CHALLENGE } from './data/defaultChallenge';
import { SetupView } from './components/SetupView';
import { LivestreamBroadcast } from './components/LivestreamBroadcast';
import { VideoRecorderStudio } from './components/VideoRecorderStudio';
import { BACSPremiumView } from './components/BACSPremiumView';
import { Question, ChallengeConfig } from './types';

type AppView = 'setup' | 'assessment' | 'recorder_studio' | 'premium';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('setup');
  const [activeQuestions, setActiveQuestions] = useState<Question[]>(DEFAULT_CHALLENGE.questions);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Array.from(new Set(DEFAULT_CHALLENGE.questions.map((q) => q.category)))
  );
  const [shuffle, setShuffle] = useState(false);
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [questionDuration, setQuestionDuration] = useState<number>(25); // Section 9: 25s default
  const [revealDuration, setRevealDuration] = useState<number>(12);     // Section 9: 12s default

  const handleStartAssessment = (
    categories: string[],
    isShuffle: boolean,
    count: number,
    qDur: number = 25,
    rDur: number = 12,
    customQuestions?: Question[]
  ) => {
    if (customQuestions && customQuestions.length > 0) {
      setActiveQuestions(customQuestions);
      setSelectedCategories([customQuestions[0].category]);
      setQuestionCount(customQuestions.length);
    } else {
      setActiveQuestions(DEFAULT_CHALLENGE.questions);
      setSelectedCategories(categories);
      setQuestionCount(count);
    }
    setShuffle(isShuffle);
    setQuestionDuration(qDur);
    setRevealDuration(rDur);
    setCurrentView('assessment');
  };

  const handleOpenVideoStudio = (customQuestions?: Question[]) => {
    if (customQuestions && customQuestions.length > 0) {
      setActiveQuestions(customQuestions);
    } else {
      setActiveQuestions(DEFAULT_CHALLENGE.questions);
    }
    setCurrentView('recorder_studio');
  };

  const currentConfig: ChallengeConfig = {
    ...DEFAULT_CHALLENGE,
    questions: activeQuestions,
  };

  if (currentView === 'setup') {
    return (
      <SetupView
        config={DEFAULT_CHALLENGE}
        onStartAssessment={handleStartAssessment}
        onOpenVideoStudio={handleOpenVideoStudio}
        onOpenPremium={() => setCurrentView('premium')}
      />
    );
  }

  if (currentView === 'recorder_studio') {
    return (
      <VideoRecorderStudio
        config={currentConfig}
        onBack={() => setCurrentView('setup')}
      />
    );
  }

  if (currentView === 'premium') {
    return (
      <BACSPremiumView
        onBack={() => setCurrentView('setup')}
        onOpenAssessment={() => setCurrentView('assessment')}
      />
    );
  }

  return (
    <LivestreamBroadcast
      config={currentConfig}
      selectedCategories={selectedCategories}
      shuffle={shuffle}
      questionCount={questionCount}
      questionDuration={questionDuration}
      revealDuration={revealDuration}
      onBackToSetup={() => setCurrentView('setup')}
      onOpenVideoStudio={() => setCurrentView('recorder_studio')}
    />
  );
}
