let nyantandb = null;
const request = indexedDB.open("NyanTanDB", 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;

    console.log("Database upgrade/creation running...");

    if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata");
    }

    if (!db.objectStoreNames.contains("words")) {
        db.createObjectStore("words", { keyPath: "Id" });
    }

    if (!db.objectStoreNames.contains("kanjis")) {
        db.createObjectStore("kanjis", { keyPath: "Id" });
    }
};

request.onsuccess = function(event) {
    nyantandb = event.target.result;
    console.log("Database opened successfully!");
    console.log("Update from server...");

    sync(nyantandb, () => {
        if (typeof db_sync_words === "function") {
            db_sync_words();
        }
        if (typeof db_sync_kanjis === "function") {
            db_sync_kanjis();
        }
    })
};

request.onerror = function(event) {
    console.error("Database failed to open:", event.target.error);
};

function sync(db, callback) {
    // Step 1: Look up the last sync time from the metadata store
    const tx = db.transaction(["metadata"], "readonly");
    const metaStore = tx.objectStore("metadata");
    const getTimeRequest = metaStore.get(`lastTimeSync`);

    getTimeRequest.onsuccess = function() {
        // Fallback to 0 (ISO string for 1970) if we've never synced before
        const lastSynced = getTimeRequest.result || null;
        console.log("Last sync timestamp was:", lastSynced);

        // Step 2: Request ONLY new data from the server
        // Note the current time right before making the API call
        const currentSyncTime = new Date().toISOString();


        fetch("/api/sync", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                mastered: true,
                LastUpdated: lastSynced,
            })
        })
            .then(response => response.json())
            .then(data => {
                const writeTx = db.transaction(["words", "kanjis", "metadata"], "readwrite");
                const metaStoreToWrite = writeTx.objectStore("metadata");
                metaStoreToWrite.put(data.WordStats, "wordsStats");
                metaStoreToWrite.put(data.KanjiStats, "kanjisStats");

                if (data.Words.length === 0 && data.Kanjis.length === 0) {
                    console.log(`Everything is up to date..`);
                    if (callback) {
                        callback();
                    }
                    return;
                }

                // Step 3: Write new data AND update the timestamp in a single transaction
                const wordsStore = writeTx.objectStore("words");
                const kanjisStore = writeTx.objectStore("kanjis");

                // Loop and save/update each new data
                data.Words.forEach(d => {
                    console.log(d)
                    wordsStore.put(d);
                });
                data.Kanjis.forEach(d => {
                    console.log(d)
                    kanjisStore.put(d);
                });

                // Step 4: Update the timestamp for the NEXT sync
                metaStoreToWrite.put(currentSyncTime, `lastTimeSync`);

                writeTx.oncomplete = function() {
                    console.log(`Successfully synced ${data.Words.length}+${data.Kanjis.length} new entries!`);
                    if (callback) {
                        callback();
                    }
                };

                writeTx.onerror = function(event) {
                    console.error("Transaction error:", event.target.error);
                    if (callback) {
                        callback();
                    }
                };

                writeTx.onabort = function(event) {
                    console.error("Transaction aborted:", event.target.error);
                    if (callback) {
                        callback();
                    }
                };
            })
            .catch(err => {
                console.error("Sync failed:", err);
                if (callback) {
                    callback();
                }
            });
    }
}
