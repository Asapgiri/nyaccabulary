import { WordDB } from "../db/words";
import { KanjiDB } from "../db/kanjis";
import { apiFetch } from "../api.ts";

async function raw_update(type, word, fun, t_body, onUpdate, select) {
    const response = await apiFetch(`/api/${type}/${word.Id}/${fun}`, {method: "POST", body: JSON.stringify(t_body)})
    const data = await response.json()
    console.log(data)
    if (onUpdate) onUpdate(data)
    if (select) select(data)
    return data
}

export async function raw_word_update(word, fun, t_body, onUpdate, select) {
    // FIXME: Add quick update, before actual save
    // Should also block the update buttons for a word while at it..
    WordDB.put(await raw_update('word', word, fun, t_body, onUpdate, select))
}

export async function raw_kanji_update(word, fun, t_body, onUpdate, select) {
    // FIXME: Add quick update, before actual save
    // Should also block the update buttons for a word while at it..
    KanjiDB.put(await raw_update('kanji', word, fun, t_body, onUpdate, select))
}
