
import { useEffect, useState } from "react";
import WordRow from "./components/WordRow"
import "./index.css"
import { WordDB } from "./db/words";

export default function Filter() {
    return (
        <>
            <div id="filterBar" className="d-flex flex-wrap align-items-center gap-2 p-2 border">

                <div className="btn-group" role="group" aria-label="Status Filters">

                    <input type="checkbox" className="btn-check" id="status-mastered"/>
                    <label className="btn btn-outline-success btn-mini" htmlFor="status-mastered">
                        Mastered
                    </label>

                    <input type="checkbox" className="btn-check" id="status-learning"/>
                    <label className="btn btn-outline-warning btn-mini" htmlFor="status-learning">
                        Learning
                    </label>

                    <input type="checkbox" className="btn-check" id="status-unknown"/>
                    <label className="btn btn-outline-secondary btn-mini" htmlFor="status-unknown">
                        Unknown
                    </label>

                    <input type="checkbox" className="btn-check" id="status-new"/>
                    <label className="btn btn-outline-info btn-mini" htmlFor="status-new">
                        New
                    </label>

                </div>

                <select id="sortField" className="form-select form-select-sm" style={{width: "auto"}}>
                    <option value="date">Date Added</option>
                    <option value="word">Word</option>
                    <option value="mastery">Mastery</option>
                    <option value="last_updated">Last Updated</option>
                </select>

                <div className="btn-group">
                    <button id="sortAsc" className="btn btn-outline-secondary btn-mini" data-order="1">
                        ↑
                    </button>

                    <button id="sortDesc" className="btn btn-outline-secondary btn-mini" data-order="-1">
                        ↓
                    </button>
                </div>

                <button id="resetFilter" className="btn btn-outline-secondary btn-mini">
                    Reset
                </button>

            </div>

            <input id="wordSearch" className="form-control form-control-sm mb-2" placeholder="Search..."/>
        </>
    )
}
