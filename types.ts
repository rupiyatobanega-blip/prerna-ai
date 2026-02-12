
export type Category = 'motivational' | 'love' | 'trading' | 'friendship';

export interface MotivationContent {
  title: string;
  body: string;
  theme: string;
}

/**
 * Interface representing a Facebook Page as returned by the Graph API.
 * This is required by services/facebookService.ts to handle page listings and tokens.
 */
export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}
