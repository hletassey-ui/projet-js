/**
 * MarkovChain.js
 * Modèle de Markov d'ordre N pour la prédiction de texte.
 * Gère à la fois la prédiction du mot suivant et la complétion de mot.
 */

export class MarkovChain {
  /**
   * @param {number} order - Ordre du modèle (nombre de mots précédents considérés)
   */
  constructor(order = 2) {
    this.order = order;
    // { "mot1 mot2": { "mot3": count, "mot4": count } }
    this.transitions = new Map();
    // { "prefix": ["mot1", "mot2"] } — index pour la complétion de mot
    this.vocabulary = new Set();
    // Stocke le corpus tokenisé pour les statistiques
    this.totalTokens = 0;
  }

  // ─────────────────────────────────────────────
  // ENTRAÎNEMENT
  // ─────────────────────────────────────────────

  /**
   * Entraîne le modèle sur un corpus texte.
   * @param {string} text
   */
  train(text) {
    const tokens = this._tokenize(text);
    this.totalTokens += tokens.length;

    tokens.forEach(word => this.vocabulary.add(word.toLowerCase()));

    for (let i = 0; i < tokens.length - 1; i++) {
      // On crée des clés pour chaque ordre de 1 à this.order
      for (let o = 1; o <= this.order; o++) {
        if (i - o + 1 < 0) continue;
        const contextWords = tokens.slice(i - o + 1, i + 1);
        const key = contextWords.join(' ').toLowerCase();
        const next = tokens[i + 1].toLowerCase();

        if (!this.transitions.has(key)) {
          this.transitions.set(key, new Map());
        }
        const nextMap = this.transitions.get(key);
        nextMap.set(next, (nextMap.get(next) || 0) + 1);
      }
    }
  }

  /**
   * Entraîne sur plusieurs textes.
   * @param {string[]} texts
   */
  trainMultiple(texts) {
    texts.forEach(t => this.train(t));
  }

  // ─────────────────────────────────────────────
  // PRÉDICTION DU MOT SUIVANT
  // ─────────────────────────────────────────────

  /**
   * Prédit les N mots les plus probables après un contexte donné.
   * @param {string[]} contextWords - Les derniers mots tapés
   * @param {number}   topN         - Nombre de suggestions
   * @returns {{ word: string, probability: number }[]}
   */
  predictNextWord(contextWords, topN = 3) {
    // Essai du contexte le plus long vers le plus court (back-off)
    for (let o = Math.min(this.order, contextWords.length); o >= 1; o--) {
      const key = contextWords.slice(-o).join(' ').toLowerCase();
      if (this.transitions.has(key)) {
        return this._rankCandidates(this.transitions.get(key), topN);
      }
    }
    return [];
  }

  // ─────────────────────────────────────────────
  // COMPLÉTION DE MOT (autocomplétion)
  // ─────────────────────────────────────────────

  /**
   * Propose des complétions pour un préfixe partiel.
   * Prend en compte le contexte pour scorer les candidats.
   * @param {string}   prefix       - Lettres déjà tapées du mot en cours
   * @param {string[]} contextWords - Mots précédents pour le scoring contextuel
   * @param {number}   topN
   * @returns {{ word: string, score: number }[]}
   */
  completeWord(prefix, contextWords = [], topN = 3) {
    if (!prefix) return [];

    const lowerPrefix = prefix.toLowerCase();
    const candidates = [...this.vocabulary].filter(w => w.startsWith(lowerPrefix) && w !== lowerPrefix);

    if (candidates.length === 0) return [];

    // Score = fréquence contextuelle + fréquence globale
    const contextScores = new Map();

    // Fréquences contextuelles
    for (let o = Math.min(this.order, contextWords.length); o >= 1; o--) {
      const key = contextWords.slice(-o).join(' ').toLowerCase();
      if (this.transitions.has(key)) {
        const nextMap = this.transitions.get(key);
        nextMap.forEach((count, word) => {
          if (word.startsWith(lowerPrefix)) {
            contextScores.set(word, (contextScores.get(word) || 0) + count * o); // bonus ordre élevé
          }
        });
      }
    }

    // Fréquences globales (contexte vide = unigramme)
    const globalFreq = this._getGlobalFrequencies();

    const scored = candidates.map(word => ({
      word,
      score: (contextScores.get(word) || 0) * 3 + (globalFreq.get(word) || 0),
    }));

    scored.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));
    return scored.slice(0, topN);
  }

  // ─────────────────────────────────────────────
  // GÉNÉRATION (bonus : génération de texte)
  // ─────────────────────────────────────────────

  /**
   * Génère une séquence de mots à partir d'un contexte.
   * @param {string[]} seed   - Mots de départ
   * @param {number}   length - Nombre de mots à générer
   * @returns {string}
   */
  generate(seed = [], length = 10) {
    const result = [...seed];
    for (let i = 0; i < length; i++) {
      const predictions = this.predictNextWord(result, 5);
      if (predictions.length === 0) break;
      // Échantillonnage probabiliste
      const word = this._sample(predictions);
      result.push(word);
    }
    return result.join(' ');
  }

  // ─────────────────────────────────────────────
  // SÉRIALISATION
  // ─────────────────────────────────────────────

  /**
   * Exporte le modèle en JSON (pour sauvegarde/chargement).
   */
  toJSON() {
    const transitions = {};
    this.transitions.forEach((nextMap, key) => {
      transitions[key] = Object.fromEntries(nextMap);
    });
    return JSON.stringify({
      order: this.order,
      transitions,
      vocabulary: [...this.vocabulary],
      totalTokens: this.totalTokens,
    });
  }

  /**
   * Importe un modèle depuis un JSON.
   * @param {string} json
   * @returns {MarkovChain}
   */
  static fromJSON(json) {
    const data = JSON.parse(json);
    const chain = new MarkovChain(data.order);
    chain.totalTokens = data.totalTokens;
    chain.vocabulary = new Set(data.vocabulary);
    Object.entries(data.transitions).forEach(([key, nextObj]) => {
      chain.transitions.set(key, new Map(Object.entries(nextObj)));
    });
    return chain;
  }

  // ─────────────────────────────────────────────
  // UTILITAIRES PRIVÉS
  // ─────────────────────────────────────────────

  _tokenize(text) {
    return text
      .replace(/["""«»]/g, '"')
      .replace(/['']/g, "'")
      .split(/\s+/)
      .map(w => w.replace(/^[^a-zA-ZÀ-ÿ']+|[^a-zA-ZÀ-ÿ']+$/g, ''))
      .filter(w => w.length > 0);
  }

  _rankCandidates(nextMap, topN) {
    const total = [...nextMap.values()].reduce((a, b) => a + b, 0);
    return [...nextMap.entries()]
      .map(([word, count]) => ({ word, probability: count / total }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, topN);
  }

  _getGlobalFrequencies() {
    const freq = new Map();
    this.transitions.forEach((nextMap, key) => {
      if (!key.includes(' ')) { // unigrammes uniquement
        nextMap.forEach((count, word) => {
          freq.set(word, (freq.get(word) || 0) + count);
        });
      }
    });
    return freq;
  }

  _sample(candidates) {
    const total = candidates.reduce((s, c) => s + (c.probability || c.score || 1), 0);
    let rand = Math.random() * total;
    for (const c of candidates) {
      rand -= (c.probability || c.score || 1);
      if (rand <= 0) return c.word;
    }
    return candidates[0].word;
  }

  // ─────────────────────────────────────────────
  // STATISTIQUES
  // ─────────────────────────────────────────────

  getStats() {
    return {
      vocabularySize: this.vocabulary.size,
      ngramCount: this.transitions.size,
      totalTokens: this.totalTokens,
      order: this.order,
    };
  }
}
