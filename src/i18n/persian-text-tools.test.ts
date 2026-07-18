import { describe, expect, it } from 'vitest';

import {
  convertEnglishDigitsToPersian,
  convertEnglishKeyboardToPersian,
  convertPersianDigitsToEnglish,
  convertPersianKeyboardToEnglish,
  normalizePersianCharacters,
} from './persian-text-tools';

describe('persian text tools', () => {
  it('converts Persian and Arabic digits to English digits', () => {
    expect(convertPersianDigitsToEnglish('سال ۱۴۰۳ و ٢٠٢٦')).toBe('سال 1403 و 2026');
  });

  it('converts English digits to Persian digits', () => {
    expect(convertEnglishDigitsToPersian('Invoice 12345')).toBe('Invoice ۱۲۳۴۵');
  });

  it('normalizes Arabic Persian lookalike characters', () => {
    expect(normalizePersianCharacters('علي كيان')).toBe('علی کیان');
  });

  it('converts keyboard-layout mistakes both ways', () => {
    expect(convertEnglishKeyboardToPersian('sghl')).toBe('سلام');
    expect(convertPersianKeyboardToEnglish('سلام')).toBe('sghl');
  });
});
