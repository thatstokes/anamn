import { ipcMain } from "electron";
import { getStockfishEngine } from "../stockfish.js";
import type { EngineAnalysis } from "../../shared/types.js";

export function registerChessHandlers(): void {
  // Analyze a position
  ipcMain.handle(
    "chess:analyze",
    async (_event, fen: string, depth: number = 20): Promise<EngineAnalysis> => {
      const engine = getStockfishEngine();
      return engine.analyze(fen, depth);
    }
  );

  // Stop ongoing analysis
  ipcMain.handle("chess:stopAnalysis", async (): Promise<void> => {
    const engine = getStockfishEngine();
    engine.stop();
  });
}
