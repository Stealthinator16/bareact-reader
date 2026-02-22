
const fs = require('fs');

const text = fs.readFileSync('dpdp_text.txt', 'utf8');

// 1. Clean up page headers/footers
// Pattern: Number on a line by itself, or "The Digital Personal Data Protection Act, 2023" on a line
// Also "CHAPTER ..." and "SECTIONS" tables of contents at start
// The text starts with an arrangement of sections which we should skip or use to validate.
// The actual act starts around "CHAPTER I PRELIMINARY 1. Short title..."
// But in the text file, it seems the arrangement comes first, then page 5 starts the real act text.
// "BE it enacted by Parliament..."

let cleanText = text;

// Find start of actual act
const startMarker = "BE it enacted by Parliament";
const startIndex = cleanText.indexOf(startMarker);
if (startIndex !== -1) {
    cleanText = cleanText.substring(startIndex);
}

// Remove page numbers and headers
// Lines like "5", "6", "The Digital Personal Data..." often appear at page divisions
// We'll split by lines and filter
const lines = cleanText.split('\n');
const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    if (!trimmed) return true; // keep empty lines for paragraph separation? or false?
    // Check for page number alone
    if (/^\d+$/.test(trimmed)) return false;
    // Check for header
    if (trimmed === "THE DIGITAL PERSONAL DATA PROTECTION ACT, 2023") return false;
    if (trimmed.startsWith("ACT NO. 22 OF 2023")) return false;
    if (trimmed.startsWith("[11th August, 2023.]")) return false; // Date usually at top
    return true;
});

cleanText = cleanedLines.join('\n');

// 2. Split into Chapters
// Regex for Chapter: ^CHAPTER [IVXLCDM]+$ (on its own line usually)
// The text has "CHAPTER I" then "PRELIMINARY" on next line
// We can look for "CHAPTER [Roman]"
const chapterRegex = /CHAPTER\s+([IVX]+)\s*\n([A-Z\s]+)\n/g;
// Actually, regex might be tricky across lines.
// Let's iterate lines to find Chapters and Sections.

const chapters = [];
let currentChapter = null;
let currentSection = null;

let captureContent = false;

for (let i = 0; i < cleanedLines.length; i++) {
    let line = cleanedLines[i].trim();
    if (!line) continue;

    // Detect Chapter
    const chapMatch = line.match(/^CHAPTER\s+([IVX]+)/);
    if (chapMatch) {
        // Start new chapter
        // capture title from next line usually
        let title = "CHAPTER " + chapMatch[1];
        // Search for title in next few lines
        let j = i + 1;
        while (j < cleanedLines.length && !cleanedLines[j].trim()) j++;
        if (j < cleanedLines.length) {
            title += ": " + cleanedLines[j].trim();
            i = j; // skip title line
        }

        currentChapter = {
            title: title,
            sections: []
        };
        chapters.push(currentChapter);
        continue;
    }

    // Detect Section
    // Format: "1. Short title..." or "16. Processing..."
    // Note: Some sections span multiple lines for title? Usually title ends with dot or dash or just newline?
    // In extraction, title is usually on same line or next.
    // Regex: ^\d+\.\s+
    const secMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (secMatch) {
        // This is a section
        // Save previous section content
        if (currentSection) {
            currentSection.content = currentSection.contentRaw.join('<br/><br/>');
            delete currentSection.contentRaw;
        }

        let num = secMatch[1];
        let titleRaw = secMatch[2];
        // Clean title: "Short title and commencement.—(1)..." -> Title is "Short title and commencement"
        // remove content starting with .— or .–
        let title = titleRaw;
        let contentStart = "";

        let splitIdx = titleRaw.indexOf(".—");
        if (splitIdx === -1) splitIdx = titleRaw.indexOf(".–"); // en-dash?
        if (splitIdx !== -1) {
            title = titleRaw.substring(0, splitIdx);
            contentStart = titleRaw.substring(splitIdx + 2); // skip .—
        }

        // If contentStart is empty, check if title ends with . and next char is content?
        // Actually the text file shows: "1. Short title and commencement.—(1) This Act..."

        currentSection = {
            id: 's' + num,
            number: num,
            title: title.trim(),
            contentRaw: [contentStart.trim()],
            commentary: [] // To be filled
        };

        if (currentChapter) {
            currentChapter.sections.push(currentSection);
        } else {
            // Maybe section 1 starts without chapter? No, Chapter 1 is usually first.
            // If we missed chapter detection, create implicit one?
            if (chapters.length === 0) {
                currentChapter = { title: "Preliminary", sections: [] };
                chapters.push(currentChapter);
            }
            currentChapter.sections.push(currentSection);
        }
        continue;
    }

    // Append content to current section
    if (currentSection) {
        currentSection.contentRaw.push(line);
    }
}

// Finalize last section
if (currentSection) {
    currentSection.content = currentSection.contentRaw.join('<br/><br/>');
    delete currentSection.contentRaw;
}

// Output JSON
console.log(JSON.stringify(chapters, null, 2));

