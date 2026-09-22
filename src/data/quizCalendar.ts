import { DailyQuizSchedule } from '../types';

export const FOURTEEN_DAY_SCHEDULE: DailyQuizSchedule[] = [
  {
    date: '2026-09-21',
    displayDate: 'September 21, 2026',
    questionCount: 40,
    theme: 'Foundations of Faith & Creation',
    description: 'Old Testament origins, Patriarchs, and the beginning of God\'s covenant.',
  },
  {
    date: '2026-09-22',
    displayDate: 'September 22, 2026',
    questionCount: 60,
    theme: 'The Life & Ministry of Jesus',
    description: 'The Gospels, the miracles of Christ, and early apostolic teachings.',
  },
  {
    date: '2026-09-23',
    displayDate: 'September 23, 2026',
    questionCount: 30,
    theme: 'Parables of the Kingdom',
    description: 'Stories Jesus told to reveal divine truths and heavenly principles.',
  },
  {
    date: '2026-09-24',
    displayDate: 'September 24, 2026',
    questionCount: 75,
    theme: 'Heroes of Faith & Bible Characters',
    description: 'Courageous men and women who walked with God across both Testaments.',
  },
  {
    date: '2026-09-25',
    displayDate: 'September 25, 2026',
    questionCount: 45,
    theme: 'Wisdom Literature, Psalms & Proverbs',
    description: 'Worship, poetic praise, righteous counsel, and practical wisdom for life.',
  },
  {
    date: '2026-09-26',
    displayDate: 'September 26, 2026',
    questionCount: 90,
    theme: 'Acts of the Apostles & Early Church',
    description: 'The Holy Spirit\'s power, Pentecost, Paul\'s missionary journeys, and early believers.',
  },
  {
    date: '2026-09-27',
    displayDate: 'September 27, 2026',
    questionCount: 50,
    theme: 'Miracles & Divine Deliverance',
    description: 'From the Red Sea to Lazarus: God\'s supernatural power through history.',
  },
  {
    date: '2026-09-28',
    displayDate: 'September 28, 2026',
    questionCount: 35,
    theme: 'Books of the Bible & Scripture Structure',
    description: 'Biblical canon, book classifications, authors, chapters, and foundational texts.',
  },
  {
    date: '2026-09-29',
    displayDate: 'September 29, 2026',
    questionCount: 70,
    theme: 'Prophets & Messianic Prophecy',
    description: 'Major and minor prophets, visions of Christ, and biblical foretelling.',
  },
  {
    date: '2026-09-30',
    displayDate: 'September 30, 2026',
    questionCount: 40,
    theme: 'The Epistles & Apostolic Letters',
    description: 'The letters of Paul, Peter, John, and James guiding the Christian walk.',
  },
  {
    date: '2026-10-01',
    displayDate: 'October 1, 2026',
    questionCount: 80,
    theme: 'Christian Living & Fruit of the Spirit',
    description: 'Walking in love, faith, holiness, prayer, and the armor of God.',
  },
  {
    date: '2026-10-02',
    displayDate: 'October 2, 2026',
    questionCount: 55,
    theme: 'Covenants & The Tabernacle',
    description: 'Sacrifices, the Ark of the Covenant, priesthood, and the New Covenant in Christ.',
  },
  {
    date: '2026-10-03',
    displayDate: 'October 3, 2026',
    questionCount: 65,
    theme: 'End Times, Hope & Revelation',
    description: 'The return of Christ, New Jerusalem, and eternal promises in Scripture.',
  },
  {
    date: '2026-10-04',
    displayDate: 'October 4, 2026',
    questionCount: 100,
    theme: 'Grand Master Scripture Marathon',
    description: 'Comprehensive 100-question championship covering all 66 books of the Bible.',
  },
];

export const getScheduleForDate = (dateStr: string): DailyQuizSchedule => {
  const found = FOURTEEN_DAY_SCHEDULE.find((s) => s.date === dateStr);
  if (found) return found;
  // Default to first day if not found
  return FOURTEEN_DAY_SCHEDULE[0];
};

export const getDefaultSchedule = (): DailyQuizSchedule => {
  return FOURTEEN_DAY_SCHEDULE[3]; // September 24, 2026 (75 questions) as a featured default
};
