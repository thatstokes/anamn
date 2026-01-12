import { useState, useEffect } from 'react';
import { ChessViewer } from './ChessViewer.js';
import { useUI } from '../../state/contexts/UIContext.js';

interface LichessEmbedProps {
  url: string;
}

export function LichessEmbed({ url }: LichessEmbedProps) {
  const { chessImportConfig } = useUI();
  const [pgn, setPgn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shouldFlip, setShouldFlip] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        setError(null);

        const gameData = await window.api.chessImport.fetchGame(url.trim());
        setPgn(gameData.pgn);

        // Check if user is black based on configured username
        const username = chessImportConfig?.lichessUsername;
        if (username) {
          const isBlack = username.toLowerCase() === gameData.black.username.toLowerCase();
          setShouldFlip(isBlack);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch game');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [url, chessImportConfig?.lichessUsername]);

  if (loading) {
    return (
      <div className="chess-embed-loading">
        Loading game from Lichess...
      </div>
    );
  }

  if (error) {
    return (
      <div className="chess-embed-error">
        <span>Failed to load Lichess game: {error}</span>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open on Lichess
        </a>
      </div>
    );
  }

  if (!pgn) {
    return null;
  }

  return <ChessViewer pgn={pgn} defaultFlipped={shouldFlip} />;
}
