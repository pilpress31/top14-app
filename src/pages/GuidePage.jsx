import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, X, Check } from 'lucide-react';

// ─── Données des slides ───────────────────────────────────────────────────────

const SLIDES = [
  {
    id: 'welcome',
    emoji: '🏉',
    title: 'Bienvenue sur\nTop14 Pronos !',
    color: '#C8922A', // rugby-gold
    bg: 'from-amber-50 to-orange-50',
    border: 'border-amber-200',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed">
          Tu viens de rejoindre une communauté de passionnés de rugby.
          Ici, tu paries des <strong>jetons virtuels</strong> sur les matchs du
          Top 14, Pro D2, Champions Cup, Challenge Cup et Rugby international.
        </p>
        <div className="bg-white rounded-xl p-4 border border-amber-200 shadow-sm">
          <p className="text-sm text-gray-600 leading-relaxed">
            🎯 Teste ton instinct de pronostiqueur<br />
            📊 Affronte la communauté au classement<br />
            🤖 Profite des analyses de l'IA<br />
            ⭐ Suis tes équipes favorites
          </p>
        </div>
        <p className="text-sm text-gray-500 text-center italic">
          Ce guide te présente l'essentiel en quelques étapes.
        </p>
      </div>
    ),
  },
  {
    id: 'jetons',
    emoji: '🪙',
    title: 'Tes jetons',
    color: '#C8922A',
    bg: 'from-yellow-50 to-amber-50',
    border: 'border-yellow-200',
    content: (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-xl p-4 text-white text-center shadow-md">
          <p className="text-4xl font-bold">1 000</p>
          <p className="text-sm opacity-90 mt-1">jetons offerts à l'inscription</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-yellow-200">
            <span className="text-xl">💰</span>
            <div>
              <p className="font-semibold text-sm text-gray-800">Mise par pari</p>
              <p className="text-xs text-gray-600">Entre 10 et 1 000 jetons par pari</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-yellow-200">
            <span className="text-xl">♻️</span>
            <div>
              <p className="font-semibold text-sm text-gray-800">Jetons conservés</p>
              <p className="text-xs text-gray-600">Ton solde passe d'une saison à l'autre</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-yellow-200">
            <span className="text-xl">🎁</span>
            <div>
              <p className="font-semibold text-sm text-gray-800">Distributions mensuelles</p>
              <p className="text-xs text-gray-600">Des jetons bonus offerts régulièrement</p>
            </div>
          </div>
          <div className="flex items-start gap-3 bg-white rounded-lg p-3 border border-yellow-200">
            <span className="text-xl">🤝</span>
            <div>
              <p className="font-semibold text-sm text-gray-800">Parrainage</p>
              <p className="text-xs text-gray-600">+250 jetons quand un filleul place son 1er pari</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'paris',
    emoji: '🎯',
    title: 'Comment parier ?',
    color: '#16a34a',
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-2">
          Pour chaque match, tu peux placer jusqu'à <strong>2 types de paris</strong> :
        </p>
        <div className="bg-white rounded-xl border border-green-200 overflow-hidden shadow-sm">
          <div className="bg-green-600 px-4 py-2">
            <p className="text-white font-bold text-sm">🏉 Score FT (Temps plein)</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600">Pronostique le score exact à 80 minutes.</p>
            <div className="mt-2 flex items-center gap-2 justify-center">
              <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-lg text-sm">23</span>
              <span className="text-gray-400 text-xs">—</span>
              <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-lg text-sm">17</span>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1">Cote × mise = gain potentiel</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 overflow-hidden shadow-sm">
          <div className="bg-emerald-500 px-4 py-2">
            <p className="text-white font-bold text-sm">⏱️ Score MT (Mi-temps)</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600">Pronostique le score exact à la mi-temps.</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-green-200 overflow-hidden shadow-sm">
          <div className="bg-teal-600 px-4 py-2">
            <p className="text-white font-bold text-sm">🎯 Vainqueur FT / MT</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600">Choisis simplement l'équipe gagnante ou match nul.</p>
            <div className="mt-2 flex items-center gap-2 justify-center text-xs">
              <span className="bg-teal-100 text-teal-800 font-semibold px-2 py-1 rounded">Domicile</span>
              <span className="bg-gray-100 text-gray-600 font-semibold px-2 py-1 rounded">Nul</span>
              <span className="bg-teal-100 text-teal-800 font-semibold px-2 py-1 rounded">Extérieur</span>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-gray-400 text-center">
          ⚠️ Les paris se résolvent sur le score à 80 min (hors prolongations)
        </p>
      </div>
    ),
  },
  {
    id: 'championnats',
    emoji: '🏆',
    title: 'Les championnats',
    color: '#7c3aed',
    bg: 'from-purple-50 to-violet-50',
    border: 'border-purple-200',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">Tu paries sur 5 compétitions, chacune avec son univers :</p>
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 text-white shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🏆</span>
            <p className="font-bold">Top 14</p>
          </div>
          <p className="text-xs opacity-90">14 clubs pros français · 26 journées · phases finales</p>
          <p className="text-xs opacity-80 mt-1">Algo VBA Elo — précision 79.9% FT</p>
        </div>
        <div
          className="rounded-xl p-4 text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #00174D, #002D6B)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🥈</span>
            <p className="font-bold">Pro D2</p>
          </div>
          <p className="text-xs opacity-90">16 clubs · 30 journées · le vainqueur de finale monte en Top 14</p>
          <p className="text-xs opacity-80 mt-1">Pari Vainqueur FT uniquement</p>
        </div>
        <div
          className="rounded-xl p-4 text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #003E7E, #002857)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">⭐</span>
            <p className="font-bold" style={{ color: '#FFC72C' }}>Champions Cup</p>
          </div>
          <p className="text-xs opacity-90">24 clubs européens · phase de poules + phases finales</p>
          <p className="text-xs opacity-80 mt-1">Algo XGBoost — précision 70.9%</p>
        </div>
        <div
          className="rounded-xl p-4 text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #2E7D32, #CD7F32)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🛡️</span>
            <p className="font-bold">Challenge Cup</p>
          </div>
          <p className="text-xs opacity-90">18 clubs européens · phase de poules + phases finales</p>
          <p className="text-xs opacity-80 mt-1">Algo Elo — pari Vainqueur/Score FT</p>
        </div>
        <div
          className="rounded-xl p-4 text-white shadow-md"
          style={{ background: 'linear-gradient(135deg, #0B6E4F, #34D399)' }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🌍</span>
            <p className="font-bold">Rugby international</p>
          </div>
          <p className="text-xs opacity-90">Équipes nationales · tournois, tournées et Nations Championship</p>
          <p className="text-xs opacity-80 mt-1">Algo Elo + météo — pari Vainqueur/Score FT</p>
        </div>
      </div>
    ),
  },
  {
    id: 'ia',
    emoji: '🤖',
    title: "L'IA à ton service",
    color: '#0891b2',
    bg: 'from-cyan-50 to-sky-50',
    border: 'border-cyan-200',
    content: (
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-cyan-200 shadow-sm overflow-hidden">
          <div className="bg-cyan-600 px-4 py-2 flex items-center gap-2">
            <span>📊</span>
            <p className="text-white font-bold text-sm">Pronos algorithmiques</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Chaque match est analysé par nos algorithmes (Elo, XGBoost).
              Sur la page <strong>IA</strong>, tu vois le pronostic de l'IA,
              la cote, et les statistiques du duel.
            </p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-cyan-200 shadow-sm overflow-hidden">
          <div className="bg-sky-600 px-4 py-2 flex items-center gap-2">
            <span>💬</span>
            <p className="text-white font-bold text-sm">Chat Rugby IA</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600 leading-relaxed">
              Pose tes questions rugby en langage naturel : blessés, compos,
              forme des équipes, palmarès... L'IA répond avec des données
              en temps réel.
            </p>
            <div className="mt-2 bg-sky-50 rounded-lg p-2 border border-sky-100">
              <p className="text-xs text-sky-700 italic">
                "Qui est favori ce week-end en Top 14 ?"
              </p>
            </div>
            <p className="text-[10px] text-gray-400 mt-1">10 questions offertes par jour</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-cyan-200 shadow-sm overflow-hidden">
          <div className="bg-indigo-600 px-4 py-2 flex items-center gap-2">
            <span>📰</span>
            <p className="text-white font-bold text-sm">Actualités IA</p>
          </div>
          <div className="p-3">
            <p className="text-xs text-gray-600">
              Avant chaque journée, l'IA génère une analyse par match :
              blessés, suspendus, météo, contexte.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'classement',
    emoji: '📊',
    title: 'Le classement',
    color: '#dc2626',
    bg: 'from-red-50 to-rose-50',
    border: 'border-red-200',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Chaque pari réussi te rapporte des <strong>points de classement</strong>.
          Affronte tous les membres de la communauté !
        </p>
        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🥇</span>
            <div>
              <p className="font-bold text-sm text-gray-800">Points par pari</p>
              <p className="text-xs text-gray-500">Score exact FT → gros bonus · Vainqueur → points de base</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔄</span>
            <div>
              <p className="font-bold text-sm text-gray-800">Remise à zéro</p>
              <p className="text-xs text-gray-500">Les points repartent à 0 à chaque nouvelle saison</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🤖</span>
            <div>
              <p className="font-bold text-sm text-gray-800">L'IA est aussi au classement</p>
              <p className="text-xs text-gray-500">Essaie de battre <strong>IA_Top14Pronos</strong> !</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-200 p-3 text-center">
          <p className="text-xs text-red-700 font-semibold">
            💡 Tes jetons et ton classement sont deux systèmes séparés
          </p>
          <p className="text-xs text-red-600 mt-1">
            Jetons = monnaie virtuelle conservée · Points = compétition saisonnière
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'ligues',
    emoji: '🛡️',
    title: 'Tes ligues privées',
    color: '#0d9488',
    bg: 'from-teal-50 to-emerald-50',
    border: 'border-teal-200',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Envie d'un classement rien qu'entre amis ? Crée ta <strong>ligue privée</strong>
          {' '}et défie tes proches sur les points de la saison.
        </p>
        <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div>
              <p className="font-bold text-sm text-gray-800">Crée ou rejoins</p>
              <p className="text-xs text-gray-500">Chaque ligue a un code · jusqu'à 5 ligues par joueur</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✉️</span>
            <div>
              <p className="font-bold text-sm text-gray-800">Invite tes amis</p>
              <p className="text-xs text-gray-500">Par code, par lien, ou par pseudo s'ils ont déjà l'app</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-bold text-sm text-gray-800">Votre classement</p>
              <p className="text-xs text-gray-500">Le classement par points, limité aux membres de la ligue</p>
            </div>
          </div>
        </div>
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-3 text-center">
          <p className="text-xs text-teal-700 font-semibold">
            💡 Onglet « Mes Ligues »
          </p>
          <p className="text-xs text-teal-600 mt-1">
            Dans le Classement, ou depuis la page Plus → Mon compte
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'favoris',
    emoji: '⭐',
    title: 'Tes équipes favorites',
    color: '#d97706',
    bg: 'from-amber-50 to-yellow-50',
    border: 'border-amber-200',
    content: (
      <div className="space-y-4">
        <p className="text-sm text-gray-600 leading-relaxed">
          Clique sur l'étoile ⭐ sur n'importe quelle MatchCard pour suivre une équipe.
          Retrouve ensuite tous leurs prochains matchs en un coup d'œil.
        </p>
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="p-3 border-b border-amber-100 flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm text-gray-800">Stade Toulousain</p>
              <p className="text-xs text-gray-500">Top 14</p>
            </div>
            <span className="text-yellow-400 text-xl">⭐</span>
          </div>
          <div className="p-3 bg-amber-50">
            <p className="text-xs text-gray-600 font-semibold mb-1">Prochain match</p>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Toulouse</span>
              <span className="text-gray-400 text-xs">vs</span>
              <span className="font-medium text-gray-700">Bordeaux</span>
            </div>
            <div className="flex gap-2 mt-2">
              <span className="flex-1 text-center py-1 bg-amber-500 text-white text-xs rounded-lg font-semibold">
                🎯 Parier
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-amber-200 p-3 shadow-sm">
          <p className="text-xs text-gray-600 leading-relaxed">
            Depuis <strong>Favoris</strong>, tu accèdes directement à la page de pari
            de chaque match avec le bouton <strong>Parier / Compléter / Voir mon pari</strong>.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'ready',
    emoji: '🚀',
    title: "C'est parti !",
    color: '#16a34a',
    bg: 'from-green-50 to-emerald-50',
    border: 'border-green-200',
    content: (
      <div className="space-y-4">
        <p className="text-gray-700 text-base leading-relaxed text-center">
          Tu as tout ce qu'il faut pour commencer à pronostiquer. Bonne chance !
        </p>
        <div className="bg-white rounded-xl border border-green-200 shadow-sm p-4 space-y-2">
          {[
            { icon: '🏉', text: 'Va sur Pronos → À parier' },
            { icon: '📊', text: 'Consulte l\'IA pour t\'aider' },
            { icon: '⭐', text: 'Mets tes équipes en favoris' },
            { icon: '🪙', text: 'Gère ta mise dans Ma Cagnotte' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-base">
                {icon}
              </span>
              <p className="text-sm text-gray-700">{text}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 text-center">
          Tu peux relire ce guide à tout moment depuis Paramètres.
        </p>
      </div>
    ),
  },
];

// ─── Composant principal ──────────────────────────────────────────────────────

const GUIDE_KEY = 'guide_seen_v1';

export default function GuidePage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [animDir, setAnimDir] = useState(null); // 'left' | 'right'
  const [visible, setVisible] = useState(true);

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  const goTo = (nextIndex, dir) => {
    setVisible(false);
    setAnimDir(dir);
    setTimeout(() => {
      setCurrent(nextIndex);
      setVisible(true);
    }, 180);
  };

  const next = () => {
    if (isLast) return finish();
    goTo(current + 1, 'right');
  };

  const prev = () => {
    if (current === 0) return;
    goTo(current - 1, 'left');
  };

  const finish = () => {
    localStorage.setItem(GUIDE_KEY, 'true');
    navigate('/pronos');
  };

  const skip = () => {
    localStorage.setItem(GUIDE_KEY, 'true');
    navigate('/pronos');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${slide.bg} flex flex-col`}
      style={{ paddingTop: 'var(--safe-area-top, 0px)' }}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        {/* Barre de progression */}
        <div className="flex gap-1.5 flex-1 mr-4">
          {SLIDES.map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full flex-1 transition-all duration-300"
              style={{
                backgroundColor: i <= current ? slide.color : '#e5e7eb',
              }}
            />
          ))}
        </div>
        {/* Bouton Passer */}
        {!isLast && (
          <button
            onClick={skip}
            className="flex items-center gap-1 text-gray-400 text-xs font-medium hover:text-gray-600 transition"
          >
            Passer <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Contenu slide ── */}
      <div
        className="flex-1 flex flex-col px-5 pb-4 overflow-y-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateX(0)' : animDir === 'right' ? 'translateX(20px)' : 'translateX(-20px)',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}
      >
        {/* Emoji + Titre */}
        <div className="text-center py-6">
          <div
            className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center text-4xl shadow-lg mb-4"
            style={{ backgroundColor: slide.color + '20', border: `2px solid ${slide.color}40` }}
          >
            {slide.emoji}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 leading-tight whitespace-pre-line">
            {slide.title}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {current + 1} / {SLIDES.length}
          </p>
        </div>

        {/* Corps */}
        <div className="flex-1">
          {slide.content}
        </div>
      </div>

      {/* ── Footer navigation ── */}
      <div
        className="px-5 py-4 bg-white/80 backdrop-blur-sm border-t border-gray-100 flex items-center gap-3"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* Précédent */}
        <button
          onClick={prev}
          disabled={current === 0}
          className="w-12 h-12 rounded-xl border border-gray-200 flex items-center justify-center transition
            disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5 text-gray-500" />
        </button>

        {/* Suivant / Commencer */}
        <button
          onClick={next}
          className="flex-1 h-12 rounded-xl font-bold text-white flex items-center justify-center gap-2 shadow-md
            active:scale-95 transition"
          style={{ backgroundColor: slide.color }}
        >
          {isLast ? (
            <>
              <Check className="w-5 h-5" />
              Commencer à parier !
            </>
          ) : (
            <>
              Suivant
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Export de la clé localStorage (utilisé dans App.jsx) ────────────────────
export const GUIDE_STORAGE_KEY = GUIDE_KEY;
