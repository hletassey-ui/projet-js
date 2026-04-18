/**
 * Predictor.js
 * Façade haut niveau : orchestre MarkovChain pour l'interface clavier.
 * Gère le contexte courant, le corpus intégré et l'apprentissage en temps réel.
 */

import { MarkovChain } from './MarkovChain.js';
import { CORPUS_FR } from '../utils/corpus.js';

export class Predictor {
  constructor({ order = 2, language = 'fr' } = {}) {
    this.chain = new MarkovChain(order);
    this.language = language;
    this._trained = false;
    this._sessionTokens = 0;
  }

  // ─────────────────────────────────────────────
  // INITIALISATION
  // ─────────────────────────────────────────────

  /**
   * Charge et entraîne sur le corpus intégré + corpus personnalisé optionnel.
   * @param {string[]} extraTexts - Textes supplémentaires de l'utilisateur
   */
  async initialize(extraTexts = []) {
    const allTexts = [CORPUS_FR, ...extraTexts];
    this.chain.trainMultiple(allTexts);
    this._trained = true;
    return this.chain.getStats();
  }

  /**
   * Charge un modèle sauvegardé depuis le localStorage.
   */
  loadFromStorage() {
    const saved = localStorage.getItem('markov_model');
    if (saved) {
      this.chain = MarkovChain.fromJSON(saved);
      this._trained = true;
      return true;
    }
    return false;
  }

  /**
   * Sauvegarde le modèle courant dans le localStorage.
   */
  saveToStorage() {
    localStorage.setItem('markov_model', this.chain.toJSON());
  }

  // ─────────────────────────────────────────────
  // INTERFACE PRINCIPALE
  // ─────────────────────────────────────────────

  /**
   * Point d'entrée principal : analyse le texte courant du champ de saisie.
   * Retourne des suggestions adaptées (complétion ou prédiction).
   *
   * @param {string} inputText - Contenu complet du champ de saisie
   * @param {number} topN
   * @returns {{ type: 'completion'|'prediction', suggestions: any[] }}
   */
  getSuggestions(inputText, topN = 3) {
    if (!this._trained) return { type: 'prediction', suggestions: [] };

    const trimmed = inputText.trimStart();
    const endsWithSpace = inputText.endsWith(' ');
    const words = trimmed.split(/\s+/).filter(Boolean);

    // Si vide ou juste un espace → pas de suggestion
    if (words.length === 0) return { type: 'prediction', suggestions: [] };

    if (endsWithSpace) {
      // L'utilisateur vient de finir un mot → prédire le SUIVANT
      const suggestions = this.chain.predictNextWord(words, topN);
      return { type: 'prediction', suggestions };
    } else {
      // L'utilisateur est en train de taper → compléter le MOT COURANT
      const currentWord = words[words.length - 1];
      const context = words.slice(0, -1);

      // Si le mot courant est trop court (1 lettre) on reste prudent
      if (currentWord.length < 1) return { type: 'prediction', suggestions: [] };

      const suggestions = this.chain.completeWord(currentWord, context, topN);
      return { type: 'completion', suggestions, prefix: currentWord };
    }
  }

  /**
   * Apprend en ligne depuis le texte saisi par l'utilisateur.
   * À appeler lorsqu'une phrase est validée (Enter, point, etc.)
   * @param {string} text
   */
  learnFromInput(text) {
    if (text.trim().length < 3) return;
    this.chain.train(text);
    this._sessionTokens++;

    // Auto-sauvegarde toutes les 10 contributions
    if (this._sessionTokens % 10 === 0) {
      this.saveToStorage();
    }
  }

  /**
   * Génère une phrase d'exemple à partir du contexte actuel.
   * @param {string[]} context
   * @param {number}   length
   */
  generateSample(context, length = 8) {
    return this.chain.generate(context, length);
  }

  getStats() {
    return {
      ...this.chain.getStats(),
      sessionContributions: this._sessionTokens,
    };
  }

  reset() {
    this.chain = new MarkovChain(this.chain.order);
    this._trained = false;
    this._sessionTokens = 0;
    localStorage.removeItem('markov_model');
  }
}
