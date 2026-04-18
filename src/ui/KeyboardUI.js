/**
 * KeyboardUI.js
 * Gère toute l'interface utilisateur principale :
 * - Zone de saisie
 * - Barre de suggestions (complétion + prédiction)
 * - Historique des messages
 * - Contrôles (générer, charger texte, reset)
 */

export class KeyboardUI {
  constructor(container) {
    this.container = container;
    this._onInput = null;
    this._onSuggestionClick = null;
    this._onSubmit = null;
    this._onGenerate = null;
    this._onReset = null;
    this._onLoadCustomText = null;
    this._currentSuggestions = [];

    this._render();
    this._bindEvents();
  }

  // ─────────────────────────────────────────────
  // RENDU HTML
  // ─────────────────────────────────────────────

  _render() {
    this.container.innerHTML = `
      <div class="chat-window" id="chat-window">
        <div class="messages" id="messages">
          <div class="message system">
            <span class="bubble">👋 Commencez à taper… Le modèle vous suggère des mots en temps réel.</span>
          </div>
        </div>
      </div>

      <div class="suggestions-bar" id="suggestions-bar">
        <span class="suggestions-label" id="suggestions-label"></span>
        <div class="suggestions-chips" id="suggestions-chips"></div>
      </div>

      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            id="main-input"
            class="main-input"
            placeholder="Écrivez quelque chose…"
            rows="1"
            autocomplete="off"
            spellcheck="false"
          ></textarea>
          <button class="btn-send" id="btn-send" title="Envoyer (Entrée)">
            <svg viewBox="0 0 24 24" width="20" height="20"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>

        <div class="controls">
          <button class="btn-ctrl btn-generate" id="btn-generate" title="Générer une phrase à partir du contexte">
            ✨ Générer
          </button>
          <button class="btn-ctrl btn-load" id="btn-load" title="Charger un texte pour entraîner le modèle">
            📂 Charger un texte
          </button>
          <button class="btn-ctrl btn-reset" id="btn-reset" title="Réinitialiser le modèle">
            🔄 Réinitialiser
          </button>
        </div>
      </div>

      <div class="status-bar">
        <span class="status-dot" id="status-dot"></span>
        <span class="status-text" id="status-text">Initialisation…</span>
      </div>

      <!-- Input caché pour charger un fichier texte -->
      <input type="file" id="file-input" accept=".txt" style="display:none">
    `;
  }

  // ─────────────────────────────────────────────
  // EVENTS INTERNES
  // ─────────────────────────────────────────────

  _bindEvents() {
    const input = document.getElementById('main-input');
    const btnSend = document.getElementById('btn-send');
    const btnGenerate = document.getElementById('btn-generate');
    const btnLoad = document.getElementById('btn-load');
    const btnReset = document.getElementById('btn-reset');
    const fileInput = document.getElementById('file-input');

    // Saisie → suggestions
    input.addEventListener('input', () => {
      this._autoResize(input);
      if (this._onInput) this._onInput(input.value);
    });

    // Enter = envoyer (Shift+Enter = saut de ligne)
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._triggerSubmit();
      }
      // Flèche gauche/droite sur les suggestions avec Tab
      if (e.key === 'Tab') {
        e.preventDefault();
        this._acceptFirstSuggestion();
      }
    });

    btnSend.addEventListener('click', () => this._triggerSubmit());

    btnGenerate.addEventListener('click', () => {
      if (!this._onGenerate) return;
      const words = input.value.trim().split(/\s+/).filter(Boolean);
      this._onGenerate(words);
    });

    btnLoad.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (this._onLoadCustomText) this._onLoadCustomText(ev.target.result);
      };
      reader.readAsText(file, 'UTF-8');
      fileInput.value = '';
    });

    btnReset.addEventListener('click', () => {
      if (confirm('Réinitialiser le modèle ? Les apprentissages personnalisés seront perdus.')) {
        if (this._onReset) this._onReset();
      }
    });
  }

  _triggerSubmit() {
    const input = document.getElementById('main-input');
    const text = input.value.trim();
    if (!text) return;
    if (this._onSubmit) this._onSubmit(text);
  }

  _acceptFirstSuggestion() {
    if (this._currentSuggestions.length > 0) {
      if (this._onSuggestionClick) this._onSuggestionClick(this._currentSuggestions[0]);
    }
  }

  _autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 140) + 'px';
  }

  // ─────────────────────────────────────────────
  // API PUBLIQUE — CALLBACKS
  // ─────────────────────────────────────────────

  onInput(fn) { this._onInput = fn; }
  onSuggestionClick(fn) { this._onSuggestionClick = fn; }
  onSubmit(fn) { this._onSubmit = fn; }
  onGenerate(fn) { this._onGenerate = fn; }
  onReset(fn) { this._onReset = fn; }
  onLoadCustomText(fn) { this._onLoadCustomText = fn; }

  // ─────────────────────────────────────────────
  // API PUBLIQUE — AFFICHAGE
  // ─────────────────────────────────────────────

  /**
   * Affiche les suggestions dans la barre.
   * @param {{ type: string, suggestions: any[], prefix?: string }} result
   */
  showSuggestions({ type, suggestions, prefix }) {
    const bar = document.getElementById('suggestions-bar');
    const chipsEl = document.getElementById('suggestions-chips');
    const labelEl = document.getElementById('suggestions-label');

    chipsEl.innerHTML = '';
    this._currentSuggestions = [];

    if (suggestions.length === 0) {
      bar.classList.remove('visible');
      return;
    }

    bar.classList.add('visible');

    if (type === 'completion') {
      labelEl.textContent = `Complétion de "${prefix}" :`;
    } else {
      labelEl.textContent = 'Mot suivant :';
    }

    suggestions.forEach((s, i) => {
      const word = s.word;
      this._currentSuggestions.push(s);

      const chip = document.createElement('button');
      chip.className = 'chip';
      chip.setAttribute('data-index', i);

      if (type === 'completion' && prefix) {
        // Mettre le préfixe en gras dans le chip
        chip.innerHTML = `<span class="chip-match">${this._escapeHTML(prefix)}</span><span class="chip-rest">${this._escapeHTML(word.slice(prefix.length))}</span>`;
      } else {
        const pct = Math.round((s.probability || 0) * 100);
        chip.innerHTML = `${this._escapeHTML(word)}<span class="chip-prob">${pct}%</span>`;
      }

      chip.addEventListener('click', () => {
        if (this._onSuggestionClick) this._onSuggestionClick(s);
      });

      chipsEl.appendChild(chip);
    });
  }

  /**
   * Insère un mot suggéré dans le champ de saisie.
   * - Complétion : remplace le mot en cours par le mot complet + espace
   * - Prédiction : ajoute le mot après une espace
   */
  insertSuggestion(suggestion) {
    const input = document.getElementById('main-input');
    const value = input.value;
    const endsWithSpace = value.endsWith(' ');
    const words = value.trimStart().split(/\s+/).filter(Boolean);

    let newValue;
    if (!endsWithSpace && words.length > 0) {
      // Remplace le mot en cours
      words[words.length - 1] = suggestion.word;
      newValue = words.join(' ') + ' ';
    } else {
      // Ajoute le mot
      newValue = value + suggestion.word + ' ';
    }

    input.value = newValue;
    input.focus();
    // Repositionne le curseur à la fin
    input.setSelectionRange(newValue.length, newValue.length);
    this._autoResize(input);

    // Re-déclenche l'analyse
    if (this._onInput) this._onInput(newValue);
  }

  setInputValue(text) {
    const input = document.getElementById('main-input');
    input.value = text + ' ';
    this._autoResize(input);
    if (this._onInput) this._onInput(input.value);
  }

  clearInput() {
    const input = document.getElementById('main-input');
    input.value = '';
    input.style.height = 'auto';
    this.showSuggestions({ type: 'prediction', suggestions: [] });
  }

  addMessage(text) {
    const msgs = document.getElementById('messages');
    const div = document.createElement('div');
    div.className = 'message user';
    div.innerHTML = `<span class="bubble">${this._escapeHTML(text)}</span>`;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  setStatus(type, text) {
    const dot = document.getElementById('status-dot');
    const label = document.getElementById('status-text');
    dot.className = `status-dot status-${type}`;
    label.textContent = text;
  }

  _escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
}
