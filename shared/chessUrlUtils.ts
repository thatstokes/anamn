// URL patterns for detecting chess game URLs
const LICHESS_PATTERN = /lichess\.org\/(?:game\/)?([a-zA-Z0-9]{8,12})(?:\/(?:white|black))?/;
const CHESSCOM_LIVE_PATTERN = /chess\.com\/(?:game\/)?(live)\/(\d+)/;
const CHESSCOM_DAILY_PATTERN = /chess\.com\/game\/(daily)\/(\d+)/;

export type ChessSource = "lichess" | "chesscom";

export interface ChessUrlMatch {
  source: ChessSource;
  gameId: string;
  fullUrl: string;
}

/**
 * Check if a string is a chess game URL
 */
export function isChessUrl(url: string): boolean {
  return (
    LICHESS_PATTERN.test(url) ||
    CHESSCOM_LIVE_PATTERN.test(url) ||
    CHESSCOM_DAILY_PATTERN.test(url)
  );
}

/**
 * Parse a chess URL and extract game info
 */
export function parseChessUrl(url: string): ChessUrlMatch | null {
  const lichessMatch = url.match(LICHESS_PATTERN);
  if (lichessMatch?.[1]) {
    return {
      source: "lichess",
      gameId: lichessMatch[1],
      fullUrl: url,
    };
  }

  const chesscomLiveMatch = url.match(CHESSCOM_LIVE_PATTERN);
  if (chesscomLiveMatch?.[2]) {
    return {
      source: "chesscom",
      gameId: chesscomLiveMatch[2],
      fullUrl: url,
    };
  }

  const chesscomDailyMatch = url.match(CHESSCOM_DAILY_PATTERN);
  if (chesscomDailyMatch?.[2]) {
    return {
      source: "chesscom",
      gameId: chesscomDailyMatch[2],
      fullUrl: url,
    };
  }

  return null;
}
