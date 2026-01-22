import { ipcMain } from "electron";
import { Chess } from "chess.js";
import type { ChessGameData } from "../../shared/types.js";

// URL pattern matchers
const LICHESS_PATTERN = /lichess\.org\/(?:game\/)?([a-zA-Z0-9]{8,12})(?:\/(?:white|black))?/;
const CHESSCOM_LIVE_PATTERN = /chess\.com\/(?:game\/)?live\/(\d+)/;
const CHESSCOM_DAILY_PATTERN = /chess\.com\/game\/daily\/(\d+)/;

export function registerChessImportHandlers(): void {
  ipcMain.handle(
    "chessImport:fetchGame",
    async (_event, url: string): Promise<ChessGameData> => {
      // Detect which platform
      const lichessMatch = url.match(LICHESS_PATTERN);
      const chesscomLiveMatch = url.match(CHESSCOM_LIVE_PATTERN);
      const chesscomDailyMatch = url.match(CHESSCOM_DAILY_PATTERN);

      if (lichessMatch && lichessMatch[1]) {
        return fetchLichessGame(lichessMatch[1], url);
      } else if (chesscomLiveMatch && chesscomLiveMatch[1]) {
        return fetchChessComGame(chesscomLiveMatch[1], url, "live");
      } else if (chesscomDailyMatch && chesscomDailyMatch[1]) {
        return fetchChessComGame(chesscomDailyMatch[1], url, "daily");
      }

      throw new Error("Unrecognized chess game URL. Supported: lichess.org and chess.com");
    }
  );
}

/**
 * Fetch a game from Lichess API
 */
async function fetchLichessGame(gameId: string, originalUrl: string): Promise<ChessGameData> {
  const response = await fetch(`https://lichess.org/game/export/${gameId}`, {
    headers: {
      Accept: "application/x-chess-pgn",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Game not found on Lichess: ${gameId}`);
    }
    throw new Error(`Failed to fetch Lichess game: ${response.status} ${response.statusText}`);
  }

  const pgn = await response.text();
  const headers = parsePgnHeaders(pgn);

  const whiteRating = headers.WhiteElo ? parseInt(headers.WhiteElo, 10) : undefined;
  const blackRating = headers.BlackElo ? parseInt(headers.BlackElo, 10) : undefined;

  return {
    pgn,
    white: {
      username: headers.White || "Unknown",
      ...(whiteRating !== undefined && { rating: whiteRating }),
    },
    black: {
      username: headers.Black || "Unknown",
      ...(blackRating !== undefined && { rating: blackRating }),
    },
    date: headers.Date ?? new Date().toISOString().split("T")[0] ?? "",
    result: headers.Result ?? "*",
    gameId,
    source: "lichess",
    url: originalUrl,
  };
}

// Chess.com API response types
interface ChessComPlayer {
  username?: string;
  rating?: number;
  color?: number;
  colorName?: string;
}

// Chess.com returns players as an object with "top"/"bottom" keys, not an array
interface ChessComPlayersObject {
  top?: ChessComPlayer;
  bottom?: ChessComPlayer;
}

interface ChessComGameResponse {
  players?: ChessComPlayersObject;
  pgnHeaders?: Record<string, string>;
  moveList?: string;
  result?: string;
  game?: {
    players?: ChessComPlayersObject;
    pgnHeaders?: Record<string, string>;
    moveList?: string;
    result?: string;
  };
}

/**
 * Fetch a game from Chess.com
 * Uses the callback API endpoint which returns JSON with game data
 */
async function fetchChessComGame(
  gameId: string,
  originalUrl: string,
  gameType: "live" | "daily"
): Promise<ChessGameData> {
  const endpoint = `https://www.chess.com/callback/${gameType}/game/${gameId}`;

  const response = await fetch(endpoint, {
    headers: {
      "User-Agent": "Anamn Note-Taking App",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Game not found on Chess.com: ${gameId}`);
    }
    throw new Error(`Failed to fetch Chess.com game: ${response.status} ${response.statusText}`);
  }

  const data = await response.json() as ChessComGameResponse;

  // Extract player info from the response
  // Chess.com returns players as an object with "top"/"bottom" keys
  const playersObj = data.players || data.game?.players;
  let whitePl: ChessComPlayer | undefined;
  let blackPl: ChessComPlayer | undefined;

  if (playersObj) {
    // Determine which player is white/black based on color property
    const topPlayer = playersObj.top;
    const bottomPlayer = playersObj.bottom;

    if (topPlayer?.color === 1 || topPlayer?.colorName === "white") {
      whitePl = topPlayer;
      blackPl = bottomPlayer;
    } else if (bottomPlayer?.color === 1 || bottomPlayer?.colorName === "white") {
      whitePl = bottomPlayer;
      blackPl = topPlayer;
    } else {
      // Fallback: assume bottom is white (standard board orientation)
      whitePl = bottomPlayer;
      blackPl = topPlayer;
    }
  }

  // Extract PGN headers
  const pgnHeaders = data.game?.pgnHeaders || data.pgnHeaders || {};

  // Get the moves - Chess.com uses TCN (Two Character Notation)
  const moveList = data.game?.moveList || data.moveList || "";

  // Convert TCN to standard algebraic notation
  const moves = decodeTcnMoves(moveList);

  // Build the full PGN
  const pgn = buildPgn(pgnHeaders, moves, whitePl, blackPl);

  const whiteRating = whitePl?.rating || (pgnHeaders.WhiteElo ? parseInt(pgnHeaders.WhiteElo, 10) : undefined);
  const blackRating = blackPl?.rating || (pgnHeaders.BlackElo ? parseInt(pgnHeaders.BlackElo, 10) : undefined);
  const gameResult = pgnHeaders.Result || data.game?.result || "*";

  return {
    pgn,
    white: {
      username: whitePl?.username || pgnHeaders.White || "Unknown",
      ...(whiteRating !== undefined && { rating: whiteRating }),
    },
    black: {
      username: blackPl?.username || pgnHeaders.Black || "Unknown",
      ...(blackRating !== undefined && { rating: blackRating }),
    },
    date: pgnHeaders.Date ?? new Date().toISOString().split("T")[0] ?? "",
    result: gameResult,
    gameId,
    source: "chesscom",
    url: originalUrl,
  };
}

/**
 * Parse PGN headers into a key-value object
 */
function parsePgnHeaders(pgn: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const headerRegex = /\[(\w+)\s+"([^"]+)"\]/g;
  let match;
  while ((match = headerRegex.exec(pgn)) !== null) {
    if (match[1] && match[2]) {
      headers[match[1]] = match[2];
    }
  }
  return headers;
}

/**
 * Decode Chess.com's TCN (Two Character Notation) moves
 * Each pair of characters encodes from-square and to-square
 *
 * TCN uses a 64-character alphabet where each character maps to a square (0-63).
 * Index 0 = a8 (top-left), index 63 = h1 (bottom-right).
 * For promotions, indices beyond 63 encode both destination and promotion piece.
 */
function decodeTcnMoves(tcn: string): string[] {
  if (!tcn) return [];

  // TCN encoding: first 64 chars map to squares, extended chars for promotions
  const TCN_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!?";
  const FILES = "abcdefgh";

  // Helper to convert TCN index to UCI square (e.g., index 0 -> "a8", index 63 -> "h1")
  function idxToSquare(idx: number): string {
    const file = FILES[idx % 8];
    const rank = 8 - Math.floor(idx / 8); // TCN index 0 = rank 8, index 56-63 = rank 1
    return `${file}${rank}`;
  }

  const moves: string[] = [];
  let i = 0;

  while (i < tcn.length) {
    const char1 = tcn[i];
    const char2 = tcn[i + 1];

    if (!char1 || !char2) break;

    const idx1 = TCN_CHARS.indexOf(char1);
    const idx2 = TCN_CHARS.indexOf(char2);

    if (idx1 === -1 || idx2 === -1) {
      i += 2;
      continue;
    }

    // Decode from-square (always in 0-63 range)
    const fromSquare = idxToSquare(idx1);

    // Decode to-square - may include promotion encoding
    let toSquare: string;
    let promotion = '';

    if (idx2 >= 64) {
      // This is a promotion move
      // Indices 64+ encode: file (0-7) + piece type offset
      // 64-71: queen promotion to files a-h
      // But the actual encoding seems to be more complex
      // The destination file is encoded, and we determine rank from the from-square
      const promoOffset = idx2 - 64;
      const toFile = FILES[promoOffset % 8];
      // White promotes from rank 7 to rank 8, black from rank 2 to rank 1
      const fromRank = parseInt(fromSquare[1] || '0');
      const toRank = fromRank === 7 ? 8 : 1;
      toSquare = `${toFile}${toRank}`;

      // Determine promotion piece based on offset range
      if (promoOffset < 8) promotion = 'q';       // 64-71: queen
      else if (promoOffset < 16) promotion = 'n'; // 72-79: knight
      else if (promoOffset < 24) promotion = 'b'; // 80-87: bishop
      else promotion = 'r';                        // 88-95: rook
    } else {
      toSquare = idxToSquare(idx2);
    }

    const move = `${fromSquare}${toSquare}${promotion}`;
    moves.push(move);

    i += 2;
  }

  return moves;
}

/**
 * Build a PGN string from headers and moves
 */
function buildPgn(
  headers: Record<string, string>,
  uciMoves: string[],
  whitePl?: ChessComPlayer,
  blackPl?: ChessComPlayer
): string {
  // Build header section
  const pgnHeaders: string[] = [];

  // Standard headers
  const event = headers.Event || "Chess.com Game";
  const site = headers.Site || "Chess.com";
  const date = headers.Date || new Date().toISOString().split("T")[0];
  const white = whitePl?.username || headers.White || "?";
  const black = blackPl?.username || headers.Black || "?";
  const result = headers.Result || "*";

  pgnHeaders.push(`[Event "${event}"]`);
  pgnHeaders.push(`[Site "${site}"]`);
  pgnHeaders.push(`[Date "${date}"]`);
  pgnHeaders.push(`[White "${white}"]`);
  pgnHeaders.push(`[Black "${black}"]`);
  pgnHeaders.push(`[Result "${result}"]`);

  // Add ratings if available
  if (whitePl?.rating || headers.WhiteElo) {
    pgnHeaders.push(`[WhiteElo "${whitePl?.rating || headers.WhiteElo}"]`);
  }
  if (blackPl?.rating || headers.BlackElo) {
    pgnHeaders.push(`[BlackElo "${blackPl?.rating || headers.BlackElo}"]`);
  }

  // Add other headers
  for (const [key, value] of Object.entries(headers)) {
    if (!["Event", "Site", "Date", "White", "Black", "Result", "WhiteElo", "BlackElo"].includes(key)) {
      pgnHeaders.push(`[${key} "${value}"]`);
    }
  }

  // Convert UCI moves to SAN (simplified - just use the UCI format for now)
  // A proper conversion would require replaying the game
  const moveText = formatMovesAsSan(uciMoves);

  return `${pgnHeaders.join("\n")}\n\n${moveText} ${result}`;
}

/**
 * Convert UCI moves to SAN notation by replaying the game
 * This produces proper algebraic notation (Nf3, e4, O-O) instead of coordinate notation (g1f3, e2e4)
 */
function convertUciToSan(uciMoves: string[]): string[] {
  const chess = new Chess();
  const sanMoves: string[] = [];

  for (const uci of uciMoves) {
    if (!uci || uci.length < 4) continue;

    let from = uci.slice(0, 2);
    let to = uci.slice(2, 4);
    const promotion = uci[4];

    // Handle castling notation from Chess.com
    // Chess.com encodes castling as king-takes-rook (e1h1, e1a1, e8h8, e8a8)
    // but chess.js expects standard UCI (e1g1, e1c1, e8g8, e8c8)
    if (from === "e1" && to === "h1") {
      to = "g1"; // White kingside castling
    } else if (from === "e1" && to === "a1") {
      to = "c1"; // White queenside castling
    } else if (from === "e8" && to === "h8") {
      to = "g8"; // Black kingside castling
    } else if (from === "e8" && to === "a8") {
      to = "c8"; // Black queenside castling
    }

    try {
      const moveResult = chess.move({
        from,
        to,
        ...(promotion && { promotion: promotion.toLowerCase() }),
      });

      if (moveResult) {
        sanMoves.push(moveResult.san);
      }
    } catch {
      // Invalid move - stop processing
      console.error(`Invalid UCI move: ${uci}`);
      break;
    }
  }

  return sanMoves;
}

/**
 * Format SAN moves into move pairs with move numbers
 */
function formatMovesAsSan(uciMoves: string[]): string {
  // Convert UCI to SAN first
  const sanMoves = convertUciToSan(uciMoves);

  const parts: string[] = [];

  for (let i = 0; i < sanMoves.length; i++) {
    const move = sanMoves[i];
    if (!move) continue;

    if (i % 2 === 0) {
      // White's move - add move number
      parts.push(`${Math.floor(i / 2) + 1}. ${move}`);
    } else {
      // Black's move
      parts.push(move);
    }
  }

  return parts.join(" ");
}
