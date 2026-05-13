const state = {
    datasetId: 'thai',
    modeId: 'thai-consonants',
    items: [],
    current: 0,
    score: 0,
    correct: 0,
    locked: false,
    hardMode: false,
};

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];

function shuffle(values) {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function getDataset() {
    return SCRIPT_DATASETS[state.datasetId];
}

function getMode() {
    return getDataset().modes.find(mode => mode.id === state.modeId) || getDataset().modes[0];
}

function getCount() {
    const count = $('#count').value;
    return count === 'all' ? Infinity : Number(count);
}

function renderDatasetTabs() {
    const tabs = $('#dataset-tabs');
    tabs.innerHTML = '';

    Object.values(SCRIPT_DATASETS).forEach(dataset => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = dataset.id === state.datasetId
            ? 'px-4 py-3 rounded-lg bg-[#2D5A27] text-white font-bold text-left shadow-sm'
            : 'px-4 py-3 rounded-lg bg-white border border-[#DDE8DA] text-[#24491f] font-bold text-left transition hover:border-[#2D5A27] hover:bg-[#F0F7ED]';
        button.innerHTML = `<span class="${dataset.textClass} text-xl mr-2">${dataset.nativeLabel}</span>${dataset.label}`;
        button.onclick = () => {
            state.datasetId = dataset.id;
            state.modeId = dataset.modes[0].id;
            renderSetup();
        };
        tabs.appendChild(button);
    });
}

function renderModeCards() {
    const dataset = getDataset();
    const modes = $('#mode-cards');
    modes.innerHTML = '';

    dataset.modes.forEach(mode => {
        const total = mode.buildItems().length;
        const label = document.createElement('label');
        label.className = 'block cursor-pointer';
        label.innerHTML = `
            <input type="radio" name="mode" value="${mode.id}" class="hidden" ${mode.id === state.modeId ? 'checked' : ''}>
            <div class="mode-card h-full rounded-xl border-2 border-[#DDE8DA] bg-white p-4 transition hover:border-[#2D5A27] hover:shadow-md">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <div class="text-lg font-bold text-[#102019]">${mode.label}</div>
                        <div class="mt-1 text-sm text-[#5E7460]">${mode.description}</div>
                    </div>
                    <div class="rounded-full bg-[#F0F7ED] px-3 py-1 text-xs font-bold text-[#2D5A27]">${total}</div>
                </div>
            </div>
        `;
        label.querySelector('input').onchange = () => {
            state.modeId = mode.id;
            renderModeCards();
            renderModeGuide();
        };
        modes.appendChild(label);
    });
}

function renderModeGuide() {
    const dataset = getDataset();
    const guide = getMode().guide;
    const guideBox = $('#mode-guide');
    if (!guide) {
        guideBox.style.display = 'none';
        guideBox.innerHTML = '';
        return;
    }

    guideBox.style.display = 'block';
    guideBox.innerHTML = `
        <div class="text-sm font-extrabold text-[#102019]">${guide.title}</div>
        <ul class="mt-2 grid list-disc gap-1 pl-5 text-sm font-semibold leading-6 text-[#4D6551]">
            ${guide.points.map(point => `<li>${point}</li>`).join('')}
        </ul>
        <div class="mt-3 grid gap-2 md:grid-cols-3">
            ${guide.examples.map(example => `
                <div class="rounded-lg bg-white p-3 ring-1 ring-[#DDE8DA]">
                    <div class="${dataset.textClass} text-2xl font-extrabold text-[#102019]">${example.text}</div>
                    <div class="mt-1 text-sm font-bold text-[#24491f]">${example.reading}</div>
                    <div class="mt-1 text-xs font-semibold text-[#5E7460]">${example.note}</div>
                </div>
            `).join('')}
        </div>
        ${guide.sources ? `
            <div class="mt-3 flex flex-wrap gap-2">
                ${guide.sources.map(source => `
                    <a href="${source.url}" target="_blank" rel="noopener noreferrer" class="rounded-lg border border-[#DDE8DA] bg-white px-3 py-2 text-xs font-bold text-[#1A73E8] transition hover:border-[#1A73E8]">${source.label}</a>
                `).join('')}
            </div>
        ` : ''}
    `;
}

function renderSetup() {
    const dataset = getDataset();
    $('#dataset-title').textContent = dataset.label;
    $('#dataset-native').textContent = dataset.nativeLabel;
    $('#dataset-native').className = `${dataset.textClass} text-4xl font-bold text-[#102019]`;
    $('#dataset-description').textContent = dataset.description;
    renderDatasetTabs();
    renderModeCards();
    renderModeGuide();
}

function startQuiz() {
    const rawItems = getMode().buildItems();
    const count = Math.min(getCount(), rawItems.length);
    state.hardMode = $('#hard-mode').checked;
    state.items = shuffle(rawItems).slice(0, count).map(item => ({
        ...item,
        options: buildOptions(item, rawItems),
    }));
    state.current = 0;
    state.score = 0;
    state.correct = 0;
    state.locked = false;
    showScreen('quiz');
    renderQuestion();
}

function buildOptions(item, pool) {
    if (state.hardMode) {
        return buildHardOptions(item, pool);
    }

    const used = new Set([item.answer]);
    const distractors = [];
    for (const candidate of shuffle(pool)) {
        if (!used.has(candidate.answer)) {
            used.add(candidate.answer);
            distractors.push(candidate.answer);
        }
        if (distractors.length === 3) break;
    }
    return shuffle([item.answer, ...distractors]);
}

function buildHardOptions(item, pool) {
    const used = new Set([item.answer]);
    const ranked = shuffle(pool)
        .filter(candidate => candidate.answer !== item.answer)
        .map(candidate => ({
            answer: candidate.answer,
            score: getOptionSimilarity(item, candidate),
        }))
        .sort((a, b) => b.score - a.score);
    const distractors = [];

    for (const candidate of ranked) {
        if (!used.has(candidate.answer)) {
            used.add(candidate.answer);
            distractors.push(candidate.answer);
        }
        if (distractors.length === 3) break;
    }

    if (distractors.length < 3) {
        for (const candidate of shuffle(pool)) {
            if (!used.has(candidate.answer)) {
                used.add(candidate.answer);
                distractors.push(candidate.answer);
            }
            if (distractors.length === 3) break;
        }
    }

    return shuffle([item.answer, ...distractors]);
}

function getOptionSimilarity(item, candidate) {
    const answer = normalizeAnswer(item.answer);
    const other = normalizeAnswer(candidate.answer);
    if (!answer || !other) return 0;

    let score = 0;
    if (answer[0] === other[0]) score += 32;
    if (answer.at(-1) === other.at(-1)) score += 16;
    if (answer.slice(0, 2) === other.slice(0, 2)) score += 18;
    if (answer.slice(-3) === other.slice(-3)) score += 34;
    else if (answer.slice(-2) === other.slice(-2)) score += 20;
    if (item.type && item.type === candidate.type) score += 8;

    const distance = levenshteinDistance(answer, other);
    score += Math.max(0, 30 - distance * 4);
    score += Math.max(0, 12 - Math.abs(answer.length - other.length) * 2);
    return score;
}

function normalizeAnswer(value) {
    return String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

function levenshteinDistance(a, b) {
    const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
    const current = Array(b.length + 1).fill(0);

    for (let i = 1; i <= a.length; i++) {
        current[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            current[j] = Math.min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + cost
            );
        }
        previous.splice(0, previous.length, ...current);
    }

    return previous[b.length];
}

function renderQuestion() {
    const dataset = getDataset();
    const mode = getMode();
    const item = state.items[state.current];
    state.locked = false;

    $('#quiz-context').textContent = `${dataset.label} / ${mode.label}`;
    $('#qno').textContent = `${state.current + 1} / ${state.items.length}`;
    $('#score').textContent = `Score ${state.score}`;
    $('#prompt').textContent = item.prompt;
    $('#prompt').className = `${dataset.textClass} text-center font-bold text-[#102019] drop-shadow-sm ${mode.id.includes('places') || mode.id.includes('provinces') ? 'text-5xl md:text-7xl' : 'text-7xl md:text-9xl'}`;
    $('#feedback').style.display = 'none';

    const options = $('#options');
    options.innerHTML = '';
    item.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'opt rounded-xl border-2 border-[#DDE8DA] bg-white p-4 text-left text-lg font-bold text-[#102019] transition duration-150 hover:scale-[1.02] hover:border-[#2D5A27] hover:bg-[#F7FAF7] active:scale-[0.98]';
        button.innerHTML = `<span class="mr-3 text-sm text-[#7C927E]">${index + 1}</span>${option}`;
        button.onclick = () => choose(option);
        options.appendChild(button);
    });
}

function choose(option) {
    if (state.locked) return;
    state.locked = true;

    const item = state.items[state.current];
    const isCorrect = option === item.answer;
    if (isCorrect) {
        state.correct++;
        state.score += 100;
    }
    $('#score').textContent = `Score ${state.score}`;

    $$('.opt').forEach(button => {
        const text = button.textContent.replace(/^\d+\s*/, '');
        button.disabled = true;
        if (text === item.answer) button.classList.add('correct');
        else if (text === option) button.classList.add('wrong');
    });

    renderFeedback(item, isCorrect, option);
}

function renderFeedback(item, isCorrect, option) {
    const feedback = $('#feedback');
    feedback.style.display = 'block';
    $('#result-label').textContent = isCorrect ? '正解' : '不正解';
    $('#result-label').className = isCorrect ? 'text-2xl font-bold text-[#059669]' : 'text-2xl font-bold text-[#DC2626]';
    $('#answer-line').textContent = isCorrect ? `${item.answer} / ${item.note}` : `正解: ${item.answer} / 回答: ${option}`;
    const detail = $('#detail-list');
    detail.innerHTML = '';
    const detailRows = [...item.detail];
    if (item.abbr && item.abbrThai) {
        detailRows.splice(2, 0, {
            label: '略称の取り方',
            value: highlightThaiAbbreviation(item.abbrThai, item.abbr),
            html: true,
        });
    }
    detailRows.forEach(row => {
        const div = document.createElement('div');
        div.className = 'rounded-lg bg-[#F7FAF7] p-3';
        div.innerHTML = `<div class="text-xs font-bold uppercase tracking-wide text-[#7C927E]">${row.label}</div><div class="mt-1 text-sm font-semibold text-[#24491f]">${row.html ? row.value : escapeHtml(row.value)}</div>`;
        detail.appendChild(div);
    });

    const mapLink = $('#map-link');
    if (item.mapQuery) {
        mapLink.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`;
        mapLink.style.display = 'inline-flex';
    } else {
        mapLink.removeAttribute('href');
        mapLink.style.display = 'none';
    }
}

function highlightThaiAbbreviation(thaiName, abbreviation) {
    const targets = [...abbreviation];
    let targetIndex = 0;
    return [...thaiName].map(char => {
        if (char === targets[targetIndex]) {
            targetIndex++;
            return `<span class="rounded bg-orange-100 px-0.5 font-extrabold text-orange-700">${escapeHtml(char)}</span>`;
        }
        return escapeHtml(char);
    }).join('');
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function nextQuestion() {
    state.current++;
    if (state.current >= state.items.length) {
        renderResult();
        return;
    }
    renderQuestion();
}

function renderResult() {
    showScreen('result');
    const accuracy = state.items.length ? Math.round((state.correct / state.items.length) * 100) : 0;
    $('#final-score').textContent = state.score;
    $('#final-accuracy').textContent = `${accuracy}%`;
    $('#final-count').textContent = `${state.correct} / ${state.items.length}`;
}

function showScreen(name) {
    ['setup', 'quiz', 'result'].forEach(id => {
        $('#' + id).style.display = id === name ? 'block' : 'none';
    });
}

document.addEventListener('keydown', event => {
    if ($('#quiz').style.display === 'none') return;
    const number = Number(event.key);
    if (!state.locked && number >= 1 && number <= 4) {
        const item = state.items[state.current];
        if (item.options[number - 1]) choose(item.options[number - 1]);
    } else if (state.locked && event.key === 'Enter') {
        nextQuestion();
    }
});

$('#start').onclick = startQuiz;
$('#next').onclick = nextQuestion;
$('#retry').onclick = () => showScreen('setup');
$('#back').onclick = () => showScreen('setup');

renderSetup();
