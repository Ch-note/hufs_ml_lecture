export interface Scenario {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  systemInstruction: string;
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'subway',
    title: 'Subway Ticket Machine',
    description: 'Practice buying a ticket at a card-only machine.',
    videoUrl: 'https://videos.pexels.com/video-files/853889/853889-hd_1920_1080_25fps.mp4',
    systemInstruction: 'You are a friendly AI English tutor. The user is a beginner international student trying to buy a subway ticket. On the screen, there is an automated ticket machine with a "Card Only" sign. Mention this "Card Only" restriction and guide them step-by-step through buying a ticket. Keep your responses concise and encouraging.'
  },
  {
    id: 'cafe',
    title: 'Airport Cafe',
    description: 'Order food and drinks at a busy airport cafe.',
    videoUrl: 'https://videos.pexels.com/video-files/2873817/2873817-uhd_2560_1440_30fps.mp4',
    systemInstruction: 'You are an AI English tutor acting as a cafe barista at an airport. The user is a traveler. The menu shows an Avocado Toast set is currently on discount, and croissants are Sold Out. Help the user order based on this information. Be polite, speak clearly, and keep your responses relatively short to encourage back-and-forth conversation.'
  }
];

export const INTRO_VIDEOS = [
  'https://videos.pexels.com/video-files/2093096/2093096-uhd_2560_1440_24fps.mp4', // 0: Airplane arriving
  'https://videos.pexels.com/video-files/4428503/4428503-uhd_2560_1440_24fps.mp4', // 1: Immigration / Security
  'https://videos.pexels.com/video-files/2873817/2873817-uhd_2560_1440_30fps.mp4'  // 2: Airport Lobby
];

export const LIVE_API_MODEL_NAME = 'gemini-live-2.5-flash-native-audio';
