import { dbPromise } from "./database";

export async function sync() {
    const db = await dbPromise;

    const lastSync = (await db.get("metadata", "lastTimeSync")) ?? null;

    const currentSyncTime = new Date().toISOString();

    const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            mastered: true,
            LastUpdated: lastSync,
        }),
    });

    const data = await response.json();

    const tx = db.transaction(
        ["words", "kanjis", "metadata"],
        "readwrite"
    );

    const md = tx.objectStore("metadata")
    md.put(data.WordStats, "wordsStats")
    md.put(data.KanjiStats, "kanjisStats")

    for (const word of data.Words) {
        tx.objectStore("words").put(word);
    }

    for (const kanji of data.Kanjis) {
        tx.objectStore("kanjis").put(kanji);
    }

    tx.objectStore("metadata").put(
        currentSyncTime,
        "lastTimeSync"
    );

    await tx.done;
}
