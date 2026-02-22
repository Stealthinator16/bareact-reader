/**
 * TMT Law Digital Treatise - Editorial Logic
 */

import { dpdpData } from './data/dpdp.js';
import { itActData } from './data/it_act.js';

const statutes = [
    dpdpData,
    itActData
];

const mainContent = document.getElementById('main-content');
const navBtns = document.querySelectorAll('.nav-btn');

function init() {
    renderLibrary();

    // Simple nav binding
    navBtns[0].addEventListener('click', () => renderLibrary());
}

function renderLibrary() {
    mainContent.innerHTML = `
        <div class="library-container">
            <h1 class="lib-header">Treatise Library</h1>
            ${statutes.map(statute => `
                <div class="statute-entry" data-id="${statute.id}">
                    <h2>${statute.title}</h2>
                    <p>${statute.description}</p>
                </div>
            `).join('')}
        </div>
    `;

    document.querySelectorAll('.statute-entry').forEach(entry => {
        entry.addEventListener('click', () => {
            renderReader(entry.getAttribute('data-id'));
        });
    });

    window.scrollTo(0, 0);
}

function renderReader(statuteId) {
    const statute = statutes.find(s => s.id === statuteId);
    if (!statute) return;

    // Editorial Layout: Main wrapper = treatise-grid
    // Content flows naturally.

    let html = `<div class="treatise-grid">`;

    // Title Block
    html += `
        <div class="chapter-header" style="border:none; margin-top:60px;">
            <div style="font-family:var(--font-ui); text-transform:uppercase; letter-spacing:0.1em; color:var(--text-meta);">
                ${statute.category}
            </div>
            <h1 class="chapter-title">${statute.title}</h1>
        </div>
    `;

    statute.chapters.forEach(chapter => {
        // Chapter Divider
        html += `
            <div class="chapter-header">
                ${chapter.title}
            </div>
        `;

        chapter.sections.forEach(section => {
            // Sidenote HTML generation
            const sidenotesHtml = section.commentary ? section.commentary.map(c => `
                <div class="sidenote">
                    <h4>${c.subtitle}</h4>
                    ${c.text}
                </div>
            `).join('') : '';

            // Case Laws HTML
            const caseLawsHtml = section.caseLaws ? section.caseLaws.map(c => `
                <div class="sidenote case-law">
                    <div class="meta-tag">CASE LAW</div>
                    <h4>${c.title}</h4>
                    <div class="citation">${c.citation}</div>
                    <p>${c.summary}</p>
                </div>
            `).join('') : '';

            // Technical Details HTML
            const techHtml = section.technicalDetails ? section.technicalDetails.map(t => `
                <div class="sidenote tech-deep-dive">
                     <div class="meta-tag">TECH DEEP DIVE</div>
                    <h4>${t.topic}</h4>
                    <p>${t.description || t.mechanism}</p>
                </div>
            `).join('') : '';

            // Section Block
            html += `
                <div class="section-block" id="${section.id}">
                    <div class="provision-text">
                        <span class="provision-number">§ ${section.number}</span>
                        ${section.content}
                    </div>
                    <div class="sidenote-column">
                        ${sidenotesHtml}
                        ${caseLawsHtml}
                        ${techHtml}
                    </div>
                </div>
            `;
        });
    });

    html += `</div>`; // Close grid
    mainContent.innerHTML = html;
    window.scrollTo(0, 0);
}

document.addEventListener('DOMContentLoaded', init);
