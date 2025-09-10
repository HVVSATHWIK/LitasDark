/**
 * State Management for LitasDark Application
 */
export class StateManager {
  constructor() {
    this.state = {
      currentDocument: null,
      isLoading: false,
      error: null,
      theme: 'auto',
      recentFiles: [],
      preferences: {
        autoSave: true,
        compressionLevel: 'medium',
        maxRecentFiles: 10
      }
    };
    
    this.listeners = new Map();
    this.maxRecentFiles = 10;
  }

  /**
   * Get current application state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set current document
   * @param {Object} document - PDF document
   */
  setCurrentDocument(document) {
    this.setState({ currentDocument: document });
  }

  /**
   * Set loading state
   * @param {boolean} isLoading - Loading state
   */
  setLoading(isLoading) {
    this.setState({ isLoading });
  }

  /**
   * Set error state
   * @param {string|null} error - Error message
   */
  setError(error) {
    this.setState({ error });
  }

  /**
   * Set theme
   * @param {string} theme - Theme name
   */
  setTheme(theme) {
    this.setState({ theme });
  }

  /**
   * Add file to recent files list
   * @param {Object} file - File information
   */
  addRecentFile(file) {
    const recentFiles = [...this.state.recentFiles];
    
    // Remove existing entry if present
    const existingIndex = recentFiles.findIndex(f => f.id === file.id);
    if (existingIndex > -1) {
      recentFiles.splice(existingIndex, 1);
    }
    
    // Add to beginning
    recentFiles.unshift(file);
    
    // Limit to max files
    if (recentFiles.length > this.maxRecentFiles) {
      recentFiles.splice(this.maxRecentFiles);
    }
    
    this.setState({ recentFiles });
  }

  /**
   * Remove file from recent files
   * @param {string} fileId - File ID to remove
   */
  removeRecentFile(fileId) {
    const recentFiles = this.state.recentFiles.filter(f => f.id !== fileId);
    this.setState({ recentFiles });
  }

  /**
   * Clear recent files
   */
  clearRecentFiles() {
    this.setState({ recentFiles: [] });
  }

  /**
   * Update state and notify listeners
   * @param {Object} updates - State updates
   */
  setState(updates) {
    const previousState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    this.notifyListeners('stateChanged', this.state, previousState);
  }

  /**
   * Subscribe to state changes
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  subscribe(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  /**
   * Unsubscribe from state changes
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  unsubscribe(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name
   * @param {...any} args - Arguments to pass to listeners
   */
  notifyListeners(event, ...args) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in listener for event ${event}:`, error);
        }
      });
    }
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this.state = {
      currentDocument: null,
      isLoading: false,
      error: null,
      theme: 'auto',
      recentFiles: [],
      preferences: {
        autoSave: true,
        compressionLevel: 'medium',
        maxRecentFiles: 10
      }
    };
    
    this.notifyListeners('stateChanged', this.state);
  }

  /**
   * Save state to localStorage
   */
  saveToStorage() {
    try {
      const stateToSave = {
        theme: this.state.theme,
        recentFiles: this.state.recentFiles,
        preferences: this.state.preferences
      };
      localStorage.setItem('litasdark-state', JSON.stringify(stateToSave));
    } catch (error) {
      console.warn('Failed to save state to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('litasdark-state');
      if (saved) {
        const parsedState = JSON.parse(saved);
        this.setState({
          theme: parsedState.theme || 'auto',
          recentFiles: parsedState.recentFiles || [],
          preferences: { ...this.state.preferences, ...parsedState.preferences }
        });
      }
    } catch (error) {
      console.warn('Failed to load state from localStorage:', error);
    }
  }
}