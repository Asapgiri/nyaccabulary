import { deleteDB, openDB } from "idb";

export const dbPromise = openDB("NyanTanDB", 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains("metadata")) {
            db.createObjectStore("metadata");
        }

        if (!db.objectStoreNames.contains("words")) {
            db.createObjectStore("words", {
                keyPath: "Id",
            });
        }

        if (!db.objectStoreNames.contains("kanjis")) {
            db.createObjectStore("kanjis", {
                keyPath: "Id",
            });
        }
    },
});

export async function dbDrop() {
    if (dbPromise) {
        const db = await dbPromise;
        db.close();
    }
    return await deleteDB("NyanTanDB");
}
