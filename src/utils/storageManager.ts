import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AppDB extends DBSchema {
  preferences: {
    key: string;
    value: any;
  };
  files: {
    key: string;
    value: {
      id: string;
      name: string;
      data: Uint8Array;
      metadata: any;
      timestamp: number;
    };
  };
  cache: {
    key: string;
    value: {
      key: string;
      data: any;
      timestamp: number;
      expiresAt?: number;
    };
  };
}

export class StorageManager {
  private db: IDBPDatabase<AppDB> | null = null;
  private readonly DB_NAME = 'LitasDarkDB';
  private readonly DB_VERSION = 1;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    try {
      this.db = await openDB<AppDB>(this.DB_NAME, this.DB_VERSION, {
        upgrade(db) {
          // Preferences store
          if (!db.objectStoreNames.contains('preferences')) {
            db.createObjectStore('preferences');
          }

          // Files store for temporary storage
          if (!db.objectStoreNames.contains('files')) {
            const filesStore = db.createObjectStore('files');
            filesStore.createIndex('timestamp', 'timestamp');
          }

          // Cache store
          if (!db.objectStoreNames.contains('cache')) {
            const cacheStore = db.createObjectStore('cache');
            cacheStore.createIndex('timestamp', 'timestamp');
            cacheStore.createIndex('expiresAt', 'expiresAt');
          }
        },
      });
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error);
      // Fallback to localStorage
    }
  }

  public async setItem<T>(key: string, value: T): Promise<void> {
    try {
      if (this.db) {
        await this.db.put('preferences', value, key);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Failed to set item:', error);
      throw new Error(`Storage error: ${error.message}`);
    }
  }

  public async getItem<T>(key: string): Promise<T | null> {
    try {
      if (this.db) {
        const value = await this.db.get('preferences', key);
        return value || null;
      } else {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      }
    } catch (error) {
      console.error('Failed to get item:', error);
      return null;
    }
  }

  public async removeItem(key: string): Promise<void> {
    try {
      if (this.db) {
        await this.db.delete('preferences', key);
      } else {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  }

  public async clear(): Promise<void> {
    try {
      if (this.db) {
        await this.db.clear('preferences');
        await this.db.clear('files');
        await this.db.clear('cache');
      } else {
        localStorage.clear();
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }

  public async storeFile(id: string, name: string, data: Uint8Array, metadata: any = {}): Promise<void> {
    if (!this.db) throw new Error('Database not available');

    try {
      await this.db.put('files', {
        id,
        name,
        data,
        metadata,
        timestamp: Date.now()
      }, id);
    } catch (error) {
      console.error('Failed to store file:', error);
      throw new Error(`File storage error: ${error.message}`);
    }
  }

  public async getFile(id: string): Promise<{ name: string; data: Uint8Array; metadata: any } | null> {
    if (!this.db) return null;

    try {
      const file = await this.db.get('files', id);
      return file ? { name: file.name, data: file.data, metadata: file.metadata } : null;
    } catch (error) {
      console.error('Failed to get file:', error);
      return null;
    }
  }

  public async removeFile(id: string): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.delete('files', id);
    } catch (error) {
      console.error('Failed to remove file:', error);
    }
  }

  public async cacheData(key: string, data: any, ttlMs?: number): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.put('cache', {
        key,
        data,
        timestamp: Date.now(),
        expiresAt: ttlMs ? Date.now() + ttlMs : undefined
      }, key);
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  public async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.db) return null;

    try {
      const cached = await this.db.get('cache', key);
      if (!cached) return null;

      if (cached.expiresAt && Date.now() > cached.expiresAt) {
        await this.db.delete('cache', key);
        return null;
      }

      return cached.data;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  public async cleanupExpiredCache(): Promise<void> {
    if (!this.db) return;

    try {
      const tx = this.db.transaction('cache', 'readwrite');
      const index = tx.store.index('expiresAt');
      const range = IDBKeyRange.upperBound(Date.now());
      
      for await (const cursor of index.iterate(range)) {
        await cursor.delete();
      }
    } catch (error) {
      console.error('Failed to cleanup expired cache:', error);
    }
  }

  public async getStorageUsage(): Promise<{ used: number; quota: number }> {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          used: estimate.usage || 0,
          quota: estimate.quota || 0
        };
      }
    } catch (error) {
      console.error('Failed to get storage usage:', error);
    }

    return { used: 0, quota: 0 };
  }
}