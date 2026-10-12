// =====================================================================
// CONSTRUKORE DIÁRIO DE OBRA — SERVIÇO DE ARMAZENAMENTO INDEXEDDB
// Gerenciamento de Fotos e Áudios Pesados sem Estouro do LocalStorage
// =====================================================================

const DB_NAME = 'construkore_rdo_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_blobs';

export interface StoredMediaItem {
  id: string;
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
}

export class MediaStorageService {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDb(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB não suportado neste navegador.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Converte base64 dataURL para Blob
   */
  public static dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(';base64,');
    const contentType = parts[0]?.split(':')[1] || 'image/jpeg';
    const raw = window.atob(parts[1] || '');
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }

  /**
   * Salva mídia em IndexedDB e retorna uma Object URL reutilizável
   */
  public static async saveMedia(id: string, dataUrlOrBlob: string | Blob): Promise<string> {
    try {
      const db = await this.getDb();
      let blob: Blob;
      let mimeType = 'image/jpeg';

      if (typeof dataUrlOrBlob === 'string') {
        if (dataUrlOrBlob.startsWith('data:')) {
          blob = this.dataUrlToBlob(dataUrlOrBlob);
          mimeType = blob.type;
        } else {
          // Se for URL externa (http/https), não precisa salvar no IndexedDB
          return dataUrlOrBlob;
        }
      } else {
        blob = dataUrlOrBlob;
        mimeType = blob.type;
      }

      return new Promise<string>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const item: StoredMediaItem = {
          id,
          blob,
          mimeType,
          sizeBytes: blob.size,
          createdAt: new Date().toISOString(),
        };

        const req = store.put(item);
        req.onsuccess = () => {
          const blobUrl = URL.createObjectURL(blob);
          resolve(blobUrl);
        };
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      console.warn('[MediaStorageService] Falha ao persistir em IndexedDB:', err);
      // Fallback seguro: se falhar, retorna o que recebeu
      return typeof dataUrlOrBlob === 'string' ? dataUrlOrBlob : URL.createObjectURL(dataUrlOrBlob);
    }
  }

  /**
   * Carrega uma mídia do IndexedDB
   */
  public static async getMediaUrl(id: string): Promise<string | null> {
    try {
      const db = await this.getDb();
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(id);

        req.onsuccess = () => {
          const result = req.result as StoredMediaItem | undefined;
          if (result && result.blob) {
            resolve(URL.createObjectURL(result.blob));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  /**
   * Gera uma miniatura ultra-leve (JPEG ~15KB) a partir de uma imagem base64
   * para salvar no localStorage sem consumir cota
   */
  public static async generateThumbnail(dataUrl: string, maxDim: number = 320): Promise<string> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') return resolve(dataUrl);

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(dataUrl);

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}
