/**
 * StatsPanel.js
 * Panneau latéral affichant les statistiques du modèle en temps réel.
 */

export class StatsPanel {
  constructor(container) {
    this.container = container;
    this._render();
  }

  _render() {
    this.container.innerHTML = `
      <div class="stats-header">
        <span class="stats-icon">📊</span>
        <h3>Statistiques du modèle</h3>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" id="stat-vocab">—</div>
          <div class="stat-label">Mots connus</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-ngrams">—</div>
          <div class="stat-label">N-grammes</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-tokens">—</div>
          <div class="stat-label">Tokens traités</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" id="stat-order">—</div>
          <div class="stat-label">Ordre Markov</div>
        </div>
        <div class="stat-card stat-card--wide">
          <div class="stat-value" id="stat-session">0</div>
          <div class="stat-label">Phrases apprises (session)</div>
        </div>
      </div>

      <div class="stats-explainer">
        <h4>Comment ça marche ?</h4>
        <p>Le modèle de Markov apprend les probabilités de transition entre les mots. À chaque saisie, il consulte les <strong>N mots précédents</strong> pour prédire le suivant, avec un mécanisme de <em>back-off</em> si le contexte est inconnu.</p>
        <p>Plus vous écrivez, plus le modèle s'affine — il apprend de votre style en temps réel.</p>
      </div>

      <div class="shortcuts-box">
        <h4>Raccourcis</h4>
        <div class="shortcut"><kbd>Tab</kbd> Accepter la 1ʳᵉ suggestion</div>
        <div class="shortcut"><kbd>Entrée</kbd> Envoyer le message</div>
        <div class="shortcut"><kbd>Shift+Entrée</kbd> Saut de ligne</div>
      </div>
    `;
  }

  /**
   * Met à jour les valeurs affichées.
   * @param {{ vocabularySize, ngramCount, totalTokens, order, sessionContributions }} stats
   */
  update(stats) {
    const set = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = this._fmt(val);
    };

    set('stat-vocab', stats.vocabularySize);
    set('stat-ngrams', stats.ngramCount);
    set('stat-tokens', stats.totalTokens);
    set('stat-order', stats.order);
    set('stat-session', stats.sessionContributions || 0);
  }

  _fmt(n) {
    if (n === undefined || n === null) return '—';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }
}
