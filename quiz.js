// quiz.js (Refactored Version)

// ===== UTILITY FUNCTIONS =====
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(x => x[1]);

// ===== CONFIGURATION & STATE =====
const CONFIG = {
    MODES: {
        CONSONANT: 'consonant_en',
        CONSONANT_VOWEL: 'consonant_vowel',
        PROVINCE_FULL: 'full_en',
        PROVINCE_ABBR: 'abbr_en',
    },
    SHARE_URL: window.location.href,
    SHARE_HASHTAGS: 'タイ文字クイズ,GeoGuessr',
};

const VOWEL_PATTERNS = [
    { pattern: '{c}ะ', roman: 'a', name: '短い a', position: '子音の後ろに ะ' },
    { pattern: '{c}า', roman: 'aa', name: '長い aa', position: '子音の後ろに า' },
    { pattern: '{c}ิ', roman: 'i', name: '短い i', position: '子音の上に ิ' },
    { pattern: '{c}ี', roman: 'ii', name: '長い ii', position: '子音の上に ี' },
    { pattern: '{c}ึ', roman: 'ue', name: '短い ue', position: '子音の上に ึ' },
    { pattern: '{c}ื', roman: 'uee', name: '長い uee', position: '子音の上に ื' },
    { pattern: '{c}ุ', roman: 'u', name: '短い u', position: '子音の下に ุ' },
    { pattern: '{c}ู', roman: 'uu', name: '長い uu', position: '子音の下に ู' },
    { pattern: 'เ{c}', roman: 'ee', name: '長い ee', position: '子音の前に เ' },
    { pattern: 'แ{c}', roman: 'ae', name: '長い ae', position: '子音の前に แ' },
    { pattern: 'โ{c}', roman: 'oo', name: '長い oo', position: '子音の前に โ' },
    { pattern: 'ไ{c}', roman: 'ai', name: 'ai', position: '子音の前に ไ' },
    { pattern: 'ใ{c}', roman: 'ai', name: 'ai', position: '子音の前に ใ' },
    { pattern: '{c}ำ', roman: 'am', name: 'am', position: '子音の後ろに ำ' },
];

const STATE = {
    mode: null,
    total: 0,
    limit: 0,
    idx: 0,
    score: 0,
    timer: null,
    questions: [],
    answers: [],
};

let CURRENT = null;
let LOCKED = false;
let qStartTime = 0;

// ===== QUIZ LOGIC =====

function reset() {
    Object.assign(STATE, {
        mode: null, total: 0, limit: 0, idx: 0, score: 0,
        timer: null, questions: [], answers: [],
    });
    CURRENT = null;
    LOCKED = false;
    $('#infobox').style.display = 'none';
    $('#next-action').style.display = 'none';
}

function start() {
    reset();
    STATE.mode = $('input[name="mode"]:checked').value;
    STATE.total = Number($('#count').value);
    STATE.limit = Number($('#limit').value);
    STATE.questions = generateQuestions(STATE.mode, STATE.total);
    switchScreen('quiz');
    nextQuestion();
}

function nextQuestion() {
    if (STATE.idx >= STATE.total) {
        finish();
        return;
    }
    LOCKED = false;
    CURRENT = STATE.questions[STATE.idx];
    $('#infobox').style.display = 'none';
    $('#next-action').style.display = 'none';
    updateUI('qno', `第 ${STATE.idx + 1} 問`);
    updateUI('score', `スコア: ${STATE.score}`);
    updateUI('qtext', CURRENT.question);
    renderOptions(CURRENT.options);
    qStartTime = performance.now();
    startTimer();
}

function choose(option) {
    if (LOCKED) return;
    LOCKED = true;
    stopTimer();

    const time = (performance.now() - qStartTime) / 1000;
    
    let isCorrect = false;
    const isProvinceMode = STATE.mode === CONFIG.MODES.PROVINCE_FULL || STATE.mode === CONFIG.MODES.PROVINCE_ABBR;

    if (isProvinceMode) {
        isCorrect = option.thai === CURRENT.answer.thai;
    } else {
        isCorrect = option === CURRENT.answer;
    }

    const points = isCorrect ? Math.max(10, 100 - Math.floor(time * 2)) : 0;
    STATE.score += points;
    
    STATE.answers.push({ ok: isCorrect, time, q: CURRENT, chosen: option, points });
    
    highlightOptions(option);
    showInfo();
    updateUI('score', `スコア: ${STATE.score}`);
}

function finish() {
    stopTimer();
    const correctCount = STATE.answers.filter(a => a.ok).length;
    const accuracy = STATE.total > 0 ? ((correctCount / STATE.total) * 100).toFixed(1) : 0;
    const totalTime = STATE.answers.reduce((sum, a) => sum + a.time, 0);
    const avgTime = STATE.answers.length > 0 ? (totalTime / STATE.answers.length).toFixed(2) : '—';
    
    updateUI('rcnt', `${correctCount} / ${STATE.total}`);
    updateUI('racc', `${accuracy}%`);
    updateUI('ravg', `${avgTime}秒`);
    renderReviewTable();
    setupShareButton(accuracy);
    switchScreen('result');
}

// ===== QUESTION GENERATION =====

function generateQuestions(mode, count) {
    let questions = [];
    switch (mode) {
        case CONFIG.MODES.CONSONANT:
            questions = generateCharacterQuestions(consonants, count);
            break;
        case CONFIG.MODES.CONSONANT_VOWEL:
            questions = generateConsonantVowelQuestions(consonants, count);
            break;
        case CONFIG.MODES.PROVINCE_FULL:
            questions = generateProvinceQuestions(provinceQuizData, count, false);
            break;
        case CONFIG.MODES.PROVINCE_ABBR:
            questions = generateProvinceQuestions(provinceQuizData, count, true);
            break;
    }
    return questions;
}

function generateCharacterQuestions(data, count) {
    return shuffle(data).slice(0, count).map(c => ({
        question: c.thai,
        answer: c.roman,
        options: shuffle([
            c.roman,
            ...shuffle([...new Set(data.filter(x => x.roman !== c.roman).map(x => x.roman))]).slice(0, 3)
        ]),
        meta: c
    }));
}

function generateConsonantVowelQuestions(data, count) {
    const combinations = data.flatMap(c => VOWEL_PATTERNS.map(v => {
        const roman = c.roman + v.roman;
        return {
            question: v.pattern.replace('{c}', c.thai),
            answer: roman,
            consonant: c,
            vowel: v,
        };
    }));

    return shuffle(combinations).slice(0, count).map(item => ({
        question: item.question,
        answer: item.answer,
        options: shuffle([
            item.answer,
            ...shuffle([...new Set(combinations.filter(x => x.answer !== item.answer).map(x => x.answer))]).slice(0, 3)
        ]),
        meta: item
    }));
}

function generateProvinceQuestions(data, count, useAbbr) {
    return shuffle(data).slice(0, count).map(p => ({
        question: useAbbr ? p.abbr : p.thai,
        answer: p,
        options: shuffle([p, ...shuffle(data.filter(x => x.thai !== p.thai)).slice(0, 3)]),
        meta: p
    }));
}

// ===== UI RENDERING =====

function switchScreen(screenName) {
    ['setup', 'quiz', 'result'].forEach(id => {
        $('#' + id).style.display = id === screenName ? (id === 'quiz' ? 'flex' : 'block') : 'none';
    });
}

function updateUI(id, content) {
    const el = $('#' + id);
    if (el) el.textContent = content;
}

function renderOptions(options) {
    const optsContainer = $('#opts');
    optsContainer.innerHTML = '';
    const isProvinceMode = STATE.mode.includes('full') || STATE.mode.includes('abbr');

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'opt btn text-left w-full p-4 border-2 border-gray-200 rounded-lg text-lg font-semibold hover:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500';
        btn.textContent = isProvinceMode ? opt.english : opt;
        btn.onclick = () => choose(opt);
        optsContainer.appendChild(btn);
    });
}

function highlightOptions(chosenOption) {
    const isProvinceMode = STATE.mode.includes('full') || STATE.mode.includes('abbr');
    $$('#opts .opt').forEach(btn => {
        const btnText = btn.textContent;
        const correctText = isProvinceMode ? CURRENT.answer.english : CURRENT.answer;
        const chosenText = chosenOption ? (isProvinceMode ? chosenOption.english : chosenOption) : null;

        if (btnText === correctText) btn.classList.add('correct');
        if (btn.textContent !== correctText && btnText === chosenText) btn.classList.add('wrong');
        btn.disabled = true;
    });
}

function showInfo() {
    const answerData = STATE.answers[STATE.answers.length - 1];
    $('#infobox').innerHTML = getInfoHtml(answerData);
    $('#infobox').style.display = 'block';
    $('#next-action').style.display = 'block';
}

function getInfoHtml(answerData, isModal = false) {
    const { meta } = answerData.q;
    const { mode } = STATE;

    switch (mode) {
        case CONFIG.MODES.CONSONANT:
            return renderConsonantInfo(meta, answerData, isModal);
        case CONFIG.MODES.CONSONANT_VOWEL:
            return renderConsonantVowelInfo(meta, answerData, isModal);
        default:
            return renderProvinceInfo(meta, answerData, isModal);
    }
}

function renderProvinceInfo(p, answerData, isModal) {
    const { ok: isCorrect } = answerData;
    const resultTitle = isModal ? '詳細情報' : (isCorrect ? '正解！' : '不正解...');
    const resultColor = isModal ? 'gray' : (isCorrect ? 'teal' : 'red');

    let provinceNameHTML = p.thai;
    const abbreviationText = p.abbr ? ` (略語: ${p.abbr})` : '';

    if (STATE.mode === CONFIG.MODES.PROVINCE_ABBR) {
        // ABBR_RULESは data-abbreviations.js でグローバルに定義されている
        provinceNameHTML = ABBR_RULES[p.thai] || p.thai;
    }

    const mapQuery = encodeURIComponent(p.english + ' Province, Thailand');
    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    const mapLinkHtml = `<a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 hover:underline mt-1 font-semibold">
        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" fill="currentColor" viewBox="0 0 16 16"><path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10m0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6"/></svg>
        <span>Google Mapsで場所を確認</span>
    </a>`;

    const details = [
        { title: "地理情報 (Toponym)", content: p.toponym },
        { title: "文化・特徴 (Culture)", content: p.culture },
        { title: "名前の由来・語源 (Lexeme)", content: p.lexeme },
    ];
    
    return `
        <div class="flex justify-between items-start mb-4">
            <div>
                <h2 class="text-3xl font-bold text-teal-700 thai-text">${provinceNameHTML}${abbreviationText}</h2>
                <p class="text-lg text-gray-600 font-medium">${p.katakana} / ${p.english}</p>
                ${mapLinkHtml}
            </div>
            ${!isModal ? `<span class="text-2xl font-bold text-${resultColor}-500">${resultTitle}</span>` : ''}
        </div>
        <div class="space-y-4 text-gray-800 mt-4">
            ${details.map(d => `
                <div class="p-4 bg-gray-50 rounded-lg border">
                    <h4 class="font-bold text-lg mb-2 text-teal-600">${d.title}</h4>
                    <p class="text-gray-700 whitespace-pre-line">${d.content}</p>
                </div>
            `).join('')}
            <div class="p-4 bg-gray-50 rounded-lg border">
                <h4 class="font-bold text-lg mb-2 text-teal-600">名前の由来に関する説 (Etymologies)</h4>
                <ul class="list-disc list-inside space-y-2 text-gray-700">${p.etymologies.map(e => `<li>${e}</li>`).join('')}</ul>
            </div>
        </div>`;
}

function renderConsonantInfo(meta, answerData, isModal) {
    const { ok: isCorrect } = answerData;
    const resultTitle = isModal ? '詳細情報' : (isCorrect ? '正解！' : '不正解...');
    const resultColor = isModal ? 'gray' : (isCorrect ? 'teal' : 'red');
    const classColor = meta.class === '高子音' ? 'blue' : meta.class === '中子音' ? 'green' : 'red';
    
    return `
        <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold text-gray-800">子音 <span class="thai-text text-4xl text-teal-600">${meta.thai}</span> の解説</h2>
            ${!isModal ? `<span class="text-2xl font-bold text-${resultColor}-500">${resultTitle}</span>` : ''}
        </div>
        <div class="p-4 bg-gray-50 rounded-lg border text-lg space-y-3">
            <p><strong>名前:</strong> ${meta.name}</p>
            <p><strong>クラス:</strong> <span class="font-bold text-${classColor}-600">${meta.class}</span></p>
            <p><strong>発音 (ローマ字):</strong> <span class="font-semibold">${meta.roman}</span></p>
            <p><strong>発音 (IPA):</strong> <span class="font-mono">${meta.ipa}</span></p>
        </div>`;
}

function renderConsonantVowelInfo(meta, answerData, isModal) {
    const { ok: isCorrect } = answerData;
    const resultTitle = isModal ? '詳細情報' : (isCorrect ? '正解！' : '不正解...');
    const resultColor = isModal ? 'gray' : (isCorrect ? 'teal' : 'red');
    const { consonant, vowel } = meta;

    return `
        <div class="flex justify-between items-start mb-4">
            <h2 class="text-2xl font-bold text-gray-800">子音＋母音 <span class="thai-text text-4xl text-teal-600">${meta.question}</span> の解説</h2>
            ${!isModal ? `<span class="text-2xl font-bold text-${resultColor}-500">${resultTitle}</span>` : ''}
        </div>
        <div class="p-4 bg-gray-50 rounded-lg border text-lg space-y-3">
            <p><strong>読み (ローマ字):</strong> <span class="font-semibold">${meta.answer}</span></p>
            <p><strong>子音:</strong> <span class="thai-text text-2xl font-semibold">${consonant.thai}</span> / ${consonant.name} / ${consonant.roman}</p>
            <p><strong>母音:</strong> ${vowel.name} (${vowel.roman})</p>
            <p><strong>書き方:</strong> ${vowel.position}</p>
        </div>`;
}

function renderReviewTable() {
    const tbl = $('#rev');
    tbl.innerHTML = `
        <thead class="bg-gray-50">
            <tr class="border-b-2 border-gray-200">
                <th class="p-3 text-sm font-semibold text-gray-600 tracking-wider">#</th>
                <th class="p-3 text-sm font-semibold text-gray-600 tracking-wider">問題</th>
                <th class="p-3 text-sm font-semibold text-gray-600 tracking-wider">正解</th>
                <th class="p-3 text-sm font-semibold text-gray-600 tracking-wider">あなたの回答</th>
                <th class="p-3 text-sm font-semibold text-gray-600 tracking-wider text-right">時間(秒)</th>
            </tr>
        </thead>
        <tbody>
            ${STATE.answers.map((a, i) => {
                const isProvinceMode = a.q.meta.region;
                const questionText = `<span class="thai-text font-semibold">${a.q.question}</span>`;
                const answerText = isProvinceMode ? a.q.answer.english : a.q.answer;
                const chosenText = a.timeout ? '時間切れ' : (a.chosen ? (isProvinceMode ? a.chosen.english : a.chosen) : '—');
                const resultClass = a.ok ? 'text-green-600' : 'text-red-600';
                
                return `
                    <tr class="border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition even:bg-white odd:bg-gray-50" data-answer-index="${i}">
                        <td class="p-3 font-semibold text-gray-500">${i + 1}</td>
                        <td class="p-3 text-lg text-gray-800">${questionText}</td>
                        <td class="p-3">${answerText}</td>
                        <td class="p-3 ${resultClass}">${chosenText}</td>
                        <td class="p-3 text-right text-gray-500">${a.time.toFixed(2)}</td>
                    </tr>`;
            }).join('')}
        </tbody>`;
}

function setupShareButton(accuracy) {
    const quizLevelText = $(`input[name="mode"][value="${STATE.mode}"] + span`).textContent;
    const shareText = `「タイ文字クイズ (${quizLevelText})」で${STATE.score}点を獲得！(正解率: ${accuracy}%)`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(CONFIG.SHARE_URL)}&hashtags=${encodeURIComponent(CONFIG.SHARE_HASHTAGS)}`;
    $('#share-btn').href = twitterUrl;
}

// ===== TIMER LOGIC =====

function startTimer() {
    const limit = STATE.limit;
    const bar = $('#tfill');
    if (!limit) {
        bar.style.width = '100%';
        return;
    }
    bar.style.transition = 'none';
    bar.style.width = '100%';
    setTimeout(() => {
        bar.style.transition = `width ${limit}s linear`;
        bar.style.width = '0%';
    }, 50);
    STATE.timer = setTimeout(handleTimeout, limit * 1000);
}

function stopTimer() {
    if (STATE.timer) clearTimeout(STATE.timer);
    STATE.timer = null;
    const bar = $('#tfill');
    if (bar) {
        const currentWidth = window.getComputedStyle(bar).width;
        bar.style.transition = 'none';
        bar.style.width = currentWidth;
    }
}

function handleTimeout() {
    if (LOCKED) return;
    LOCKED = true;
    STATE.answers.push({ ok: false, time: STATE.limit, q: CURRENT, chosen: null, points: 0, timeout: true });
    highlightOptions(null);
    showInfo();
}

// ===== MODAL LOGIC =====

function showDetailsModal(index) {
    const answerData = STATE.answers[index];
    if (!answerData) return;
    $('#modal-body').innerHTML = getInfoHtml(answerData, true);
    const modal = $('#details-modal');
    modal.style.display = 'flex';
    setTimeout(() => {
        modal.classList.remove('invisible', 'opacity-0');
        $('#modal-content').classList.remove('-translate-y-10');
    }, 10);
}

function hideDetailsModal() {
    const modal = $('#details-modal');
    modal.classList.add('invisible', 'opacity-0');
    $('#modal-content').classList.add('-translate-y-10');
    setTimeout(() => {
        if (modal.classList.contains('invisible')) {
            modal.style.display = 'none';
        }
    }, 300);
}

// ===== EVENT LISTENERS & INITIALIZATION =====

function setupEventListeners() {
    $('#start').onclick = start;
    $$('input[name="mode"]').forEach(r => r.addEventListener('change', updateCountOptions));
    $('#retry').onclick = start;
    $('#back').onclick = () => switchScreen('setup');
    $('#next-btn').onclick = () => { STATE.idx++; nextQuestion(); };
    $('#rev').addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.answerIndex) {
            showDetailsModal(row.dataset.answerIndex);
        }
    });
    $('#close-modal').onclick = hideDetailsModal;
    $('#details-modal').onclick = (e) => {
        if (e.target === $('#details-modal')) {
            hideDetailsModal();
        }
    };
}

function updateCountOptions() {
    const mode = $('input[name="mode"]:checked').value;
    let size = 0;
    switch (mode) {
        case CONFIG.MODES.CONSONANT: size = consonants.length; break;
        case CONFIG.MODES.CONSONANT_VOWEL: size = consonants.length * VOWEL_PATTERNS.length; break;
        default: size = provinceQuizData.length; break;
    }
    const sel = $('#count');
    const currentVal = sel.value;
    sel.innerHTML = `
        <option value="10">10問</option>
        <option value="20">20問</option>
        <option value="${size}">全問 (${size}問)</option>`;
    sel.value = ["10", "20", String(size)].includes(currentVal) ? currentVal : "10";
}

function init() {
    setupEventListeners();
    updateCountOptions();
}

// Run the app
document.addEventListener('DOMContentLoaded', init);
