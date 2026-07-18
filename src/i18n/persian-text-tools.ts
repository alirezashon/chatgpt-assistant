const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;
const ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'] as const;

const ENGLISH_TO_PERSIAN_KEYBOARD: Readonly<Record<string, string>> = {
  "'": 'گ',
  ',': 'و',
  ';': 'ک',
  '[': 'ج',
  ']': 'چ',
  a: 'ش',
  b: 'ذ',
  c: 'ز',
  d: 'ی',
  e: 'ث',
  f: 'ب',
  g: 'ل',
  h: 'ا',
  i: 'ه',
  j: 'ت',
  k: 'ن',
  l: 'م',
  m: 'پ',
  n: 'د',
  o: 'خ',
  p: 'ح',
  q: 'ض',
  r: 'ق',
  s: 'س',
  t: 'ف',
  u: 'ع',
  v: 'ر',
  w: 'ص',
  x: 'ط',
  y: 'غ',
  z: 'ظ',
};

const PERSIAN_TO_ENGLISH_KEYBOARD = Object.fromEntries(
  Object.entries(ENGLISH_TO_PERSIAN_KEYBOARD).map(([english, persian]) => [persian, english]),
) as Readonly<Record<string, string>>;

export function convertPersianDigitsToEnglish(value: string): string {
  return value.replace(/[۰-۹٠-٩]/gu, (character) => {
    const persianIndex = PERSIAN_DIGITS.indexOf(character as (typeof PERSIAN_DIGITS)[number]);
    const arabicIndex = ARABIC_DIGITS.indexOf(character as (typeof ARABIC_DIGITS)[number]);

    if (persianIndex >= 0) {
      return persianIndex.toString();
    }

    return arabicIndex >= 0 ? arabicIndex.toString() : character;
  });
}

export function convertEnglishDigitsToPersian(value: string): string {
  return value.replace(/\d/gu, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit);
}

export function normalizePersianCharacters(value: string): string {
  return value
    .replace(/ي/gu, 'ی')
    .replace(/ك/gu, 'ک')
    .replace(/ۀ/gu, 'ه')
    .replace(/ة/gu, 'ه')
    .replace(/ؤ/gu, 'و')
    .replace(/إ|أ|ٱ/gu, 'ا')
    .replace(/\u0640/gu, '');
}

export function convertEnglishKeyboardToPersian(value: string): string {
  return value.replace(/[a-z[\];',]/giu, (character) => {
    return ENGLISH_TO_PERSIAN_KEYBOARD[character.toLowerCase()] ?? character;
  });
}

export function convertPersianKeyboardToEnglish(value: string): string {
  return value.replace(/[ضصثقفغعهخحجچشسیبلاتنمکگظطزرذدپو]/gu, (character) => {
    return PERSIAN_TO_ENGLISH_KEYBOARD[character] ?? character;
  });
}

export function normalizePersianText(value: string): string {
  return normalizePersianCharacters(convertEnglishDigitsToPersian(value)).trim();
}
