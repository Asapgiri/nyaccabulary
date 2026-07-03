import { apiFetch } from "../api.ts";

export interface Stats {
    Mastered:   number
    Learning:   number
    Count:      number
    Order:      string
}

export interface Kanji {
    Id:              string
    Date:            string
    Kanji:           string
    On:              string[]
    Kun:             string[]
    Meaning:         string[]
    Knows:           number
    DontKnows:       number
    LastShown:       string
    Status:          string
    DictForm:        any
    Words:           string[]
}

async function post(id: string, action: string, body?: unknown): Promise<Kanji> {
    const response = await apiFetch(`/api/kanji/${id}/${action}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}

export const KanjiAPI = {

    create(body: {
        kanji: string;
        kana: string;
        meaning: string;
    }) {
        return apiFetch("/api/kanji", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }).then(r => r.json());
    },

    mark(id: string) {
        return post(id, "set");
    },

    mastered(id: string) {
        return post(id, "force");
    },

    unmaster(id: string) {
        return post(id, "unset");
    },

    update(id: string, body: unknown) {
        return post(id, "update", body);
    },

    removeNew(id: string) {
        return post(id, "new");
    },

    async delete(id: string) {
        await apiFetch(`/api/kanji/${id}/delete`, {
            method: "POST",
        });
    }
};

import { dbPromise } from "./database";

export const KanjiDB = {
    async getStats(): Promise<Stats> {
        const db = await dbPromise;
        return db.get("metadata", "kanjisStats");
    },

    async getAll(): Promise<Kanji[]> {
        const db = await dbPromise;
        return db.getAll("kanjis");
    },

    async get(id: string): Promise<Kanji | undefined> {
        const db = await dbPromise;
        return db.get("kanjis", id);
    },

    async put(kanji: Kanji): Promise<void> {
        const db = await dbPromise;
        await db.put("kanjis", kanji);
    },

    async delete(id: string): Promise<void> {
        const db = await dbPromise;
        await db.delete("kanjis", id);
    }
};
