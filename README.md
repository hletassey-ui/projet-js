# 🔡 MarkovKey — Prédiction de saisie par Modèle de Markov

> Système de suggestion de texte en temps réel, inspiré du clavier Apple.  
> Deux modes : **complétion de mot** (vous tapez "bo" → suggère "bonjour") et **prédiction du mot suivant** (vous tapez "je vais " → suggère "bien", "partir"…).

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| **Complétion de mot** | Dès que vous tapez des lettres, le modèle propose des complétions basées sur le vocabulaire appris |
| **Prédiction de mot suivant** | Après un espace, le modèle prédit les mots les plus probables en fonction du contexte (N-grammes) |
| **Back-off** | Si le contexte d'ordre N est inconnu, le modèle recule vers un contexte plus court |
| **Apprentissage en ligne** | Chaque message envoyé enrichit le modèle en temps réel |
| **Persistance** | Le modèle est sauvegardé dans le `localStorage` entre les sessions |
| **Corpus personnalisé** | Chargez n'importe quel fichier `.txt` pour entraîner le modèle sur vos propres données |
| **Génération** | Bouton pour générer une continuation de texte à partir du contexte actuel |

---

## 🗂 Structure du projet

```
markov-keyboard/
│
├── index.html              # Page principale (SPA)
├── package.json
├── vite.config.js          # Build tool (Vite)
├── eslint.config.js
├── .gitignore
│
├── styles/
│   └── main.css            # Toute la mise en forme (dark editorial)
│
├── src/
│   ├── app.js              # Point d'entrée — orchestration générale
│   │
│   ├── core/
│   │   ├── MarkovChain.js  # 🧠 Modèle de Markov pur (entraînement, prédiction, complétion)
│   │   └── Predictor.js    # 🎯 Façade haut-niveau (contexte, apprentissage, persistance)
│   │
│   ├── ui/
│   │   ├── KeyboardUI.js   # 🖥 Interface principale (saisie, suggestions, messages)
│   │   └── StatsPanel.js   # 📊 Panneau statistiques du modèle
│   │
│   └── utils/
│       ├── corpus.js       # 📚 Corpus français d'entraînement intégré
│       └── TextAnalyzer.js # 🔍 Utilitaires : tokenisation, fréquences, détection de langue
│
└── tests/
    ├── MarkovChain.test.js # ✅ Tests unitaires (Vitest)
    └── Predictor.test.js   # ✅ Tests d'intégration
```

---

## 🚀 Démarrage rapide

```bash
# 1. Cloner le repo
git clone https://github.com/VOTRE_NOM/markov-keyboard.git
cd markov-keyboard

# 2. Installer les dépendances
npm install

# 3. Lancer le serveur de développement
npm run dev
# → http://localhost:5173

# 4. Lancer les tests
npm test
```

---

## 🧠 Comment fonctionne le modèle

### Modèle de Markov d'ordre N

Un modèle de Markov d'ordre N prédit le mot suivant en se basant sur les **N mots précédents** (le "contexte").

**Entraînement :** Pour chaque séquence de mots dans le corpus, on incrémente un compteur :
```
P("monde" | "bonjour", "le") += 1
```

**Prédiction :** On normalise les compteurs en probabilités :
```
P(w | contexte) = count(contexte + w) / count(contexte)
```

### Back-off

Si le contexte d'ordre 2 est inconnu, on essaie l'ordre 1, puis l'ordre 0 (unigramme). Cela garantit toujours une réponse.

### Complétion de mot

Pour compléter "bo" → on filtre le vocabulaire par préfixe, puis on score les candidats en combinant :
- **Score contextuel** : fréquence dans les transitions depuis le contexte actuel
- **Score global** : fréquence générale dans le corpus

---

## 🎮 Utilisation

### Interface

| Élément | Rôle |
|---|---|
| **Zone de saisie** | Tapez votre texte ici |
| **Barre de suggestions** | Apparaît automatiquement avec 3 propositions |
| **Clic sur une suggestion** | Insère le mot et continue |
| `Tab` | Accepte la première suggestion |
| `Entrée` | Envoie le message (le modèle l'apprend) |
| **✨ Générer** | Génère une continuation depuis le contexte actuel |
| **📂 Charger un texte** | Importe un `.txt` pour enrichir le modèle |
| **🔄 Réinitialiser** | Remet le modèle à zéro |

---

## 🔧 API principale

### `MarkovChain`

```js
import { MarkovChain } from './src/core/MarkovChain.js';

const chain = new MarkovChain(2); // ordre 2

chain.train("le chat mange la souris le chien aboie");

// Prédire le mot suivant
chain.predictNextWord(['le', 'chat'], 3);
// → [{ word: 'mange', probability: 0.67 }, ...]

// Compléter un mot
chain.completeWord('ma', ['le', 'chat'], 3);
// → [{ word: 'mange', score: 14 }, ...]

// Générer une phrase
chain.generate(['le', 'chat'], 6);
// → "le chat mange la souris le"

// Sérialiser
const json = chain.toJSON();
const chain2 = MarkovChain.fromJSON(json);
```

### `Predictor`

```js
import { Predictor } from './src/core/Predictor.js';

const p = new Predictor({ order: 2, language: 'fr' });
await p.initialize(); // entraîne sur le corpus intégré

// Suggestions depuis le texte courant du champ de saisie
p.getSuggestions('je vai');     // → { type: 'completion', suggestions: [...], prefix: 'vai' }
p.getSuggestions('je vais ');   // → { type: 'prediction', suggestions: [...] }

// Apprendre depuis une nouvelle phrase
p.learnFromInput('nouvelle phrase à apprendre par le modèle');
```

---

## 🧪 Tests

```bash
npm test           # Tous les tests (one-shot)
npm run test:watch # Mode watch
npm run test:ui    # Interface Vitest UI
```

Couverture : `MarkovChain` (entraînement, prédiction, complétion, génération, sérialisation) + `Predictor` (init, getSuggestions, apprentissage, reset).

---

## 📦 Build de production

```bash
npm run build
# → dist/  (prêt à déployer sur Netlify, Vercel, GitHub Pages…)
```

---

## 🛣 Feuille de route

- [ ] Support multilingue (EN, ES…)
- [ ] Modèle de Markov à états cachés (HMM)
- [ ] Export / import du modèle en fichier JSON
- [ ] Mode mobile avec clavier virtuel
- [ ] Intégration d'un tokenizer plus fin (gestion des apostrophes, tirets)
- [ ] Lissage de Laplace / Kneser-Ney pour les contextes rares

---

## 📄 Licence

MIT — voir [LICENSE](LICENSE)
