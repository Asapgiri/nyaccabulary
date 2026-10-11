import { useEffect, useState } from "react";

const writingCache = new Map<string, Promise<string>>();

function loadWriting(character: string): Promise<string> {
    const cached = writingCache.get(character);
    if (cached) return cached;

    const codepoint = character.codePointAt(0);
    if (!codepoint) return Promise.reject(new Error("Missing character"));
    const filename = codepoint.toString(16).padStart(5, "0");
    const request = fetch(`https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${filename}.svg`)
        .then(response => {
            if (!response.ok) throw new Error("Writing guide not found");
            return response.text();
        })
        .then(source => {
            const document = new DOMParser().parseFromString(source, "image/svg+xml");
            if (document.querySelector("parsererror")) throw new Error("Invalid writing guide");
            const strokeGroup = document.querySelector('g[id^="kvg:StrokePaths"]');
            if (!strokeGroup) throw new Error("No stroke paths found");

            const group = strokeGroup.cloneNode(true) as SVGGElement;
            const paths = Array.from(group.querySelectorAll("path"));
            if (!paths.length) throw new Error("No strokes found");
            paths.forEach((path, index) => {
                path.setAttribute("pathLength", "1");
                path.setAttribute("data-writing-stroke", String(index));
                path.style.animationDelay = `${index * 0.48}s`;
            });
            return new XMLSerializer().serializeToString(group);
        })
        .catch(error => {
            writingCache.delete(character);
            throw error;
        });
    writingCache.set(character, request);
    return request;
}

export default function KanjiWriting({ character }: { character: string }) {
    const [markup, setMarkup] = useState("");
    const [failed, setFailed] = useState(false);
    const [play, setPlay] = useState(0);

    useEffect(() => {
        let active = true;
        setMarkup("");
        setFailed(false);
        setPlay(0);
        if (Array.from(character).length !== 1) {
            setFailed(true);
            return () => { active = false; };
        }
        void loadWriting(character).then(svg => {
            if (active) setMarkup(svg);
        }).catch(() => {
            if (active) setFailed(true);
        });
        return () => { active = false; };
    }, [character]);

    return (
        <section className="kanji-writing" aria-label={`Stroke order for ${character}`}>
            <div className="kanji-writing-heading">
                <div><span className="eyebrow">PENMANSHIP / STROKE ORDER</span><small>Follow the strokes in sequence</small></div>
                <button type="button" className="icon-btn" onClick={() => setPlay(value => value + 1)} disabled={!markup} aria-label="Replay stroke order">Replay</button>
            </div>
            <div className="kanji-writing-canvas" key={play}>
                {markup ? <svg className="kanji-writing-svg" viewBox="0 0 109 109" role="img" aria-label={`${character} stroke order`} dangerouslySetInnerHTML={{ __html: markup }} />
                    : <span className="kanji-writing-note">{failed ? "Writing guide unavailable" : "Preparing writing guide…"}</span>}
            </div>
            <a className="kanji-writing-credit" href="https://kanjivg.tagaini.net/" target="_blank" rel="noreferrer">Stroke data: KanjiVG · CC BY-SA 3.0</a>
        </section>
    );
}
