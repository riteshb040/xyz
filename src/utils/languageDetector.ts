/**
 * Fast, deterministic multi-lingual language detector for customer voice inputs.
 * Detects Hindi, Gujarati, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Punjabi, Odia, Urdu, English, etc.
 */

export interface LanguageDetectionResult {
  code: string;
  name: string;
  script: string;
}

export function detectInputLanguage(text: string): LanguageDetectionResult {
  if (!text || !text.trim()) {
    return { code: 'hi-IN', name: 'Hindi / Hinglish', script: 'Hinglish' };
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Script-based Unicode checks (Covering 100% of Indian Native Scripts)
  // Gujarati Script: U+0A80 to U+0AFF
  if (/[\u0A80-\u0AFF]/.test(clean)) {
    return { code: 'gu-IN', name: 'Gujarati', script: 'Gujarati' };
  }

  // Devanagari Script: U+0900 to U+097F
  if (/[\u0900-\u097F]/.test(clean)) {
    if (/\b(आहे|नाही|माझं|नाव|तुम्ही|कोणाला|केलं|काय|म्हटलं|भाऊ)\b/i.test(clean)) {
      return { code: 'mr-IN', name: 'Marathi', script: 'Marathi Devanagari' };
    }
    return { code: 'hi-IN', name: 'Hindi', script: 'Devanagari Hindi' };
  }

  // Tamil Script: U+0B80 to U+0BFF
  if (/[\u0B80-\u0BFF]/.test(clean)) {
    return { code: 'ta-IN', name: 'Tamil', script: 'Tamil' };
  }

  // Telugu Script: U+0C00 to U+0C7F
  if (/[\u0C00-\u0C7F]/.test(clean)) {
    return { code: 'te-IN', name: 'Telugu', script: 'Telugu' };
  }

  // Kannada Script: U+0C80 to U+0CFF
  if (/[\u0C80-\u0CFF]/.test(clean)) {
    return { code: 'kn-IN', name: 'Kannada', script: 'Kannada' };
  }

  // Malayalam Script: U+0D00 to U+0D7F
  if (/[\u0D00-\u0D7F]/.test(clean)) {
    return { code: 'ml-IN', name: 'Malayalam', script: 'Malayalam' };
  }

  // Bengali Script: U+0980 to U+09FF
  if (/[\u0980-\u09FF]/.test(clean)) {
    return { code: 'bn-IN', name: 'Bengali', script: 'Bengali' };
  }

  // Gurmukhi (Punjabi) Script: U+0A00 to U+0A7F
  if (/[\u0A00-\u0A7F]/.test(clean)) {
    return { code: 'pa-IN', name: 'Punjabi', script: 'Gurmukhi' };
  }

  // Odia Script: U+0B00 to U+0B7F
  if (/[\u0B00-\u0B7F]/.test(clean)) {
    return { code: 'or-IN', name: 'Odia', script: 'Odia' };
  }

  // Arabic / Urdu Script: U+0600 to U+06FF
  if (/[\u0600-\u06FF]/.test(clean)) {
    return { code: 'ur-IN', name: 'Urdu', script: 'Urdu' };
  }

  // 2. High-Precision Romanized Keyword Matching for Code-Switched Dialects

  // Tamil (Tanglish)
  const tamilRegex = /\b(vanakkam|epdi|irukinga|ama|illa|pannunga|solunga|kudunga|kaasu|yen|enakkum|theriyuma|yenpa|da|poda|vanga)\b/i;
  if (tamilRegex.test(lower)) {
    return { code: 'ta-IN', name: 'Tamil (Tanglish)', script: 'Tamil / Tanglish' };
  }

  // Telugu (Teluglish)
  const teluguRegex = /\b(namaskaram|ela|unnaru|avunu|ledhu|ivandi|cheppandi|eppudu|dabbulu|repu|entha|kavali|cheyyandi|leka)\b/i;
  if (teluguRegex.test(lower)) {
    return { code: 'te-IN', name: 'Telugu (Teluglish)', script: 'Telugu / Teluglish' };
  }

  // Kannada (Kannadish)
  const kannadaRegex = /\b(namaskara|hegidira|houdu|illa|kodi|kotte|hege|madi|haana|yaavaga|nange|beku|yaake|baruthe)\b/i;
  if (kannadaRegex.test(lower)) {
    return { code: 'kn-IN', name: 'Kannada (Kannadish)', script: 'Kannada / Kannadish' };
  }

  // Malayalam (Malayalish)
  const malayalamRegex = /\b(namaskaram|engine|unndo|illa|theram|parayu|eppol|paisa|kodukkam|nokkam|venam|ariyilla)\b/i;
  if (malayalamRegex.test(lower)) {
    return { code: 'ml-IN', name: 'Malayalam (Malayalish)', script: 'Malayalam / Malayalish' };
  }

  // Bengali (Benglish)
  const bengaliRegex = /\b(namoshkar|kemon|achen|hae|na|debo|bolun|kobe|taka|dite|amake|jani|dorkar)\b/i;
  if (bengaliRegex.test(lower)) {
    return { code: 'bn-IN', name: 'Bengali (Benglish)', script: 'Bengali / Benglish' };
  }

  // Punjabi (Punjabish)
  const punjabiRegex = /\b(sat\s+sri\s+akal|kiddan|haa|nahi|daange|daso|kadon|paise|gal|karo|bhaiji|paaji)\b/i;
  if (punjabiRegex.test(lower)) {
    return { code: 'pa-IN', name: 'Punjabi (Punjabish)', script: 'Punjabi / Punjabish' };
  }

  // Gujarati (Gujlish)
  const gujaratiRegex = /\b(chu|che|chhe|pela|peli|pelo|khabar|kone|klaryo|karyo|karje|karela|aje|evo|evi|evu|manas|khoto|khota|kaap|nathi|kaoi|kai|tamare|tamne|tame|kale|aapis|shun|su|mari|maru|tamaru|joiyie|jankari|kem|kemcho|bhai\s+hu|hu\s+kon|paisa\s+nathi|jo\s+pela|number\s+jo)\b/i;
  if (gujaratiRegex.test(lower)) {
    return { code: 'gu-IN', name: 'Gujarati (Gujlish)', script: 'Gujarati / Gujlish' };
  }

  // Marathi (Marathlish)
  const marathiRegex = /\b(maza|naav|nav|ahe|tumhi|konala|kela|kasa|mhanje|kahi|mhanun|pan|mala|nako|bolla|bolat|khoto|bhau)\b/i;
  if (marathiRegex.test(lower)) {
    return { code: 'mr-IN', name: 'Marathi (Marathlish)', script: 'Marathi / Marathlish' };
  }

  // Hindi / Hinglish
  const hindiRegex = /\b(main|aaj|nahi|kar|sakta|sakti|problem|hai|bhai|btao|dunga|dungi|thodi|kya|he|re|sale|me|kaun|hu|pta|tuje|tujhe|mujhe|kisi|karna|karo|paise|kaise|kab|raha|rha|hoon|baat|karke|batao|aapse|achha|accha|kardo|baad|mat|pareshan|bak|samaj|essa|bol)\b/i;
  if (hindiRegex.test(lower)) {
    return { code: 'hi-IN', name: 'Hindi / Hinglish', script: 'Hinglish' };
  }

  // 3. Fallback to English
  return { code: 'en-IN', name: 'English', script: 'English' };
}
