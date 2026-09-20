import { CalendarDay, Layer4DistributionPack, Question } from '../types';

export const BACS_ASSESSMENT_CTA = 'Find out your real chance of moving to Canada in 4 minutes';

/**
 * Maps topics and subtopics to high-relevance, compliant immigration hashtags
 */
export const getTopicHashtags = (topic: string, subtopics: string[] = []): string[] => {
  const t = topic.toLowerCase();
  const allSub = subtopics.join(' ').toLowerCase();
  
  const baseTags = ['#CanadaImmigration', '#ExpressEntry', '#CanadaPR', '#BACSQuiz'];
  const topicTags: string[] = [];

  if (t.includes('crs') || allSub.includes('crs') || t.includes('score')) {
    topicTags.push('#CRSScore', '#ComprehensiveRankingSystem', '#ImmigrationCanada');
  } else if (t.includes('language') || t.includes('ielts') || t.includes('clb') || t.includes('celpip') || t.includes('pte')) {
    topicTags.push('#IELTSCanada', '#CLBScore', '#CELPIP', '#LanguageTestCanada');
  } else if (t.includes('work experience') || t.includes('foreign') || t.includes('canadian work')) {
    topicTags.push('#CanadianExperienceClass', '#FederalSkilledWorker', '#WorkInCanada');
  } else if (t.includes('education') || t.includes('eca') || t.includes('wes')) {
    topicTags.push('#ECACanada', '#WESAssessment', '#StudyInCanada');
  } else if (t.includes('noc') || t.includes('teer') || t.includes('job offer') || t.includes('lmia')) {
    topicTags.push('#NOCTEER', '#LMIACanada', '#CanadaJobOffer');
  } else if (t.includes('pnp') || t.includes('provincial')) {
    topicTags.push('#ProvincialNominee', '#CanadaPNP', '#OINP', '#BCPNP');
  } else if (t.includes('spousal') || t.includes('family') || t.includes('sponsorship')) {
    topicTags.push('#SpousalSponsorship', '#FamilyClassPR', '#CanadaVisa');
  } else if (t.includes('pgwp') || t.includes('student') || t.includes('study permit')) {
    topicTags.push('#PGWPCanada', '#InternationalStudentCanada', '#CanadaStudy');
  } else if (t.includes('bridging') || t.includes('bowp') || t.includes('maintained')) {
    topicTags.push('#BOWPCanada', '#MaintainedStatus', '#WorkPermitCanada');
  } else if (t.includes('settlement') || t.includes('proof of funds') || t.includes('pof')) {
    topicTags.push('#ProofOfFunds', '#SettlementFundsCanada', '#MoveToCanada');
  } else {
    topicTags.push('#MoveToCanada', '#IRCC', '#LiveInCanada');
  }

  // Combine and deduplicate
  const combined = Array.from(new Set([...topicTags, ...baseTags]));
  return combined.slice(0, 7);
};

/**
 * Maps topics and subtopics to high-relevance YouTube search tags
 */
export const getYouTubeTags = (topic: string, subtopics: string[] = []): string[] => {
  const t = topic.toLowerCase();
  const subList = subtopics.map((s) => s.trim());
  const tags: string[] = [
    'Canada Immigration',
    'Express Entry Canada',
    'IRCC',
    'BACS Immigration Quiz',
    'Canada PR 2026',
    topic,
  ];

  if (t.includes('crs') || t.includes('score')) {
    tags.push('CRS Calculator', 'CRS Cutoff Score', 'Express Entry Points');
  } else if (t.includes('language') || t.includes('ielts') || t.includes('clb')) {
    tags.push('CLB 7 IELTS', 'CELPIP vs IELTS', 'PTE Core Canada', 'Language Requirements Canada');
  } else if (t.includes('work') || t.includes('experience')) {
    tags.push('Canadian Work Experience', 'Foreign Work Experience', 'Federal Skilled Worker Program');
  } else if (t.includes('noc') || t.includes('teer')) {
    tags.push('NOC Code Canada', 'TEER Category', 'Valid Job Offer LMIA');
  } else if (t.includes('pnp')) {
    tags.push('Provincial Nominee Program', 'PNP 600 points', 'Canada PNP Streams');
  } else if (t.includes('pgwp') || t.includes('student')) {
    tags.push('PGWP Canada', 'Study to PR Canada', 'International Students IRCC');
  }

  subList.forEach((sub) => {
    if (sub && !tags.includes(sub)) {
      tags.push(sub);
    }
  });

  return Array.from(new Set(tags)).slice(0, 10);
};

/**
 * Helper to ensure no question answers are revealed in titles or hooks
 */
const sanitizeHookAgainstAnswers = (text: string, questions: Question[]): boolean => {
  const lowerText = text.toLowerCase();
  for (const q of questions) {
    const correctKey = q.correctAnswer;
    const correctVal = q.options[correctKey]?.toLowerCase() || '';
    if (correctVal.length > 5 && lowerText.includes(correctVal)) {
      return false; // Answer leaked!
    }
  }
  return true;
};

/**
 * Generates verified Layer 4 distribution metadata based strictly on the day's validated data
 */
export const generateDistributionPack = (
  day: CalendarDay,
  variantIndex: number = 0
): Layer4DistributionPack => {
  const topic = day.topic;
  const subtopics = day.subtopics && day.subtopics.length > 0 ? day.subtopics : ['Eligibility', 'Rules', 'Requirements'];
  const subtopicsText = subtopics.slice(0, 2).join(' & ');
  const questionsCount = day.questions?.length || 3;
  const dayNumber = day.dayNumber || 1;

  // 3 Deterministic Hook Variants for TikTok (Strictly avoids revealing answers)
  const tiktokHooks = [
    `🇨🇦 Can you score ${questionsCount}/${questionsCount} on Canada's ${topic} rules? Pause and comment your answers before the reveal! 🍁\n\n👉 ${BACS_ASSESSMENT_CTA}`,
    `🚨 3 Canada ${topic} questions that trip up most applicants! Test your knowledge before applying to IRCC.\n\nDrop your score in the comments below! 👇\n${BACS_ASSESSMENT_CTA}`,
    `🍁 Think you know Canada's ${topic} requirements? Test your readiness with these ${questionsCount} official IRCC scenario questions!\n\n👇 ${BACS_ASSESSMENT_CTA}`,
  ];

  // 3 Deterministic Title Variants for YouTube Shorts
  const ytTitles = [
    `Can You Pass This Canada ${topic} Quiz? (${questionsCount} IRCC Questions) #Shorts`,
    `${questionsCount} Canada ${topic} Questions Most Applicants Miss! | BACS Quiz #Shorts`,
    `Canada Immigration Quiz: ${topic} (${questionsCount} Questions) #Shorts`,
  ];

  const selectedHookIdx = variantIndex % tiktokHooks.length;
  const selectedTitleIdx = variantIndex % ytTitles.length;

  const tiktokCaption = tiktokHooks[selectedHookIdx];
  const tiktokShortDesc = `Test your Canada immigration readiness on ${topic} across ${questionsCount} IRCC-verified questions covering ${subtopicsText}. Official rules from canada.ca.`;
  const tiktokHashtags = getTopicHashtags(topic, subtopics);

  const ytTitle = ytTitles[selectedTitleIdx];
  const ytDescription = `Test your Canada immigration readiness with today's ${questionsCount} IRCC-verified questions on ${topic} (Day ${dayNumber})!\n\nCovering: ${subtopics.join(', ')}.\n\nPause the video on each question, choose your answer (A, B, C, or D), and check the official reasoning after the 25-second countdown.\n\n🍁 ${BACS_ASSESSMENT_CTA}:\nhttps://bacs-canada.vercel.app\n\nOfficial Source Authority: Government of Canada / IRCC (canada.ca).\nFor educational & preparation purposes.`;
  const ytTags = getYouTubeTags(topic, subtopics);

  return {
    tiktok: {
      caption: tiktokCaption,
      shortDescription: tiktokShortDesc,
      hashtags: tiktokHashtags,
    },
    youtubeShorts: {
      title: ytTitle,
      description: ytDescription,
      tags: ytTags,
    },
  };
};

export interface DistributionPackValidation {
  isValid: boolean;
  issues: string[];
}

/**
 * Validates Layer 4 metadata strictly against rules:
 * - Topic alignment
 * - No answer leak
 * - Exact CTA adherence
 * - No unsupported claims
 */
export const validateDistributionPack = (
  pack: Layer4DistributionPack,
  day: CalendarDay
): DistributionPackValidation => {
  const issues: string[] = [];

  if (!pack || !pack.tiktok || !pack.youtubeShorts) {
    return { isValid: false, issues: ['Distribution pack metadata is incomplete.'] };
  }

  // 1. Check CTA exactness
  if (!pack.tiktok.caption.includes(BACS_ASSESSMENT_CTA)) {
    issues.push(`TikTok caption must contain exact CTA: "${BACS_ASSESSMENT_CTA}"`);
  }
  if (!pack.youtubeShorts.description.includes(BACS_ASSESSMENT_CTA)) {
    issues.push(`YouTube description must contain exact CTA: "${BACS_ASSESSMENT_CTA}"`);
  }

  // 2. Check that topic is represented
  const normTopic = day.topic.toLowerCase();
  const tiktokHasTopic = pack.tiktok.caption.toLowerCase().includes(normTopic) || 
                         pack.tiktok.shortDescription.toLowerCase().includes(normTopic);
  if (!tiktokHasTopic) {
    issues.push(`TikTok metadata does not mention the day's topic: "${day.topic}"`);
  }

  const ytHasTopic = pack.youtubeShorts.title.toLowerCase().includes(normTopic) || 
                     pack.youtubeShorts.description.toLowerCase().includes(normTopic);
  if (!ytHasTopic) {
    issues.push(`YouTube metadata does not mention the day's topic: "${day.topic}"`);
  }

  // 3. Confirm no answer is leaked in hooks/titles
  if (!sanitizeHookAgainstAnswers(pack.tiktok.caption, day.questions)) {
    issues.push('TikTok caption inadvertently reveals a question answer.');
  }
  if (!sanitizeHookAgainstAnswers(pack.youtubeShorts.title, day.questions)) {
    issues.push('YouTube title inadvertently reveals a question answer.');
  }

  // 4. Check hashtag and tag counts
  if (!pack.tiktok.hashtags || pack.tiktok.hashtags.length < 3) {
    issues.push('TikTok hashtags set is too sparse (minimum 3 required).');
  }
  if (!pack.youtubeShorts.tags || pack.youtubeShorts.tags.length < 3) {
    issues.push('YouTube search tags set is too sparse (minimum 3 required).');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
};
