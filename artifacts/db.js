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

    sync(nyantandb, "/api/word/paged", "words", () => {
        if (typeof db_sync_words === "function") {
            db_sync_words();
        }
    })
    sync(nyantandb, "/api/kanji/paged", "kanjis", () => {
        if (typeof db_sync_kanjis === "function") {
            db_sync_kanjis();
        }
    })
};

request.onerror = function(event) {
    console.error("Database failed to open:", event.target.error);
};

function sync(db, url, stype, callback) {
    // Step 1: Look up the last sync time from the metadata store
    const tx = db.transaction(["metadata"], "readonly");
    const metaStore = tx.objectStore("metadata");
    const getTimeRequest = metaStore.get(`lastTimeSync-${stype}`);

    getTimeRequest.onsuccess = function() {
        // Fallback to 0 (ISO string for 1970) if we've never synced before
        const lastSynced = getTimeRequest.result || new Date(0).toISOString();
        console.log("Last sync timestamp was:", lastSynced);

        // Step 2: Request ONLY new data from the server
        // Note the current time right before making the API call
        const currentSyncTime = new Date().toISOString();


        fetch(url, {
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
                if (data.Data.length === 0) {
                    console.log(`Everything is up to date. No new ${stype}.`);
                    if (callback) {
                        callback();
                    }
                    return;
                }

                // Step 3: Write new data AND update the timestamp in a single transaction
                const writeTx = db.transaction([stype, "metadata"], "readwrite");
                const dataStore = writeTx.objectStore(stype);
                const metaStoreToWrite = writeTx.objectStore("metadata");

                // Loop and save/update each new data
                data.Data.forEach(d => {
                    console.log(d)
                    dataStore.put(d); // 'put' inserts if new, updates if exists
                });

                // Step 4: Update the timestamp for the NEXT sync
                metaStoreToWrite.put(currentSyncTime, `lastTimeSync-${stype}`);
                metaStoreToWrite.put(data.Stats, stype+"Stats");

                writeTx.oncomplete = function() {
                    console.log(`Successfully synced ${data.Data.length} new entries!`);
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
