import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StateManager } from '../../core/stateManager.js';

describe('StateManager', () => {
  let stateManager: StateManager;

  beforeEach(() => {
    stateManager = new StateManager();
  });

  it('should initialize with default state', () => {
    const state = stateManager.getState();
    
    expect(state.currentDocument).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.theme).toBe('auto');
    expect(state.recentFiles).toEqual([]);
  });

  it('should update state correctly', () => {
    const mockDocument = { getPageCount: () => 5 };
    
    stateManager.setCurrentDocument(mockDocument as any);
    
    const state = stateManager.getState();
    expect(state.currentDocument).toBe(mockDocument);
  });

  it('should notify listeners on state change', () => {
    const listener = vi.fn();
    
    stateManager.subscribe('stateChanged', listener);
    stateManager.setLoading(true);
    
    expect(listener).toHaveBeenCalled();
  });

  it('should manage recent files correctly', () => {
    const file = {
      id: '1',
      name: 'test.pdf',
      size: 1000,
      lastModified: new Date()
    };
    
    stateManager.addRecentFile(file);
    
    const state = stateManager.getState();
    expect(state.recentFiles).toContain(file);
  });

  it('should limit recent files to 10', () => {
    for (let i = 0; i < 15; i++) {
      stateManager.addRecentFile({
        id: i.toString(),
        name: `test${i}.pdf`,
        size: 1000,
        lastModified: new Date()
      });
    }
    
    const state = stateManager.getState();
    expect(state.recentFiles).toHaveLength(10);
  });
});