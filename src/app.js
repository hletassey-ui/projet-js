/**
 * app.js
 * Point d'entrée de l'application.
 * Initialise le Predictor et connecte l'UI.
 */

import { Predictor } from './core/Predictor.js';
import { KeyboardUI } from './ui/KeyboardUI.js';
import { StatsPanel } from './ui/StatsPanel.js';

async function main() {
  // ── Instanciation ──────────────────────────────────────────
  const predictor = new Predictor({ order: 2, language: 'fr' });
  const ui = new KeyboardUI(document.getElementById('app'));
  const stats = new StatsPanel(document.getElementById('stats-panel'));

  // ── Chargement du modèle ────────────────────────────────────
  ui.setStatus('loading', 'Chargement du modèle…');

  let modelStats;
  const loaded = predictor.loadFromStorage();
  if (loaded) {
    modelStats = predictor.getStats();
    ui.setStatus('ready', `Modèle restauré (${modelStats.vocabularySize} mots)`);
  } else {
    modelStats = await predictor.initialize();
    ui.setStatus('ready', `Modèle prêt (${modelStats.vocabularySize} mots)`);
  }
  stats.update(modelStats);

  // ── Événements UI ───────────────────────────────────────────

  // L'utilisateur tape → on calcule des suggestions
  ui.onInput(inputText => {
    const result = predictor.getSuggestions(inputText, 3);
    ui.showSuggestions(result);
  });

  // L'utilisateur clique sur une suggestion → on insère
  ui.onSuggestionClick(suggestion => {
    ui.insertSuggestion(suggestion);
  });

  // L'utilisateur valide une phrase (Enter ou bouton Envoyer)
  ui.onSubmit(text => {
    predictor.learnFromInput(text);
    const s = predictor.getStats();
    stats.update(s);
    ui.clearInput();
    ui.addMessage(text);
  });

  // Bouton "Générer une phrase" (demo)
  ui.onGenerate(contextWords => {
    const generated = predictor.generateSample(contextWords, 10);
    ui.setInputValue(generated);
  });

  // Bouton "Réinitialiser le modèle"
  ui.onReset(async () => {
    predictor.reset();
    const s = await predictor.initialize();
    stats.update(s);
    ui.setStatus('ready', `Modèle réinitialisé (${s.vocabularySize} mots)`);
  });

  // Bouton "Charger un texte personnalisé"
  ui.onLoadCustomText(async (text) => {
    ui.setStatus('loading', 'Entraînement en cours…');
    predictor.chain.train(text);
    predictor._trained = true;
    const s = predictor.getStats();
    stats.update(s);
    predictor.saveToStorage();
    ui.setStatus('ready', `Entraînement terminé (${s.vocabularySize} mots)`);
  });
}

main().catch(console.error);
