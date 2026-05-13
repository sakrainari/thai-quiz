const SCRIPT_DATASETS = {
    thai: {
        id: 'thai',
        label: 'タイ文字',
        nativeLabel: 'ไทย',
        description: 'GeoGuessr向けに、文字・母音・県名・略語を段階的に練習します。',
        textClass: 'thai-text',
        accent: 'teal',
        modes: [
            {
                id: 'thai-consonants',
                label: '子音',
                description: 'タイ子音の基本音を読む',
                buildItems: () => consonants.map(c => ({
                    prompt: c.thai,
                    answer: c.roman,
                    type: c.class,
                    note: `${c.name} / ${c.ipa}`,
                    detail: [
                        { label: '文字名', value: c.name },
                        { label: '子音クラス', value: c.class },
                        { label: 'IPA', value: c.ipa },
                    ],
                })),
            },
            {
                id: 'thai-vowels',
                label: '子音＋母音',
                description: '子音と基本母音の組み合わせを読む',
                guide: {
                    title: 'タイ文字の子音＋母音',
                    points: [
                        '母音記号は子音の後ろだけでなく、前・上・下にも付く。',
                        'เ / แ / โ / ไ / ใ は子音の前に書くが、読むときは子音の後に母音が来る。',
                        'このモードでは声調や末子音は扱わず、子音の基本ローマ字＋母音だけに集中する。',
                    ],
                    examples: [
                        { text: 'กา', reading: 'kaa', note: 'ก k + า aa' },
                        { text: 'กิ', reading: 'ki', note: 'ก k + ิ i' },
                        { text: 'เก', reading: 'kee', note: 'เ は前に書くが k + ee と読む' },
                    ],
                },
                buildItems: () => consonants.flatMap(c => THAI_VOWEL_PATTERNS.map(v => ({
                    prompt: v.pattern.replace('{c}', c.thai),
                    answer: `${c.roman}${v.roman}`,
                    type: '子音＋母音',
                    note: `${c.thai} (${c.roman}) + ${v.name} (${v.roman})`,
                    detail: [
                        { label: '子音', value: `${c.thai} / ${c.name} / ${c.roman}` },
                        { label: '母音', value: `${v.name} / ${v.roman}` },
                        { label: '書き方', value: v.position },
                    ],
                }))),
            },
            {
                id: 'thai-provinces',
                label: '県名',
                description: 'タイ県名を英語名で答える',
                buildItems: () => provinceQuizData.map(p => ({
                    prompt: p.thai,
                    answer: p.english,
                    type: p.region,
                    note: `${p.katakana} / ${p.meaning}`,
                    mapQuery: `${p.english} Province, Thailand`,
                    detail: [
                        { label: '地域', value: p.region },
                        { label: '意味', value: p.meaning },
                        { label: '語源', value: p.lexeme },
                    ],
                })),
            },
            {
                id: 'thai-abbr',
                label: '県名略語',
                description: 'タイの県名略語から県名を当てる',
                guide: {
                    title: 'タイ県名略称の出どころ',
                    points: [
                        'タイ語の県名略称（อักษรย่อจังหวัด / ตัวย่อจังหวัด）として使われる2-3字の省略形を使う。',
                        '車両登録・住所表記・県名一覧などで見かける略称の読み取り練習用。',
                        'バンコクは資料によって กท と กทม があるが、このアプリでは専用版と同じ กทม を採用する。',
                    ],
                    examples: [
                        { text: 'กทม', reading: 'Bangkok', note: 'กรุงเทพมหานคร' },
                        { text: 'ชม', reading: 'Chiang Mai', note: 'เชียงใหม่' },
                        { text: 'สข', reading: 'Songkhla', note: 'สงขลา' },
                    ],
                    sources: [
                        { label: 'JANGWAT: ตัวย่อจังหวัด ของประเทศไทย', url: 'https://jangwat.com/knowledge/318/' },
                        { label: 'WordyGuru: ชื่อย่อจังหวัดในประเทศไทย', url: 'https://www.wordyguru.com/article/thai-province-name' },
                    ],
                },
                buildItems: () => provinceQuizData.map(p => ({
                    prompt: p.abbr,
                    answer: p.english,
                    type: '県名略語',
                    note: `${p.thai} / ${p.katakana}`,
                    abbr: p.abbr,
                    abbrThai: p.thai,
                    mapQuery: `${p.english} Province, Thailand`,
                    detail: [
                        { label: '正式表記', value: p.thai },
                        { label: '略語', value: p.abbr },
                        { label: '地域', value: p.region },
                    ],
                })),
            },
        ],
    },
    bengali: {
        id: 'bengali',
        label: 'ベンガル文字',
        nativeLabel: 'বাংলা',
        description: 'バングラデシュの看板・地名判読向けに、子音・母音記号・地名を練習します。',
        textClass: 'bengali-text',
        accent: 'indigo',
        modes: [
            {
                id: 'bengali-consonants',
                label: '子音',
                description: 'ベンガル文字の子音骨格を読む',
                buildItems: () => CONSONANT_DATA.map(c => ({
                    prompt: c.q,
                    answer: c.a,
                    type: c.type,
                    note: c.desc,
                    detail: [
                        { label: 'ローマ字', value: c.roman },
                        { label: '分類', value: c.type },
                        { label: 'メモ', value: c.desc },
                    ],
                })),
            },
            {
                id: 'bengali-vowels',
                label: '子音＋母音記号',
                description: '子音に母音記号を足した形を読む',
                guide: {
                    title: 'ベンガル文字の子音＋母音記号',
                    points: [
                        '子音字には基本的に短い a が含まれる。母音記号が付くと、その母音に置き換わる。',
                        'ি は子音の左側に出るが、読む順番は子音＋i。',
                        'ে / ো なども見た目の位置と読む順番がずれるので、形をセットで覚える。',
                    ],
                    examples: [
                        { text: 'ক', reading: 'ka', note: 'ক k に内在母音 a' },
                        { text: 'কি', reading: 'ki', note: 'ি は左に出るが k + i' },
                        { text: 'কে', reading: 'ke', note: 'ে も左側に出る母音記号' },
                    ],
                },
                buildItems: () => CONSONANT_DATA.flatMap(c => VOWEL_SIGN_DATA.filter(v => v.sign !== '').map(v => ({
                    prompt: `${c.q}${v.sign}`,
                    answer: `${c.roman}${v.vowel}`,
                    type: '子音＋母音',
                    note: `${c.q} (${c.roman}) + ${v.display} (${v.vowel})`,
                    detail: [
                        { label: '子音', value: `${c.q} / ${c.roman} / ${c.type}` },
                        { label: '母音記号', value: `${v.display} / ${v.vowel}` },
                        { label: 'メモ', value: v.desc },
                    ],
                }))),
            },
            {
                id: 'bengali-places',
                label: '実戦地名',
                description: 'バングラデシュの管区・地区名を読む',
                buildItems: () => PLACE_DATA.map(p => ({
                    prompt: p.q,
                    answer: p.a,
                    type: p.type,
                    note: p.desc,
                    mapQuery: p.type === 'District' ? `${p.a} District, Bangladesh` : `${p.a}, Bangladesh`,
                    detail: [
                        { label: '種別', value: p.type },
                        { label: '地名', value: p.a },
                        { label: 'メモ', value: p.desc },
                    ],
                })),
            },
        ],
    },
    cyrillic: {
        id: 'cyrillic',
        label: 'キリル文字（ロシア）',
        nativeLabel: 'Кириллица',
        description: 'ロシア語のキリル文字と、ロシア各地域の代表地名を練習します。',
        textClass: 'cyrillic-text',
        accent: 'sky',
        modes: [
            {
                id: 'cyrillic-letters',
                label: '文字',
                description: 'ロシア語キリル文字の基本音を読む',
                buildItems: () => CYRILLIC_DATA.map(c => ({
                    prompt: c.q,
                    answer: c.a,
                    type: c.type,
                    note: c.desc,
                    detail: [
                        { label: '読み', value: c.a },
                        { label: '分類', value: c.type },
                        { label: 'メモ', value: c.desc },
                    ],
                })),
            },
            {
                id: 'cyrillic-traps',
                label: 'ラテン似の罠',
                description: '見た目と音がずれやすい文字を重点練習',
                buildItems: () => CYRILLIC_DATA.filter(c => c.type.includes('罠')).map(c => ({
                    prompt: c.q,
                    answer: c.a,
                    type: c.type,
                    note: c.desc,
                    detail: [
                        { label: '読み', value: c.a },
                        { label: '注意', value: 'ラテン文字の見た目に引っ張られやすい文字' },
                        { label: 'メモ', value: c.desc },
                    ],
                })),
            },
            {
                id: 'russian-places',
                label: 'ロシア地名',
                description: '各連邦構成主体から代表地名を1つずつ読む',
                buildItems: () => RUSSIA_PLACE_DATA.map(p => ({
                    prompt: p.q,
                    answer: p.a,
                    type: p.type,
                    note: `${p.subject} / ${p.desc}`,
                    mapQuery: `${p.subject}, Russia`,
                    detail: [
                        { label: '代表地名', value: p.a },
                        { label: '地域', value: p.subject },
                        { label: '種別', value: p.type },
                        { label: 'メモ', value: p.desc },
                    ],
                })),
            },
        ],
    },
    devanagari: {
        id: 'devanagari',
        label: 'ヒンディー語',
        nativeLabel: 'हिन्दी',
        description: 'インドの地名看板向けに、デーヴァナーガリー文字と州・連邦直轄領の代表地名を練習します。',
        textClass: 'devanagari-text',
        accent: 'orange',
        modes: [
            {
                id: 'devanagari-letters',
                label: '文字',
                description: 'デーヴァナーガリーの基本文字を読む',
                buildItems: () => DEVANAGARI_DATA.map(c => ({
                    prompt: c.q,
                    answer: c.a,
                    type: c.type,
                    note: c.desc,
                    detail: [
                        { label: '読み', value: c.a },
                        { label: '分類', value: c.type },
                        { label: 'メモ', value: c.desc },
                    ],
                })),
            },
            {
                id: 'devanagari-vowels',
                label: '子音＋母音記号',
                description: '子音に母音記号を足した形を読む',
                guide: {
                    title: 'デーヴァナーガリーの子音＋母音記号',
                    points: [
                        '子音字には基本的に a が含まれる。記号が付くと、その母音に置き換わる。',
                        'ि は子音の左側に出るが、読む順番は子音＋i。',
                        '反り舌音 ट/ठ/ड/ढ と歯音 त/थ/द/ध は形と音の区別が重要。',
                    ],
                    examples: [
                        { text: 'क', reading: 'ka', note: 'क k に内在母音 a' },
                        { text: 'कि', reading: 'ki', note: 'ि は左に出るが k + i' },
                        { text: 'को', reading: 'ko', note: 'ो は k + o' },
                    ],
                },
                buildItems: () => DEVANAGARI_DATA.filter(c => c.type !== '母音').flatMap(c => DEVANAGARI_VOWEL_SIGNS.map(v => ({
                    prompt: `${c.q}${v.sign}`,
                    answer: `${getDevanagariStem(c.a)}${v.vowel}`,
                    type: '子音＋母音',
                    note: `${c.q} (${c.a}) + ${v.display}`,
                    detail: [
                        { label: '子音', value: `${c.q} / ${c.a} / ${c.type}` },
                        { label: '母音記号', value: `${v.display} / ${v.vowel}` },
                        { label: 'メモ', value: v.desc },
                    ],
                }))),
            },
            {
                id: 'india-places',
                label: 'インド地名',
                description: '州・連邦直轄領の代表地名を読む',
                buildItems: () => INDIA_PLACE_DATA.map(p => ({
                    prompt: p.q,
                    answer: p.a,
                    type: p.type,
                    note: `${p.region} / ${p.desc}`,
                    mapQuery: `${p.region}, India`,
                    detail: [
                        { label: '代表地名', value: p.a },
                        { label: '地域', value: p.region },
                        { label: '種別', value: p.type },
                        { label: 'メモ', value: p.desc },
                    ],
                })),
            },
        ],
    },
};

const THAI_VOWEL_PATTERNS = [
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

function getDevanagariStem(reading) {
    return reading.split('/')[0].trim().replace(/a$/, '');
}
