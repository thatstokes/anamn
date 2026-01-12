// Stockfish chess engine wrapper for Electron main process
// Uses nmrugg/stockfish.js which runs in Node.js

import type { EngineAnalysis, EngineLine } from "../shared/types.js";
import path from "path";
import fs from "fs";
import { app } from "electron";

// Get the correct base directory depending on whether we're packaged
function getStockfishDir(): string {
  if (app.isPackaged) {
    // In packaged app, stockfish is in resources
    return path.join(process.resourcesPath, "stockfish", "src");
  } else {
    // In development, use node_modules
    return path.join(app.getAppPath(), "node_modules", "stockfish", "src");
  }
}

interface StockfishEngine {
  listener: ((message: string) => void) | null;
  sendCommand: (cmd: string) => void;
  terminate: () => void;
  ccall: (name: string, returnType: null, argTypes: string[], args: unknown[], options?: { async?: boolean }) => void;
}

class StockfishWrapper {
  private engine: StockfishEngine | null = null;
  private initialized = false;
  private initializing: Promise<void> | null = null;
  private analyzing = false;
  private currentResolve: ((analysis: EngineAnalysis) => void) | null = null;
  private currentAnalysis: Partial<EngineAnalysis> = {};
  private currentLines: Map<number, EngineLine> = new Map(); // MultiPV lines by index
  private currentMultiPv = 1;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initializing) return this.initializing;

    this.initializing = this._doInitialize();
    return this.initializing;
  }

  private async _doInitialize(): Promise<void> {
    try {
      // Find the engine files
      const engineDir = getStockfishDir();
      const symlinkPath = path.join(engineDir, "stockfish.js");

      let pathToEngine: string;
      try {
        const linkTarget = fs.readlinkSync(symlinkPath);
        pathToEngine = path.join(engineDir, linkTarget);
      } catch {
        // Fallback to lite single-threaded version
        const files = fs.readdirSync(engineDir);
        const engineFile = files.find(f => f.includes("lite-single") && f.endsWith(".js"));
        if (!engineFile) {
          throw new Error("Could not find stockfish engine file");
        }
        pathToEngine = path.join(engineDir, engineFile);
      }

      const ext = path.extname(pathToEngine);
      const basepath = pathToEngine.slice(0, -ext.length);
      const wasmPath = basepath + ".wasm";

      console.log("[Stockfish] Loading engine from:", pathToEngine);

      // Dynamic require of the engine module
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const INIT_ENGINE = require(pathToEngine);

      const engineConfig = {
        locateFile: (p: string) => {
          if (p.includes(".wasm")) return wasmPath;
          return pathToEngine;
        },
      };

      // Initialize the engine
      const factory = INIT_ENGINE();
      const engine = await factory(engineConfig) as StockfishEngine;

      // Set up the command sender
      engine.sendCommand = (cmd: string) => {
        setImmediate(() => {
          engine.ccall("command", null, ["string"], [cmd], { async: /^go\b/.test(cmd) });
        });
      };

      // Set up the message listener
      engine.listener = this.handleMessage.bind(this);

      this.engine = engine;

      // Initialize UCI
      engine.sendCommand("uci");

      // Wait for uciok
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("UCI init timeout")), 10000);
        const originalListener = this.handleMessage.bind(this);
        engine.listener = (msg: string) => {
          originalListener(msg);
          if (msg === "uciok") {
            clearTimeout(timeout);
            engine.listener = originalListener;
            resolve();
          }
        };
      });

      // Set reasonable defaults
      engine.sendCommand("setoption name Hash value 64");
      engine.sendCommand("isready");

      // Wait for readyok
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Ready timeout")), 10000);
        const originalListener = this.handleMessage.bind(this);
        engine.listener = (msg: string) => {
          originalListener(msg);
          if (msg === "readyok") {
            clearTimeout(timeout);
            engine.listener = originalListener;
            resolve();
          }
        };
      });

      this.initialized = true;
      console.log("[Stockfish] Engine initialized successfully");
    } catch (error) {
      console.error("[Stockfish] Failed to initialize:", error);
      this.initializing = null;
      throw error;
    }
  }

  private handleMessage(message: unknown): void {
    // Skip non-string messages
    if (typeof message !== "string") return;

    // Parse info lines during analysis
    if (this.analyzing && message.startsWith("info depth")) {
      const { lineIndex, line, depth } = this.parseInfo(message);

      // Store this line
      if (line) {
        this.currentLines.set(lineIndex, line);
      }

      // Update depth
      if (depth !== undefined) {
        this.currentAnalysis.depth = depth;
      }

      // Update primary analysis from first line
      const firstLine = this.currentLines.get(1);
      if (firstLine) {
        this.currentAnalysis.score = firstLine.score;
        this.currentAnalysis.mate = firstLine.mate;
        this.currentAnalysis.pv = firstLine.pv;
      }
    }

    // Parse bestmove
    if (this.analyzing && message.startsWith("bestmove")) {
      const bestMove = this.parseBestMove(message);
      this.currentAnalysis.bestMove = bestMove;

      this.analyzing = false;

      // Collect all lines in order
      const lines: EngineLine[] = [];
      for (let i = 1; i <= this.currentMultiPv; i++) {
        const line = this.currentLines.get(i);
        if (line) {
          lines.push(line);
        }
      }

      if (this.currentResolve) {
        this.currentResolve({
          score: this.currentAnalysis.score ?? 0,
          mate: this.currentAnalysis.mate ?? null,
          bestMove: this.currentAnalysis.bestMove ?? "",
          pv: this.currentAnalysis.pv ?? [],
          depth: this.currentAnalysis.depth ?? 0,
          lines,
        });
        this.currentResolve = null;
      }
    }
  }

  private parseInfo(message: string): { lineIndex: number; line: EngineLine | null; depth: number | undefined } {
    // Extract multipv index (defaults to 1)
    const multipvMatch = message.match(/multipv (\d+)/);
    const lineIndex = multipvMatch && multipvMatch[1] ? parseInt(multipvMatch[1], 10) : 1;

    // Extract depth
    const depthMatch = message.match(/depth (\d+)/);
    const depth = depthMatch && depthMatch[1] ? parseInt(depthMatch[1], 10) : undefined;

    // Extract score (centipawns or mate)
    let score = 0;
    let mate: number | null = null;

    const cpMatch = message.match(/score cp (-?\d+)/);
    if (cpMatch && cpMatch[1]) {
      score = parseInt(cpMatch[1], 10);
    }

    const mateMatch = message.match(/score mate (-?\d+)/);
    if (mateMatch && mateMatch[1]) {
      mate = parseInt(mateMatch[1], 10);
      score = mate > 0 ? 10000 : -10000;
    }

    // Extract principal variation
    const pvMatch = message.match(/ pv (.+)$/);
    const pv = pvMatch && pvMatch[1] ? pvMatch[1].split(" ") : [];

    // Only return a line if we have a PV
    if (pv.length === 0) {
      return { lineIndex, line: null, depth };
    }

    return {
      lineIndex,
      line: { score, mate, pv },
      depth,
    };
  }

  private parseBestMove(line: string): string {
    const match = line.match(/bestmove (\S+)/);
    return match && match[1] ? match[1] : "";
  }

  async analyze(fen: string, depth: number = 20, multiPv: number = 1): Promise<EngineAnalysis> {
    if (!this.initialized || !this.engine) {
      await this.initialize();
    }

    if (!this.engine) {
      throw new Error("Engine not initialized");
    }

    // Stop any ongoing analysis
    if (this.analyzing) {
      this.stop();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.analyzing = true;
    this.currentAnalysis = {};
    this.currentLines.clear();
    this.currentMultiPv = Math.max(1, Math.min(5, multiPv)); // Clamp between 1-5

    return new Promise((resolve) => {
      this.currentResolve = resolve;

      // Set MultiPV option
      this.engine!.sendCommand(`setoption name MultiPV value ${this.currentMultiPv}`);
      this.engine!.sendCommand(`position fen ${fen}`);
      this.engine!.sendCommand(`go depth ${depth}`);
    });
  }

  stop(): void {
    if (this.engine && this.analyzing) {
      this.engine.sendCommand("stop");
    }
  }

  destroy(): void {
    if (this.engine) {
      this.engine.sendCommand("quit");
      this.engine.terminate();
      this.engine = null;
      this.initialized = false;
      this.initializing = null;
    }
  }
}

// Singleton instance
let engineInstance: StockfishWrapper | null = null;

export function getStockfishEngine(): StockfishWrapper {
  if (!engineInstance) {
    engineInstance = new StockfishWrapper();
  }
  return engineInstance;
}

export function destroyStockfishEngine(): void {
  if (engineInstance) {
    engineInstance.destroy();
    engineInstance = null;
  }
}
