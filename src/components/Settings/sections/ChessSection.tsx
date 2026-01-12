import type { ChessConfig, ChessImportConfig } from "../../../../shared/types.js";

interface ChessSectionProps {
  chess: ChessConfig;
  setChess: React.Dispatch<React.SetStateAction<ChessConfig>>;
  chessImport: ChessImportConfig;
  setChessImport: React.Dispatch<React.SetStateAction<ChessImportConfig>>;
}

export function ChessSection({ chess, setChess, chessImport, setChessImport }: ChessSectionProps) {
  return (
    <>
      <div className="settings-section">
        <h3>Chess Engine</h3>

        <div className="settings-field">
          <label htmlFor="engine-depth">Analysis Depth</label>
          <div className="settings-slider-row">
            <input
              type="range"
              id="engine-depth"
              min={10}
              max={30}
              value={chess.engineDepth}
              onChange={(e) =>
                setChess((prev) => ({
                  ...prev,
                  engineDepth: parseInt(e.target.value, 10),
                }))
              }
            />
            <span className="settings-slider-value">{chess.engineDepth}</span>
          </div>
          <p className="settings-hint">
            Higher depth = stronger analysis but slower. Default: 20
          </p>
        </div>

        <div className="settings-field">
          <label htmlFor="multi-pv">Number of Lines</label>
          <div className="settings-slider-row">
            <input
              type="range"
              id="multi-pv"
              min={1}
              max={3}
              value={chess.multiPv}
              onChange={(e) =>
                setChess((prev) => ({
                  ...prev,
                  multiPv: parseInt(e.target.value, 10),
                }))
              }
            />
            <span className="settings-slider-value">{chess.multiPv}</span>
          </div>
          <p className="settings-hint">
            Show multiple candidate moves. More lines = slower analysis.
          </p>
        </div>
      </div>

      <div className="settings-section">
        <h3>Game Import</h3>

        <div className="settings-field">
          <label htmlFor="lichess-username">Lichess Username</label>
          <input
            type="text"
            id="lichess-username"
            value={chessImport.lichessUsername ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setChessImport((prev) => {
                const { lichessUsername: _, ...rest } = prev;
                return value ? { ...rest, lichessUsername: value } : rest;
              });
            }}
            placeholder="Your Lichess username"
          />
          <p className="settings-hint">
            Used to auto-detect your color and flip the board accordingly.
          </p>
        </div>

        <div className="settings-field">
          <label htmlFor="chesscom-username">Chess.com Username</label>
          <input
            type="text"
            id="chesscom-username"
            value={chessImport.chessComUsername ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setChessImport((prev) => {
                const { chessComUsername: _, ...rest } = prev;
                return value ? { ...rest, chessComUsername: value } : rest;
              });
            }}
            placeholder="Your Chess.com username"
          />
          <p className="settings-hint">
            Used to auto-detect your color and flip the board accordingly.
          </p>
        </div>

        <div className="settings-field">
          <label htmlFor="title-format">Note Title Format</label>
          <input
            type="text"
            id="title-format"
            value={chessImport.gameNoteTitleFormat}
            onChange={(e) =>
              setChessImport((prev) => ({
                ...prev,
                gameNoteTitleFormat: e.target.value,
              }))
            }
            placeholder="{me} vs {opponent} {gameId}"
          />
          <p className="settings-hint">
            Variables: {"{me}"}, {"{opponent}"}, {"{white}"}, {"{black}"}, {"{date}"}, {"{gameId}"}, {"{result}"}
          </p>
        </div>
      </div>
    </>
  );
}
