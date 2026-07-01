export interface Word {
    Id:              string
    Date:            string
    Kanji:           string
    Kana:            string
    Meaning:         string
    Knows:           number
    DontKnows:       number
    Status:          string
    LastShown:       string
    DictForm:        any
    Kanjis:          string[]
}

async function post(id: string, action: string, body?: unknown): Promise<Word> {
    const response = await fetch(`/api/word/${id}/${action}`, {
        method: "POST",
        credentials: "include",
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

export const WordAPI = {

    create(body: {
        kanji: string;
        kana: string;
        meaning: string;
    }) {
        return fetch("/api/word", {
            method: "POST",
            credentials: "include",
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
        await fetch(`/api/word/${id}/delete`, {
            method: "POST",
            credentials: "include",
        });
    }
};

import { dbPromise } from "./database";

export const WordDB = {
    async getAll(): Promise<Word[]> {
        const db = await dbPromise;
        return db.getAll("words");
    },

    async get(id: string): Promise<Word | undefined> {
        const db = await dbPromise;
        return db.get("words", id);
    },

    async put(word: Word): Promise<void> {
        const db = await dbPromise;
        await db.put("words", word);
    },

    async delete(id: string): Promise<void> {
        const db = await dbPromise;
        await db.delete("words", id);
    }
};
