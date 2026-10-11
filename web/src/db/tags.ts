import { apiFetch } from "../api.ts";
import { dbPromise } from "./database";

export interface Tag {
    Id:          string
    Date:        string
    LastUpdated: string
    Name:        string
    Color:       string
}

export interface TagAddRequest {
    Name:  string
    Color: string
}

async function post(id: string, action: string, body?: unknown): Promise<Tag> {
    const response = await apiFetch(`/api/tag/${id}/${action}`, {
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

export function publishTags(tags: Tag[]) {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent<Tag[]>("nyaccabulary:tags", { detail: tags }));
    }
}

export const TagAPI = {

    async create(body: TagAddRequest): Promise<Tag> {
        const response = await apiFetch("/api/tag/add", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        if (!response.ok) throw new Error(await response.text());
        const tag: Tag = await response.json();
        await TagDB.put(tag);
        publishTags(await TagDB.getAll());
        return tag;
    },

    update(id: string, body: TagAddRequest) {
        return post(id, "update", body);
    },

    delete(id: string) {
        return apiFetch(`/api/tag/delete/${id}`, {
            method: "POST",
        });
    },
};

export const TagDB = {

    async getAll(): Promise<Tag[]> {
        const db = await dbPromise;
        return db.getAll("tags");
    },

    async get(id: string): Promise<Tag | undefined> {
        const db = await dbPromise;
        return db.get("tags", id);
    },

    async put(tag: Tag): Promise<void> {
        const db = await dbPromise;
        await db.put("tags", tag);
    },

    async delete(id: string): Promise<void> {
        const db = await dbPromise;
        await db.delete("tags", id);
    },
};
