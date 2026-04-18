/**
 * TextAnalyzer.js
 * Utilitaires d'analyse de texte : tokenisation avancée, statistiques, nettoyage.
 */

export class TextAnalyzer {
  /**
   * Détecte la langue approximative du texte (fr/en).
   * Basé sur des mots courants.
   */
  static detectLanguage(text) {
    const frWords = ['le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'est', 'je', 'tu', 'il', 'nous', 'vous', 'ils'];
    const enWords = ['the', 'a', 'an', 'and', 'is', 'are', 'i', 'you', 'he', 'we', 'they', 'in', 'on', 'at'];

    const tokens = text.toLowerCase().split(/\s+/);
    let frCount = 0, enCount = 0;
    tokens.forEach(t => {
      if (frWords.includes(t)) frCount++;
      if (enWords.includes(t)) enCount++;
    });
    return frCount >= enCount ? 'fr' : 'en';
  }

  /**
   * Nettoie et normalise un texte.
   */
  static normalize(text) {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ ]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Extrait les N-grammes de mots d'un texte.
   * @param {string} text
   * @param {number} n
   * @returns {string[][]}
   */
  static extractNGrams(text, n = 2) {
    const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const ngrams = [];
    for (let i = 0; i <= words.length - n; i++) {
      ngrams.push(words.slice(i, i + n));
    }
    return ngrams;
  }

  /**
   * Fréquences de mots (unigrammes).
   * @param {string} text
   * @returns {Map<string, number>}
   */
  static wordFrequency(text) {
    const freq = new Map();
    text.toLowerCase().split(/\s+/).filter(Boolean).forEach(w => {
      freq.set(w, (freq.get(w) || 0) + 1);
    });
    return new Map([...freq.entries()].sort((a, b) => b[1] - a[1]));
  }

  /**
   * Nombre de mots, phrases, caractères.
   */
  static getStats(text) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    return {
      chars: text.length,
      words: words.length,
      sentences: sentences.length,
      avgWordLength: words.reduce((s, w) => s + w.length, 0) / (words.length || 1),
    };
  }

  /**
   * Divise un texte en phrases.
   */
  static splitSentences(text) {
    return text
      .replace(/([.!?])\s+/g, '$1\n')
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 3);
  }
}
