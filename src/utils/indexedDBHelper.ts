class IndexedDBHelper {
    private dbName: string;
    private storeName: string;
    private db: IDBDatabase | null;

    constructor(dbName: string, storeName: string) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.db = null;
    }

    async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName);

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                if (!this.db.objectStoreNames.contains(this.storeName)) {
                    this.db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };

            request.onsuccess = (event: Event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve(this.db);
            };

            request.onerror = (event: Event) => {
                reject(`Database error: ${(event.target as IDBOpenDBRequest).error?.message}`);
            };
        });
    }

    async addData(data: any): Promise<IDBValidKey> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.add(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event: Event) => {
                reject(`Add error: ${(event.target as IDBRequest).error?.message}`);
            };
        });
    }

    async getData(id: IDBValidKey): Promise<any> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event: Event) => {
                reject(`Get error: ${(event.target as IDBRequest).error?.message}`);
            };
        });
    }

    async getAllData(): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readonly');
            const store = transaction.objectStore(this.storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event: Event) => {
                reject(`GetAll error: ${(event.target as IDBRequest).error?.message}`);
            };
        });
    }

    async updateData(data: any): Promise<IDBValidKey> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event: Event) => {
                reject(`Update error: ${(event.target as IDBRequest).error?.message}`);
            };
        });
    }

    async deleteData(id: IDBValidKey): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event: Event) => {
                reject(`Delete error: ${(event.target as IDBRequest).error?.message}`);
            };
        });
    }

    async clearData(): Promise<void> {
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([this.storeName], 'readwrite');
            const store = transaction.objectStore(this.storeName);
            const request = store.clear();

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = (event: Event) => {
                reject(`Clear error: ${(event.target as IDBRequest).error?.message}`);
            };
        });
    }
}

export default IndexedDBHelper;