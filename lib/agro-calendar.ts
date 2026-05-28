export type CropPlanStep = {
  title: string;
  description: string;
  offsetDays: number;
  taskType: string;
};

export type CropStageRow = {
  stage: string;
  period: string;
  goal: string;
  nutrition: string;
  frequency: string;
  plantingScheme: string;
  taskType: string;
  offsetDays: number;
};

export type CropGuide = {
  key: string;
  name: string;
  category: "VEGETABLE" | "FRUIT";
  image: string;
  summary: string;
  plantingEarly: string;
  plantingMain: string;
  plantingLate: string;
  harvestWindow: string;
  plantingScheme: string;
  steps: CropPlanStep[];
  calendarRows: CropStageRow[];
};

const DEFAULT_STEPS: CropPlanStep[] = [
  {
    title: "Сеитба",
    description: "Подготовка и засяване според сезона и условията на полето.",
    offsetDays: 0,
    taskType: "SEEDING",
  },
  {
    title: "Първо окопаване",
    description: "Разрохкване и отстраняване на плевели за по-добра аерация.",
    offsetDays: 20,
    taskType: "HOEING",
  },
  {
    title: "Първо пръскане",
    description: "Превантивно третиране спрямо риска от болести и неприятели.",
    offsetDays: 30,
    taskType: "SPRAYING",
  },
  {
    title: "Контрол и подхранване",
    description: "Преглед на растенията и коригиращо подхранване.",
    offsetDays: 45,
    taskType: "FEEDING",
  },
];

const IMG = "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80";

const DEFAULT_ROWS: CropStageRow[] = [
  {
    stage: "Подготовка на площта",
    period: "7-14 дни преди засаждане",
    goal: "Старт с чиста площ и добра структура на почвата.",
    nutrition: "Органика + базов NPK с повече фосфор.",
    frequency: "Еднократно преди старта.",
    plantingScheme: "Според културата.",
    taskType: "SEEDING",
    offsetDays: -10,
  },
  {
    stage: "Засаждане / сеитба",
    period: "Начало на периода за културата",
    goal: "Равномерно поникване и вкореняване.",
    nutrition: "Стартер с умерен азот.",
    frequency: "В деня на засаждане.",
    plantingScheme: "По редове и междуредия.",
    taskType: "SEEDING",
    offsetDays: 0,
  },
  {
    stage: "Начален растеж",
    period: "10-20 дни след засаждане",
    goal: "Силен листен апарат.",
    nutrition: "Баланс NPK + микроелементи при нужда.",
    frequency: "На 7-10 дни.",
    plantingScheme: "Контрол на гъстотата.",
    taskType: "FEEDING",
    offsetDays: 14,
  },
  {
    stage: "Окопаване и поддръжка",
    period: "2-4 седмици след засаждане",
    goal: "Плевелоконтрол и аерация.",
    nutrition: "Леко азотно подхранване при нужда.",
    frequency: "1-2 обработки.",
    plantingScheme: "Около реда и в междуредията.",
    taskType: "HOEING",
    offsetDays: 21,
  },
  {
    stage: "Растителна защита",
    period: "От вегетация до беритба",
    goal: "Предпазване от болести и неприятели.",
    nutrition: "Листни торове при стрес.",
    frequency: "На 10-14 дни според условията.",
    plantingScheme: "Пълно покритие на растенията.",
    taskType: "SPRAYING",
    offsetDays: 30,
  },
  {
    stage: "Косене около насаждението",
    period: "След прихващане до края на сезона",
    goal: "Чисти междуредия и по-малко плевели.",
    nutrition: "Не се прилага.",
    frequency: "На 2-3 седмици.",
    plantingScheme: "Около редовете/овошките.",
    taskType: "MOWING",
    offsetDays: 35,
  },
  {
    stage: "Беритба",
    period: "Според зрелостта",
    goal: "Качествена и навременна реколта.",
    nutrition: "Калиево подхранване при нужда.",
    frequency: "Периодично/поетапно.",
    plantingScheme: "Селективно обиране.",
    taskType: "HARVESTING",
    offsetDays: 75,
  },
];

type CropSeed = {
  name: string;
  category: "VEGETABLE" | "FRUIT";
  early: string;
  main: string;
  late: string;
  harvest: string;
  scheme: string;
  summary: string;
};

const CROP_SEEDS: CropSeed[] = [
  { name: "Домати", category: "VEGETABLE", early: "II-III (разсад)", main: "IV-V", late: "VI", harvest: "VII-X", scheme: "70x30 см", summary: "Полска и оранжерийна култура." },
  { name: "Краставици", category: "VEGETABLE", early: "III-IV", main: "IV-V", late: "VI-VII", harvest: "VI-IX", scheme: "100x35 см", summary: "Нуждае се от редовна влага." },
  { name: "Чушки", category: "VEGETABLE", early: "II-III (разсад)", main: "IV-V", late: "VI", harvest: "VII-X", scheme: "60x25 см", summary: "Топлолюбива култура." },
  { name: "Патладжан", category: "VEGETABLE", early: "II-III", main: "V", late: "VI", harvest: "VII-X", scheme: "70x40 см", summary: "Изисква затоплена почва." },
  { name: "Картофи", category: "VEGETABLE", early: "II-III", main: "III-IV", late: "V", harvest: "VI-IX", scheme: "70x25 см", summary: "Задължително окопаване." },
  { name: "Лук", category: "VEGETABLE", early: "II-III", main: "III-IV", late: "IX", harvest: "VI-VIII", scheme: "25x8 см", summary: "Пролетно и есенно производство." },
  { name: "Чесън", category: "VEGETABLE", early: "II", main: "X-XI", late: "III", harvest: "VI-VII", scheme: "25x10 см", summary: "Есенен и пролетен чесън." },
  { name: "Зеле", category: "VEGETABLE", early: "II-III", main: "IV-V", late: "VI-VII", harvest: "VI-XI", scheme: "70x40 см", summary: "Ранно, средно и късно." },
  { name: "Карфиол", category: "VEGETABLE", early: "III", main: "IV-V", late: "VII", harvest: "VI-X", scheme: "60x45 см", summary: "Чувствителен към жега." },
  { name: "Броколи", category: "VEGETABLE", early: "III", main: "IV-V", late: "VII-VIII", harvest: "VI-XI", scheme: "60x45 см", summary: "Предпочита прохлада." },
  { name: "Моркови", category: "VEGETABLE", early: "II-III", main: "IV-V", late: "VII-VIII", harvest: "V-XI", scheme: "25x5 см", summary: "Директна сеитба на етапи." },
  { name: "Магданоз", category: "VEGETABLE", early: "II-III", main: "IV-V", late: "VIII", harvest: "V-XI", scheme: "25x5 см", summary: "За листа и корен." },
  { name: "Цвекло", category: "VEGETABLE", early: "III", main: "IV-VI", late: "VII", harvest: "VI-X", scheme: "40x8 см", summary: "Кореноплодна култура." },
  { name: "Спанак", category: "VEGETABLE", early: "II-III", main: "IV", late: "VIII-X", harvest: "III-XI", scheme: "25x5 см", summary: "Кратък цикъл." },
  { name: "Маруля", category: "VEGETABLE", early: "II-III", main: "IV-V", late: "VIII-IX", harvest: "IV-XI", scheme: "30x25 см", summary: "Последователни засаждания." },
  { name: "Репички", category: "VEGETABLE", early: "II-III", main: "IV-V", late: "VIII-X", harvest: "III-XI", scheme: "20x4 см", summary: "Много кратка култура." },
  { name: "Зелен фасул", category: "VEGETABLE", early: "IV", main: "V-VI", late: "VII", harvest: "VI-IX", scheme: "50x10 см", summary: "Топлолюбив." },
  { name: "Грах", category: "VEGETABLE", early: "II-III", main: "IV", late: "VIII", harvest: "V-VII", scheme: "30x5 см", summary: "Ранна култура." },
  { name: "Тиквички", category: "VEGETABLE", early: "III-IV", main: "IV-V", late: "VII", harvest: "VI-X", scheme: "100x70 см", summary: "Бързорастящи." },
  { name: "Тикви", category: "VEGETABLE", early: "IV", main: "V", late: "VI", harvest: "IX-XI", scheme: "150x100 см", summary: "Дълъг вегетационен период." },
  { name: "Ягоди", category: "FRUIT", early: "III", main: "IV-V", late: "VIII-IX", harvest: "V-VII", scheme: "80x30 см", summary: "Интензивни грижи." },
  { name: "Малини", category: "FRUIT", early: "III", main: "IV", late: "X", harvest: "VI-IX", scheme: "250x50 см", summary: "Редови насаждения." },
  { name: "Къпини", category: "FRUIT", early: "III", main: "IV", late: "X-XI", harvest: "VII-IX", scheme: "300x80 см", summary: "Опорна конструкция." },
  { name: "Ябълки", category: "FRUIT", early: "III", main: "X-XI", late: "IV", harvest: "VIII-X", scheme: "400x200 см", summary: "Овощни насаждения." },
  { name: "Круши", category: "FRUIT", early: "III", main: "X-XI", late: "IV", harvest: "VIII-X", scheme: "450x250 см", summary: "Овощна култура." },
  { name: "Сливи", category: "FRUIT", early: "III", main: "X-XI", late: "IV", harvest: "VII-IX", scheme: "450x300 см", summary: "Изискват резитба." },
  { name: "Череши", category: "FRUIT", early: "III", main: "X-XI", late: "IV", harvest: "V-VII", scheme: "500x350 см", summary: "Чувствителни към валежи." },
  { name: "Праскови", category: "FRUIT", early: "III", main: "X-XI", late: "IV", harvest: "VII-IX", scheme: "450x300 см", summary: "Активна защита." },
  { name: "Кайсии", category: "FRUIT", early: "III", main: "X-XI", late: "IV", harvest: "VI-VII", scheme: "500x400 см", summary: "Ранноцъфтящи." },
];

const EXTRA_CROPS = [
  "Ряпа","Пащърнак","Целина","Кейл","Къдраво зеле","Праз","Копър","Рукола","Босилек","Мента","Маточина","Кориандър","Синап","Сладка царевица","Нахут","Леща","Соя","Фъстък","Диня","Пъпеш","Артишок","Аспержи","Бамя","Хрян","Батат","Черен корен","Ендивия","Цикория","Лапад","Киселец","Киноа","Амарант","Слънчоглед","Рапица","Люцерна","Ечемик","Пшеница","Ръж","Овес","Тритикале","Сорго","Просо","Лен","Тютюн","Лавандула","Розмарин","Салвия","Мащерка","Риган","Естрагон","Невен","Камомила","Хмел","Арония","Боровинки","Касис","Червено френско грозде","Цариградско грозде","Дюля","Нар","Смокини","Лешници","Орехи","Бадеми","Кестени","Черници","Киви","Актинидия","Лозя десертни","Лозя винени","Шипка","Бъз","Японска дюля","Облепиха","Годжи бери","Вишни","Нектарини"
] as const;

function buildRows(scheme: string): CropStageRow[] {
  return DEFAULT_ROWS.map((r) => ({ ...r, plantingScheme: scheme }));
}

function toGuide(seed: CropSeed): CropGuide {
  return {
    key: normalizeCropName(seed.name).replace(/\s+/g, "-"),
    name: seed.name,
    category: seed.category,
    image: IMG,
    summary: seed.summary,
    plantingEarly: seed.early,
    plantingMain: seed.main,
    plantingLate: seed.late,
    harvestWindow: seed.harvest,
    plantingScheme: seed.scheme,
    steps: [
      ...DEFAULT_STEPS,
      {
        title: "Косене около насаждението",
        description: "Косене и поддръжка около редовете/овошките.",
        offsetDays: 35,
        taskType: "MOWING",
      },
    ],
    calendarRows: buildRows(seed.scheme),
  };
}

const extraGuides: CropGuide[] = EXTRA_CROPS.map((name) =>
  toGuide({
    name,
    category: name.includes("грозде") || name.includes("Лозя") || name.includes("Орех") || name.includes("Бадем") || name.includes("Киви") ? "FRUIT" : "VEGETABLE",
    early: "II-III",
    main: "IV-V",
    late: "VIII-IX",
    harvest: "VI-X",
    scheme: "60x30 см",
    summary: "Стандартен агрономически шаблон; коригирай по регион и сорт.",
  }),
);

export const CROP_GUIDES: CropGuide[] = [...CROP_SEEDS.map(toGuide), ...extraGuides];

function normalizeCropName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function findCropGuide(name: string): CropGuide | null {
  const normalized = normalizeCropName(name);
  return (
    CROP_GUIDES.find((g) => normalizeCropName(g.name) === normalized) ??
    CROP_GUIDES.find((g) => normalized.includes(normalizeCropName(g.name))) ??
    null
  );
}

export function getGuideStepsForCrop(cropName: string): CropPlanStep[] {
  return findCropGuide(cropName)?.steps ?? DEFAULT_STEPS;
}

export function buildAutoTaskPlan(cropName: string, plantingDate: string) {
  const planting = new Date(`${plantingDate}T12:00:00`);
  return getGuideStepsForCrop(cropName).map((step) => {
    const due = new Date(planting);
    due.setDate(due.getDate() + step.offsetDays);
    const dueDate = due.toISOString().slice(0, 10);
    return {
      type: step.taskType,
      dueDate,
      notes: `${step.title}: ${step.description}`,
    };
  });
}

export function getCalendarCatalog() {
  return CROP_GUIDES;
}

export function getGuideByKey(key: string): CropGuide | null {
  return CROP_GUIDES.find((g) => g.key === key) ?? null;
}

const MONTH_MAP: Record<string, number> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
  XI: 11,
  XII: 12,
};

/** Парсва римски месеци от низ като "II-III", "X-XI", "IV-V, VIII" */
export function parseMonthsFromWindow(windowText: string): number[] {
  const tokens = windowText.toUpperCase().match(/\b(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII)\b/g) ?? [];
  const months = tokens.map((t) => MONTH_MAP[t]).filter((x): x is number => Number.isInteger(x));
  if (months.length < 2) return months;

  const result: number[] = [];
  for (let i = 0; i < months.length - 1; i += 2) {
    const start = months[i];
    const end = months[i + 1];
    if (start <= end) {
      for (let m = start; m <= end; m += 1) result.push(m);
    } else {
      for (let m = start; m <= 12; m += 1) result.push(m);
      for (let m = 1; m <= end; m += 1) result.push(m);
    }
  }
  if (months.length % 2 === 1) {
    result.push(months[months.length - 1]);
  }
  return [...new Set(result)];
}
