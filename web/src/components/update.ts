import { WordDB } from "../db/words";
import { KanjiDB } from "../db/kanjis";
import { apiFetch } from "../api.ts";

async function raw_update(type, word, fun, t_body, onUpdate, select) {
    const response = await apiFetch(`/api/${type}/${word.Id}/${fun}`, {method: "POST", body: JSON.stringify(t_body)})
    const data = await response.json()
    if (onUpdate) onUpdate(data, word.Id)
    if (select) select(data)
    return data
}

export async function raw_word_update(word, fun: string, t_body: any, onUpdate: any, select: any, ddelete: boolean | null) {
    // FIXME: Add quick update, before actual save
    // Should also block the update buttons for a word while at it..
    const update = await raw_update('word', word, fun, t_body, onUpdate, select)
    if (ddelete) {
        WordDB.delete(word.Id)
    }
    else {
        WordDB.put(update)
    }
    return update
}

export async function raw_kanji_update(word, fun: string, t_body: any, onUpdate: any, select: any, ddelete: boolean | null) {
    // FIXME: Add quick update, before actual save
    // Should also block the update buttons for a word while at it..
    const update = await raw_update('kanji', word, fun, t_body, onUpdate, select)
    if (ddelete) {
        KanjiDB.delete(word.Id)
    }
    else {
        KanjiDB.put(update)
    }
    return update
}
