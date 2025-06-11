import { AppState, UserPreferences, RecentFile, PDFDocument } from '../types/index.js';
import { StorageManager } from '../utils/storageManager.js';

export class StateManager {
  private state: AppState;
  private listeners: Map<string, Set<Function>> = new Map();
  private storageManager: StorageManager;

  constructor() {
    this.storageManager = new StorageManager();
    this.state = this.initializeState();
    this.loadPersistedState();
  }

  private initializeState(): AppState {
    return {
      currentDocument: null,
      isLoading: false,
      error: null,
      theme: 'auto',
      userPreferences: {
        defaultTheme: {
          theme: 'dark',
          brightness: 100,
          contrast: 100,
          scale: 1.5
        },
        autoSave: true,
        showTutorial: true,
        language: 'en',
        accessibility: {
          highContrast: false,
          largeText: false,
          reduceMotion: false,
          screenReader: false
        }
      },
      recentFiles: []
    };
  }

  private async loadPersistedState(): Promise<void> {
    try {
      const preferences = await this.storageManager.getItem<UserPreferences>('userPreferences');
      const recentFiles = await this.storageManager.getItem<RecentFile[]>('recentFiles');
      const theme = await this.storageManager.getItem<string>('theme');

      if (preferences) {
        this.state.userPreferences = { ...this.state.userPreferences, ...preferences };
      }
      if (recentFiles) {
        this.state.recentFiles = recentFiles;
      }
      if (theme) {
        this.state.theme = theme as 'light' | 'dark' | 'auto';
      }

      this.notifyListeners('stateLoaded');
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
    }
  }

  public getState(): Readonly<AppState> {
    return { ...this.state };
  }

  public setState(updates: Partial<AppState>): void {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    this.persistState(updates);
    this.notifyListeners('stateChanged', { previous: previousState, current: this.state });
  }

  public setCurrentDocument(document: PDFDocument | null): void {
    this.setState({ currentDocument: document });
  }

  public setLoading(isLoading: boolean): void {
    this.setState({ isLoading });
  }

  public setError(error: string | null): void {
    this.setState({ error });
  }

  public updateUserPreferences(preferences: Partial<UserPreferences>): void {
    const updatedPreferences = { ...this.state.userPreferences, ...preferences };
    this.setState({ userPreferences: updatedPreferences });
  }

  public addRecentFile(file: RecentFile): void {
    const recentFiles = [file, ...this.state.recentFiles.filter(f => f.id !== file.id)].slice(0, 10);
    this.setState({ recentFiles });
  }

  public removeRecentFile(fileId: string): void {
    const recentFiles = this.state.recentFiles.filter(f => f.id !== fileId);
    this.setState({ recentFiles });
  }

  public subscribe(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private notifyListeners(event: string, data?: any): void {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in state listener for ${event}:`, error);
      }
    });
  }

  private async persistState(updates: Partial<AppState>): Promise<void> {
    try {
      if (updates.userPreferences) {
        await this.storageManager.setItem('userPreferences', updates.userPreferences);
      }
      if (updates.recentFiles) {
        await this.storageManager.setItem('recentFiles', updates.recentFiles);
      }
      if (updates.theme) {
        await this.storageManager.setItem('theme', updates.theme);
      }
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }

  public async clearPersistedState(): Promise<void> {
    try {
      await this.storageManager.clear();
      this.state = this.initializeState();
      this.notifyListeners('stateCleared');
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
    }
  }
}

// Singleton instance
export const stateManager = new StateManager();