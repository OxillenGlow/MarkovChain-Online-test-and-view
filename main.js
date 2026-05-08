// ==================== STORAGE KEYS ====================
const STORAGE_KEY = 'markov_bot_brain_v2';
const PRETRAIN_SHOWN_KEY = 'markov_bot_pretrain_shown';
const DEFAULT_BRAIN_URL = 'https://raw.githubusercontent.com/OxillenGlow/MarkovChain-Online-test-and-view/main/brains/oxg/markov-brain-2026-05-06.json';
const README_URL = 'https://raw.githubusercontent.com/OxillenGlow/MarkovChain-Online-test-and-view/main/README.md';

// ==================== BRAIN DATA STRUCTURE ====================
let brain = null;

function getEmptyBrain() {
    return {
        version: 2,
        trainedAt: null,
        totalTokens: 0,
        uniqueTokens: 0,
        ngrams: { '4': {}, '3': {}, '2': {}, '1': {} },
        vocabulary: {},
        snapshots: []
    };
}

// ==================== MARKDOWN TO HTML CONVERTER ====================
function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown;
    
    // Headers
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Horizontal rules
    html = html.replace(/^(---|\*\*\*|___)/gm, '<hr>');
    
    // Line breaks
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // Lists
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    
    // Tables (basic support)
    const tableRegex = /\|(.+)\|[\n\r]+\|[-:|]+\|[\n\r]+((?:\|.+\|[\n\r]*)*)/g;
    html = html.replace(tableRegex, function(match) {
        const rows = match.split('\n').filter(r => r.trim());
        let tableHtml = '<table><thead><tr>';
        const headerCells = rows[0].split('|').filter(c => c.trim());
        headerCells.forEach(cell => {
            tableHtml += '<th>' + cell.trim() + '</th>';
        });
        tableHtml += '</tr></thead><tbody>';
        for (let i = 2; i < rows.length; i++) {
            const cells = rows[i].split('|').filter(c => c.trim());
            if (cells.length > 0) {
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += '<td>' + cell.trim() + '</td>';
                });
                tableHtml += '</tr>';
            }
        }
        tableHtml += '</tbody></table>';
        return tableHtml;
    });
    
    return html;
}

// ==================== LOAD README ====================
async function loadReadme() {
    try {
        const response = await fetch(README_URL);
        if (response.ok) {
            const markdown = await response.text();
            const html = markdownToHtml(markdown);
            document.getElementById('readme-content').innerHTML = html;
        } else {
            document.getElementById('readme-content').innerHTML = 
                '<p style="color: #e74c3c;">Failed to load README. Please visit the <a href="https://github.com/OxillenGlow/MarkovChain-Online-test-and-view" target="_blank">GitHub repository</a>.</p>';
        }
    } catch (err) {
        console.error('Error loading README:', err);
        document.getElementById('readme-content').innerHTML = 
            '<p style="color: #e74c3c;">Error loading README: ' + err.message + '</p>';
    }
}

// ==================== LOAD / SAVE BRAIN ====================
function loadBrain() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.version === 2 && parsed.ngrams && parsed.vocabulary) {
                brain = parsed;
                if (!brain.snapshots) brain.snapshots = [];
                if (!brain.ngrams['4']) brain.ngrams['4'] = {};
                if (!brain.ngrams['3']) brain.ngrams['3'] = {};
                if (!brain.ngrams['2']) brain.ngrams['2'] = {};
                if (!brain.ngrams['1']) brain.ngrams['1'] = {};
                return true;
            }
        }
    } catch (e) {
        console.warn('Failed to load brain from localStorage:', e);
    }
    brain = getEmptyBrain();
    return false;
}

function saveBrain() {
    try {
        brain.trainedAt = Date.now();
        const json = JSON.stringify(brain);
        localStorage.setItem(STORAGE_KEY, json);
        return true;
    } catch (e) {
        console.error('Failed to save brain:', e);
        alert('⚠️ Error saving brain to browser storage. It may be too large (' +
            (JSON.stringify(brain).length / 1024 / 1024).toFixed(1) + ' MB). Try reducing training data.');
        return false;
    }
}

function clearBrain() {
    if (confirm('Are you sure you want to clear the entire brain? This cannot be undone.')) {
        brain = getEmptyBrain();
        localStorage.removeItem(STORAGE_KEY);
        updateAllUI();
        showStatus('train-status', 'Brain cleared.', 'warn');
    }
}

function downloadBrainJSON() {
    const json = JSON.stringify(brain, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'markov-brain-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function loadBrainFromFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (parsed && parsed.ngrams && parsed.vocabulary) {
                parsed.version = 2;
                if (!parsed.snapshots) parsed.snapshots = [];
                if (!parsed.ngrams['4']) parsed.ngrams['4'] = {};
                if (!parsed.ngrams['3']) parsed.ngrams['3'] = {};
                if (!parsed.ngrams['2']) parsed.ngrams['2'] = {};
                if (!parsed.ngrams['1']) parsed.ngrams['1'] = {};
                brain = parsed;
                saveBrain();
                updateAllUI();
                showStatus('train-status', 'Brain loaded from file! (' +
                    brain.totalTokens + ' tokens)', 'good');
                alert('✅ Brain loaded successfully!');
            } else {
                alert('❌ Invalid brain file format.');
            }
        } catch (err) {
            alert('❌ Error parsing JSON file: ' + err.message);
        }
    };
    reader.readAsText(file);
}

async function loadBrainFromURL(brainUrl) {
    const statusEl = document.getElementById('external-brain-status');
    if (!brainUrl || !brainUrl.trim()) {
        showStatus('external-brain-status', 'Please enter a brain JSON URL.', 'warn');
        return;
    }
    try {
        statusEl.textContent = 'Loading brain from URL...';
        statusEl.style.display = 'block';
        statusEl.className = 'status-msg';
        
        const response = await fetch(brainUrl.trim());
        if (!response.ok) {
            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        const parsed = await response.json();
        if (parsed && parsed.ngrams && parsed.vocabulary) {
            parsed.version = 2;
            if (!parsed.snapshots) parsed.snapshots = [];
            if (!parsed.ngrams['4']) parsed.ngrams['4'] = {};
            if (!parsed.ngrams['3']) parsed.ngrams['3'] = {};
            if (!parsed.ngrams['2']) parsed.ngrams['2'] = {};
            if (!parsed.ngrams['1']) parsed.ngrams['1'] = {};
            brain = parsed;
            saveBrain();
            updateAllUI();
            showStatus('external-brain-status', '✅ Brain loaded from URL! (' + brain.totalTokens + ' tokens)', 'good');
            alert('✅ Brain loaded successfully from URL!');
        } else {
            showStatus('external-brain-status', '❌ Invalid brain file format from URL.', 'err');
            alert('❌ Invalid brain file format from URL.');
        }
    } catch (err) {
        const errorMsg = (err && (err.message || err.toString())) || 'Unknown error';
        console.error('Load from URL error:', err);
        showStatus('external-brain-status', '❌ Error: ' + errorMsg, 'err');
        alert('❌ Error loading brain from URL: ' + errorMsg + '\n\nNote: The URL must be directly accessible and may require CORS support.');
    }
}

// ==================== PRETRAIN MODAL FUNCTIONS ====================
function showPretrainModal() {
    const modal = document.getElementById('pretrain-modal');
    modal.classList.add('show');
}

function hidePretrainModal() {
    const modal = document.getElementById('pretrain-modal');
    modal.classList.remove('show');
}

async function loadDefaultBrain() {
    const modal = document.getElementById('pretrain-modal');
    const buttonsDiv = document.getElementById('pretrain-modal-buttons');
    const loadingDiv = document.getElementById('pretrain-loading');

    // Hide buttons, show loading
    buttonsDiv.style.display = 'none';
    loadingDiv.style.display = 'block';

    try {
        const response = await fetch(DEFAULT_BRAIN_URL);
        if (!response.ok) {
            throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        const parsed = await response.json();
        if (parsed && parsed.ngrams && parsed.vocabulary) {
            parsed.version = 2;
            if (!parsed.snapshots) parsed.snapshots = [];
            if (!parsed.ngrams['4']) parsed.ngrams['4'] = {};
            if (!parsed.ngrams['3']) parsed.ngrams['3'] = {};
            if (!parsed.ngrams['2']) parsed.ngrams['2'] = {};
            if (!parsed.ngrams['1']) parsed.ngrams['1'] = {};
            brain = parsed;
            saveBrain();
            updateAllUI();
            localStorage.setItem(PRETRAIN_SHOWN_KEY, 'true');
            hidePretrainModal();
            showStatus('train-status', '✅ Default brain loaded! (' + brain.totalTokens + ' tokens)', 'good');
        } else {
            throw new Error('Invalid brain file format from URL.');
        }
    } catch (err) {
        const errorMsg = (err && (err.message || err.toString())) || 'Unknown error';
        console.error('Load default brain error:', err);
        // Restore buttons
        buttonsDiv.style.display = 'flex';
        loadingDiv.style.display = 'none';
        alert('❌ Error loading default brain: ' + errorMsg);
    }
}

// ==================== TOKENIZATION ====================
function tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text.trim().split(/\s+/).filter(t => t.length > 0);
}

// ==================== PROMPT NORMALIZATION (link "un" → "UN") ====================
function normalizeSeedTokens(tokens) {
    return tokens.map(token => {
        if (token.toLowerCase() === 'un') {
            return 'UN';
        }
        return token;
    });
}

// ==================== BUILD N-GRAM MODELS ====================
function buildNGramModel(tokens, n) {
    const model = {};
    const windowSize = n + 1;
    if (tokens.length < windowSize) return model;
    for (let i = 0; i <= tokens.length - windowSize; i++) {
        const contextTokens = tokens.slice(i, i + n);
        const nextWord = tokens[i + n];
        const key = contextTokens.join('|||');
        if (!model[key]) model[key] = {};
        model[key][nextWord] = (model[key][nextWord] || 0) + 1;
    }
    return model;
}

function buildVocabulary(tokens) {
    const vocab = {};
    for (const t of tokens) {
        vocab[t] = (vocab[t] || 0) + 1;
    }
    return vocab;
}

function trainOnText(text) {
    const tokens = tokenize(text);
    if (tokens.length < 2) return { success: false, message: 'Need at least 2 tokens to train.' };

    const ngram4 = buildNGramModel(tokens, 4);
    const ngram3 = buildNGramModel(tokens, 3);
    const ngram2 = buildNGramModel(tokens, 2);
    const ngram1 = buildNGramModel(tokens, 1);
    const vocab = buildVocabulary(tokens);

    if (!brain || !brain.ngrams) brain = getEmptyBrain();

    function mergeModel(target, source) {
        for (const [key, nextMap] of Object.entries(source)) {
            if (!target[key]) target[key] = {};
            for (const [word, count] of Object.entries(nextMap)) {
                target[key][word] = (target[key][word] || 0) + count;
            }
        }
    }

    mergeModel(brain.ngrams['4'], ngram4);
    mergeModel(brain.ngrams['3'], ngram3);
    mergeModel(brain.ngrams['2'], ngram2);
    mergeModel(brain.ngrams['1'], ngram1);

    for (const [word, count] of Object.entries(vocab)) {
        brain.vocabulary[word] = (brain.vocabulary[word] || 0) + count;
    }

    brain.totalTokens += tokens.length;
    brain.uniqueTokens = Object.keys(brain.vocabulary).length;

    const saved = saveBrain();
    const totalNgrams =
        Object.keys(brain.ngrams['4']).length +
        Object.keys(brain.ngrams['3']).length +
        Object.keys(brain.ngrams['2']).length +
        Object.keys(brain.ngrams['1']).length;

    return {
        success: saved,
        message: 'Trained on ' + tokens.length + ' tokens. ' +
            'Total brain tokens: ' + brain.totalTokens + '. ' +
            'Unique words: ' + brain.uniqueTokens + '. ' +
            'N-gram entries: ' + totalNgrams + '. ' +
            (saved ? 'Brain saved to browser.' : 'WARNING: Brain not saved!'),
        tokens: tokens.length,
        totalNgrams: totalNgrams
    };
}

// ==================== STOP WORDS FOR ATTENTION ====================
const STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'this', 'that',
    'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
    'not', 'no', 'nor', 'so', 'if', 'then', 'than', 'too', 'very',
    'just', 'all', 'each', 'every', 'both', 'few', 'more', 'most',
    'other', 'some', 'such', 'only', 'own', 'same', 'into', 'over',
    'from', 'up', 'down', 'out', 'off', 'about', 'above', 'after',
    'again', 'against', 'as', 'before', 'between', 'during', 'through',
    'under', 'while', 'any', 'because', 'until', 'now', 'also', 'here',
    'there', 'like', 'get', 'got', 'make', 'made', 'say', 'said', 'go',
    'went', 'come', 'came', 'see', 'saw', 'know', 'knew', 'think',
    'thought', 'take', 'took', 'use', 'used', 'much', 'many', 'well',
    'back', 'still', 'even', 'way', 'one', 'two', 'first', 'last',
]);

function extractImportantWords(seedText) {
    const tokens = tokenize(seedText);
    const important = new Set();
    for (const t of tokens) {
        const lower = t.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Boost all non-stop words, regardless of length
        if (!STOP_WORDS.has(lower)) {
            important.add(t);
        }
    }
    // Also keep originally capitalized words as potentially important
    for (const t of tokens) {
        if (/^[A-Z][a-z]{2,}$/.test(t)) {
            important.add(t);
        }
    }
    return important;
}

// ==================== GENERATION WITH BACKOFF & ATTENTION ====================
function weightedRandomPick(candidates, attentionSet, attentionFactor) {
    const entries = Object.entries(candidates);
    if (entries.length === 0) return null;

    const adjustedWeights = entries.map(([word, count]) => {
        let weight = count;
        if (attentionSet && attentionSet.has(word) && attentionFactor > 1.0) {
            weight = count * attentionFactor;
        }
        return { word, weight };
    });

    const totalWeight = adjustedWeights.reduce((sum, item) => sum + item.weight, 0);
    if (totalWeight <= 0) return entries[Math.floor(Math.random() * entries.length)][0];

    let rand = Math.random() * totalWeight;
    for (const item of adjustedWeights) {
        rand -= item.weight;
        if (rand <= 0) return item.word;
    }
    return adjustedWeights[adjustedWeights.length - 1].word;
}

function generateText(seedText, maxWords, attentionFactor) {
    if (!brain || brain.totalTokens < 2) {
        return { text: '', debug: 'Brain is empty. Please train first.' };
    }

    let seedTokens = tokenize(seedText);
    seedTokens = normalizeSeedTokens(seedTokens);

    if (seedTokens.length === 0) {
        return { text: '', debug: 'Please provide a seed/prompt with at least 1 word.' };
    }

    const importantWords = extractImportantWords(seedText);
    const generated = [...seedTokens];
    const maxTotal = seedTokens.length + maxWords;
    const maxExtra = 20; // safety cap to avoid infinite loops
    const backoffUsed = { '4': 0, '3': 0, '2': 0, '1': 0, 'random': 0 };

    while (generated.length < maxTotal + maxExtra) {
        let nextWord = null;
        let usedLevel = null;

        if (generated.length >= 4) {
            const ctx4 = generated.slice(generated.length - 4).join('|||');
            const candidates4 = brain.ngrams['4'][ctx4];
            if (candidates4 && Object.keys(candidates4).length > 0) {
                nextWord = weightedRandomPick(candidates4, importantWords, attentionFactor);
                usedLevel = '4';
            }
        }

        if (!nextWord && generated.length >= 3) {
            const ctx3 = generated.slice(generated.length - 3).join('|||');
            const candidates3 = brain.ngrams['3'][ctx3];
            if (candidates3 && Object.keys(candidates3).length > 0) {
                nextWord = weightedRandomPick(candidates3, importantWords, attentionFactor);
                usedLevel = '3';
            }
        }

        if (!nextWord && generated.length >= 2) {
            const ctx2 = generated.slice(generated.length - 2).join('|||');
            const candidates2 = brain.ngrams['2'][ctx2];
            if (candidates2 && Object.keys(candidates2).length > 0) {
                nextWord = weightedRandomPick(candidates2, importantWords, attentionFactor);
                usedLevel = '2';
            }
        }

        if (!nextWord && generated.length >= 1) {
            const ctx1 = generated[generated.length - 1];
            const candidates1 = brain.ngrams['1'][ctx1];
            if (candidates1 && Object.keys(candidates1).length > 0) {
                nextWord = weightedRandomPick(candidates1, importantWords, attentionFactor);
                usedLevel = '1';
            }
        }

        if (!nextWord) {
            const vocabEntries = Object.entries(brain.vocabulary);
            if (vocabEntries.length > 0) {
                const pick = weightedRandomPick(
                    Object.fromEntries(vocabEntries),
                    importantWords,
                    attentionFactor
                );
                nextWord = pick || vocabEntries[Math.floor(Math.random() * vocabEntries.length)][0];
                usedLevel = 'random';
            } else {
                break;
            }
        }

        if (!nextWord) break;

        generated.push(nextWord);
        if (usedLevel) backoffUsed[usedLevel] = (backoffUsed[usedLevel] || 0) + 1;

        // Stop after maxTotal if the last token ends with . ? !
        if (generated.length > maxTotal && /[.?!]$/.test(generated[generated.length - 1])) {
            break;
        }
    }

    const debugStr =
        'Backoff stats: 4-gram=' + backoffUsed['4'] + ' 3-gram=' + backoffUsed['3'] +
        ' 2-gram=' + backoffUsed['2'] + ' 1-gram=' + backoffUsed['1'] +
        ' random=' + backoffUsed['random'] +
        ' | Important words: ' + (importantWords.size > 0 ? [...importantWords].slice(0, 15).join(', ') : 'none') +
        (importantWords.size > 15 ? '...' : '') +
        ' | Stopped by punctuation: ' + (generated.length > maxTotal && /[.?!]$/.test(generated[generated.length-1]) ? 'yes' : 'no');

    return { text: generated.join(' '), debug: debugStr };
}

// ==================== WEBSITE SCRAPER ====================
async function fetchAndExtractText(url, proxyPrefix) {
    let fetchUrl = url;
    if (proxyPrefix && proxyPrefix.trim()) {
        fetchUrl = proxyPrefix.trim() + encodeURIComponent(url);
    }
    const response = await fetch(fetchUrl, {
        method: 'GET',
        headers: { 'Accept': 'text/html,text/plain,*/*' },
    });
    if (!response.ok) throw new Error('HTTP ' + response.status + ': ' + response.statusText);
    const contentType = response.headers.get('content-type') || '';
    const rawText = await response.text();

    if (contentType.includes('text/html') || rawText.trim().startsWith('<!DOCTYPE') || rawText.trim().startsWith('<html') || rawText.includes('<body')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(rawText, 'text/html');
        const removals = doc.querySelectorAll('script, style, nav, header, footer, iframe, noscript, [role="navigation"], .nav, .sidebar, .footer, .header');
        removals.forEach(el => el.remove());
        const bodyText = doc.body ? doc.body.textContent : doc.documentElement.textContent;
        const cleaned = bodyText.replace(/[\t\r]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/[ ]{2,}/g, ' ').trim();
        return cleaned || '(no text content extracted)';
    } else {
        return rawText.replace(/[\t\r]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/[ ]{2,}/g, ' ').trim();
    }
}

function takeSnapshot(url, text) {
    if (!text || text.trim().length < 10) {
        alert('Not enough text to snapshot. Minimum 10 characters.');
        return false;
    }
    if (!brain.snapshots) brain.snapshots = [];
    brain.snapshots.push({
        url: url || '(no url)',
        text: text.trim().slice(0, 100000),
        date: new Date().toISOString()
    });
    saveBrain();
    renderSnapshots();
    return true;
}

function renderSnapshots() {
    const container = document.getElementById('snapshots-list');
    if (!brain.snapshots || brain.snapshots.length === 0) {
        container.innerHTML = '<span style="color:#999;font-size:11px;">No snapshots yet.</span>';
        return;
    }
    let html = '';
    brain.snapshots.forEach((snap, idx) => {
        const preview = snap.text.slice(0, 200).replace(/</g, '&lt;').replace(/>/g, '&gt;');
        html += '<div class="snapshot-item">' +
            '<strong>#' + (idx + 1) + '</strong> URL: ' + (snap.url || '(none)').replace(/</g, '&lt;').replace(/>/g, '&gt;') +
            ' | Date: ' + (snap.date || '?').slice(0, 10) +
            ' | Chars: ' + snap.text.length +
            ' <button onclick="window._addSnapshotToTraining(' + idx + ')" style="font-size:10px;padding:2px 6px;">+ Add to Training</button>' +
            ' <button onclick="window._removeSnapshot(' + idx + ')" style="font-size:10px;padding:2px 6px;color:#a44;">🗑️</button>' +
            '<pre>' + preview + (snap.text.length > 200 ? '...' : '') + '</pre>' +
            '</div>';
    });
    container.innerHTML = html;
}

window._addSnapshotToTraining = function(idx) {
    if (brain.snapshots && brain.snapshots[idx]) {
        const textarea = document.getElementById('training-input');
        const current = textarea.value;
        const snapText = brain.snapshots[idx].text;
        textarea.value = current + (current ? '\n\n' : '') + snapText;
        textarea.scrollTop = textarea.scrollHeight;
        showStatus('train-status', 'Snapshot #' + (idx + 1) + ' added to training field.', 'good');
        document.getElementById('sec-train').scrollIntoView({ behavior: 'smooth' });
    }
};

window._removeSnapshot = function(idx) {
    if (brain.snapshots && brain.snapshots[idx]) {
        brain.snapshots.splice(idx, 1);
        saveBrain();
        renderSnapshots();
    }
};

// ==================== STATUS MESSAGE DISPLAY ====================
function showStatus(elementId, message, type) {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = message;
    el.style.display = 'block';
    el.className = 'status-msg ' + (type || 'warn');
}

// ==================== KNOWLEDGE WEB / N-GRAM TABLE ====================
function renderKnowledgeWeb(nLevel, filter) {
    const model = brain.ngrams[nLevel];
    const tbody = document.getElementById('knowledge-tbody');
    const countEl = document.getElementById('knowledge-count');
    
    if (!model || Object.keys(model).length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="color:#999;">No n-grams at this level. Train the brain first.</td></tr>';
        countEl.textContent = 'Count: 0';
        return;
    }

    const filterLower = (filter || '').toLowerCase();
    const entries = Object.entries(model).filter(([context, nextMap]) => {
        if (!filterLower) return true;
        const contextMatch = context.toLowerCase().includes(filterLower);
        const wordsMatch = Object.keys(nextMap).some(w => w.toLowerCase().includes(filterLower));
        return contextMatch || wordsMatch;
    });

    let html = '';
    entries.forEach(([context, nextMap], idx) => {
        const contextTokens = context.split('|||');
        const totalCount = Object.values(nextMap).reduce((a, b) => a + b, 0);
        Object.entries(nextMap).forEach(([nextWord, count]) => {
            const probability = (count / totalCount * 100).toFixed(1);
            html += '<tr>' +
                '<td>' + (idx + 1) + '</td>' +
                '<td style="font-size:10px;">' + contextTokens.join(' → ') + '</td>' +
                '<td><strong>' + nextWord + '</strong></td>' +
                '<td>' + count + '</td>' +
                '<td>' + probability + '%</td>' +
                '</tr>';
        });
    });

    tbody.innerHTML = html || '<tr><td colspan="5" style="color:#999;">No matches.</td></tr>';
    countEl.textContent = 'Count: ' + entries.length;
}

// ==================== UPDATE ALL UI ====================
function updateAllUI() {
    const stats = brain.totalTokens > 0 ?
        'Brain has ' + brain.totalTokens + ' tokens, ' + brain.uniqueTokens + ' unique words' :
        'empty';
    document.getElementById('brain-stats-top').textContent = 'Brain: ' + stats;
    document.getElementById('brain-info').textContent =
        brain.totalTokens > 0 ?
            'Status: ✅ Trained. Tokens: ' + brain.totalTokens + ' | Unique words: ' + brain.uniqueTokens +
            ' | 4-gram entries: ' + Object.keys(brain.ngrams['4']).length +
            ' | Snapshots: ' + (brain.snapshots ? brain.snapshots.length : 0) :
            'Status: ⚠️ Empty / Not trained.';
    renderSnapshots();
    renderKnowledgeWeb(document.getElementById('knowledge-n-level').value || '4', '');
}

// ==================== EVENT LISTENERS & INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', function() {
    // Load brain from localStorage
    loadBrain();
    
    // Check if pretrain modal should be shown
    const pretrainShown = localStorage.getItem(PRETRAIN_SHOWN_KEY);
    if (!pretrainShown && brain.totalTokens === 0) {
        showPretrainModal();
    }

    // Modal buttons
    document.getElementById('btn-load-default-brain').addEventListener('click', loadDefaultBrain);
    document.getElementById('btn-skip-pretrain').addEventListener('click', hidePretrainModal);

    // Training
    document.getElementById('btn-train').addEventListener('click', function() {
        const text = document.getElementById('training-input').value;
        if (!text.trim()) {
            showStatus('train-status', 'Please enter text to train.', 'warn');
            return;
        }
        const result = trainOnText(text);
        const type = result.success ? 'good' : 'err';
        showStatus('train-status', result.message, type);
        updateAllUI();
    });

    // Keyboard shortcuts
    document.getElementById('training-input').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            document.getElementById('btn-train').click();
        }
    });

    // Generate
    document.getElementById('btn-generate').addEventListener('click', function() {
        const prompt = document.getElementById('prompt-input').value;
        const maxWords = parseInt(document.getElementById('max-words').value);
        const attentionFactor = parseFloat(document.getElementById('attention-factor').value);
        
        if (!prompt.trim()) {
            showStatus('train-status', 'Please enter a prompt/seed.', 'warn');
            return;
        }
        if (brain.totalTokens === 0) {
            showStatus('train-status', 'Brain is empty. Train or load a brain first.', 'warn');
            return;
        }

        const result = generateText(prompt, maxWords, attentionFactor);
        document.getElementById('generated-output').value = result.text;
        document.getElementById('gen-debug').textContent = result.debug;
    });

    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'g') {
            e.preventDefault();
            document.getElementById('btn-generate').click();
        }
    });

    // External brain toggle
    document.getElementById('use-external-brain-toggle').addEventListener('change', function() {
        const trainingMode = document.getElementById('training-mode');
        const externalPanel = document.getElementById('external-brain-panel');
        if (this.checked) {
            trainingMode.style.display = 'none';
            externalPanel.style.display = 'block';
        } else {
            trainingMode.style.display = 'block';
            externalPanel.style.display = 'none';
        }
    });

    document.getElementById('btn-load-external-brain').addEventListener('click', function() {
        const url = document.getElementById('external-brain-url').value;
        loadBrainFromURL(url);
    });

    // Scraper
    document.getElementById('btn-fetch-url').addEventListener('click', async function() {
        const url = document.getElementById('scraper-url').value;
        const proxy = document.getElementById('scraper-proxy').value;
        if (!url.trim()) {
            showStatus('scraper-status', 'Please enter a URL.', 'warn');
            return;
        }
        try {
            const panel = document.getElementById('scraper-panel');
            panel.style.display = 'block';
            document.getElementById('scraper-extracted').value = 'Fetching...';
            const text = await fetchAndExtractText(url, proxy);
            document.getElementById('scraper-extracted').value = text;
            showStatus('scraper-status', 'Text extracted (' + text.length + ' chars)', 'good');
        } catch (err) {
            document.getElementById('scraper-extracted').value = '';
            showStatus('scraper-status', 'Error: ' + err.message, 'err');
        }
    });

    document.getElementById('btn-take-snapshot').addEventListener('click', function() {
        const url = document.getElementById('scraper-url').value;
        const text = document.getElementById('scraper-extracted').value;
        if (takeSnapshot(url, text)) {
            showStatus('scraper-status', 'Snapshot taken.', 'good');
        }
    });

    document.getElementById('btn-add-scraped-to-training').addEventListener('click', function() {
        const text = document.getElementById('scraper-extracted').value;
        if (!text.trim()) {
            showStatus('scraper-status', 'No text to add.', 'warn');
            return;
        }
        const textarea = document.getElementById('training-input');
        const current = textarea.value;
        textarea.value = current + (current ? '\n\n' : '') + text;
        showStatus('scraper-status', 'Added to training data.', 'good');
        document.getElementById('sec-train').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('btn-append-snapshots').addEventListener('click', function() {
        if (!brain.snapshots || brain.snapshots.length === 0) {
            showStatus('train-status', 'No snapshots to append.', 'warn');
            return;
        }
        const textarea = document.getElementById('training-input');
        const current = textarea.value;
        const allText = brain.snapshots.map(s => s.text).join('\n\n');
        textarea.value = current + (current ? '\n\n' : '') + allText;
        showStatus('train-status', 'Appended ' + brain.snapshots.length + ' snapshots.', 'good');
    });

    document.getElementById('btn-clear-snapshots').addEventListener('click', function() {
        if (confirm('Clear all snapshots?')) {
            brain.snapshots = [];
            saveBrain();
            renderSnapshots();
            showStatus('scraper-status', 'Snapshots cleared.', 'warn');
        }
    });

    // Brain management
    document.getElementById('btn-download-brain').addEventListener('click', downloadBrainJSON);
    document.getElementById('btn-download-brain2').addEventListener('click', downloadBrainJSON);

    document.getElementById('btn-load-brain').addEventListener('click', function() {
        document.getElementById('brain-file-input').click();
    });
    document.getElementById('btn-load-brain2').addEventListener('click', function() {
        document.getElementById('brain-file-input').click();
    });

    document.getElementById('brain-file-input').addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            loadBrainFromFile(e.target.files[0]);
        }
    });

    document.getElementById('btn-clear-brain').addEventListener('click', clearBrain);
    document.getElementById('btn-clear-brain2').addEventListener('click', clearBrain);

    // Knowledge web
    document.getElementById('knowledge-n-level').addEventListener('change', function() {
        renderKnowledgeWeb(this.value, document.getElementById('knowledge-filter').value);
    });
    document.getElementById('knowledge-filter').addEventListener('input', function() {
        renderKnowledgeWeb(document.getElementById('knowledge-n-level').value, this.value);
    });

    // Load README
    loadReadme();

    // Initial UI update
    updateAllUI();
});
