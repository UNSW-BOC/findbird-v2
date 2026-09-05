import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import questionsJson from './data/questions.json';
import { calculateRoundScore, GAME_CONFIG, resolveTargetClick, selectRoundQuestions } from './gameRules.js';
import { COPY, cropAltText, DIFFICULTY_CODES, DIFFICULTY_LABELS, remainingTargetText, remainingTimeText, roundTitle, targetCountText, type Language } from './i18n';
import type { Question, RoundResult, Target } from './types';

const questions = questionsJson as Question[];
const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
const LANGUAGE_STORAGE_KEY = 'findbird-language';

type Screen = 'welcome' | 'game' | 'results' | 'error';
type RoundPhase = 'loading' | 'intro' | 'playing' | 'complete' | 'timeout';

interface Point {
  x: number;
  y: number;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [roundQuestions, setRoundQuestions] = useState<Question[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [gameId, setGameId] = useState(0);
  const [error, setError] = useState('');
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return localStorage.getItem(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'zh';
    } catch {
      return 'zh';
    }
  });
  const c = COPY[language];
  const toggleLanguage = () => setLanguage((current) => current === 'zh' ? 'en' : 'zh');

  const startGame = useCallback(() => {
    try {
      const selected = selectRoundQuestions(questions) as Question[];
      setRoundQuestions(selected);
      setRoundIndex(0);
      setResults([]);
      setGameId((value) => value + 1);
      setScreen('game');
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '题库无法开始游戏');
      setScreen('error');
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    document.title = c.documentTitle;
    document.querySelector('meta[name="description"]')?.setAttribute('content', c.documentDescription);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {}
  }, [c.documentDescription, c.documentTitle, language]);

  useEffect(() => {
    if (!document.modelContext?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(document.modelContext.registerTool({
      name: 'start_findbird_game',
      title: c.webmcpTitle,
      description: c.webmcpDescription,
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input as Record<string, unknown>).length > 0) {
          throw new Error(c.webmcpNoArgs);
        }
        startGame();
        return { status: 'started', rounds: GAME_CONFIG.roundCount, secondsPerRound: GAME_CONFIG.roundSeconds };
      },
    }, { signal: lifecycle.signal })).catch(() => {});
    return () => lifecycle.abort();
  }, [c.webmcpDescription, c.webmcpNoArgs, c.webmcpTitle, startGame]);

  if (screen === 'welcome') return <WelcomeScreen language={language} onLanguageChange={toggleLanguage} onStart={startGame} />;
  if (screen === 'error') return <ErrorScreen language={language} message={error} onLanguageChange={toggleLanguage} onBack={() => setScreen('welcome')} />;
  if (screen === 'results') return <ResultsScreen language={language} results={results} onLanguageChange={toggleLanguage} onReplay={startGame} />;

  return (
    <GameScreen
      key={`${gameId}-${roundIndex}`}
      gameId={gameId}
      language={language}
      question={roundQuestions[roundIndex]}
      roundIndex={roundIndex}
      onLanguageChange={toggleLanguage}
      onRoundFinished={(result) => {
        const nextResults = [...results, result];
        setResults(nextResults);
        if (roundIndex === GAME_CONFIG.roundCount - 1) setScreen('results');
        else setRoundIndex((index) => index + 1);
      }}
    />
  );
}

function LanguageToggle({ language, onChange, className = '' }: { language: Language; onChange: () => void; className?: string }) {
  return (
    <button className={`language-toggle ${className}`} onClick={onChange} aria-label={COPY[language].switchLanguage}>
      {language === 'zh' ? 'EN' : '中文'}
    </button>
  );
}

function WelcomeScreen({ language, onLanguageChange, onStart }: { language: Language; onLanguageChange: () => void; onStart: () => void }) {
  const previewImages = questions.slice(0, 3);
  const c = COPY[language];
  return (
    <main className={`welcome-shell lang-${language}`}>
      <nav className="topbar">
        <a className="brand" href="#top" aria-label={c.homeLabel}>
          <span className="brand-mark" aria-hidden="true">FB</span>
          <span><b>FindBird</b><small>UNSW Bird Observers’ Club</small></span>
        </a>
        <div className="topbar-actions"><span className="edition">FIELD GAME · V2</span><LanguageToggle language={language} onChange={onLanguageChange} /></div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span /> {c.challenge}</p>
          <h1>{c.heroLead}<br />{c.heroMiddle}<em>{c.heroAccent}</em></h1>
          <p className="hero-intro">{c.heroIntro}</p>
          <button className="primary-button" onClick={onStart}>
            {c.start} <span aria-hidden="true">↗</span>
          </button>
          <div className="game-facts" aria-label={c.factsLabel}>
            <span><b>05</b><small>{c.photoRounds}</small></span>
            <i />
            <span><b>30</b><small>{c.secondsPerRound}</small></span>
            <i />
            <span><b>5000</b><small>{c.highestScore}</small></span>
          </div>
        </div>

        <div className="field-collage" aria-label={c.libraryPreview}>
          {previewImages.map((question, index) => (
            <figure className={`collage-photo collage-${index + 1}`} key={question.id}>
              <img src={assetUrl(question.image)} alt={c.naturePhotoAlt} />
              {index === 0 && <figcaption>LOOK CLOSER <span>{c.lookCloser}</span></figcaption>}
            </figure>
          ))}
          <span className="scope-mark" aria-hidden="true"><i /><i /></span>
          <span className="field-note">{c.fieldNoteTop}<br />{c.fieldNoteBottom}</span>
        </div>
      </section>

      <section className="briefing" aria-label={c.howToPlay}>
        <div className="briefing-title"><span>{c.beforeStart}</span><h2>{c.threeThings}</h2></div>
        <ol>
          {c.briefing.map(([title, body], index) => <li key={title}><b>0{index + 1}</b><span><strong>{title}</strong>{body}</span></li>)}
        </ol>
      </section>
    </main>
  );
}

function ErrorScreen({ language, message, onLanguageChange, onBack }: { language: Language; message: string; onLanguageChange: () => void; onBack: () => void }) {
  const c = COPY[language];
  return (
    <main className={`center-screen lang-${language}`}>
      <section className="error-card">
        <LanguageToggle language={language} onChange={onLanguageChange} className="error-language" />
        <span className="eyebrow">{c.cannotStart}</span>
        <h1>{c.bankNeedsMore}</h1>
        <p>{language === 'zh' ? message : c.bankError}</p>
        <button className="primary-button" onClick={onBack}>{c.backHome}</button>
      </section>
    </main>
  );
}

function GameScreen({
  gameId,
  language,
  question,
  roundIndex,
  onLanguageChange,
  onRoundFinished,
}: {
  gameId: number;
  language: Language;
  question: Question;
  roundIndex: number;
  onLanguageChange: () => void;
  onRoundFinished: (result: RoundResult) => void;
}) {
  const c = COPY[language];
  const [phase, setPhase] = useState<RoundPhase>('loading');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(GAME_CONFIG.roundSeconds);
  const [wrongClicks, setWrongClicks] = useState(0);
  const [foundTargetIds, setFoundTargetIds] = useState<string[]>([]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [toast, setToast] = useState('');
  const settledRef = useRef(false);
  const deadlineRef = useRef(0);
  const foundRef = useRef<string[]>([]);
  const wrongRef = useRef(0);
  const timeRef = useRef<number>(GAME_CONFIG.roundSeconds);
  const nextTimerRef = useRef<number | null>(null);

  const settleRound = useCallback((completed: boolean, foundIds = foundRef.current, seconds = timeRef.current) => {
    if (settledRef.current) return;
    settledRef.current = true;
    const finalSeconds = completed ? seconds : 0;
    const result: RoundResult = {
      question,
      found: foundIds.length,
      totalTargets: question.targets.length,
      foundTargetIds: [...foundIds],
      remainingSeconds: finalSeconds,
      wrongClicks: wrongRef.current,
      score: calculateRoundScore(finalSeconds, wrongRef.current, completed),
      completed,
    };
    setPhase(completed ? 'complete' : 'timeout');
    nextTimerRef.current = window.setTimeout(
      () => onRoundFinished(result),
      completed ? GAME_CONFIG.successDelayMs : GAME_CONFIG.timeoutRevealMs,
    );
  }, [onRoundFinished, question]);

  useEffect(() => {
    if (phase !== 'playing') return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      timeRef.current = next;
      setRemainingSeconds(next);
      if (next === 0) settleRound(false, foundRef.current, 0);
    };
    tick();
    const interval = window.setInterval(tick, 100);
    return () => window.clearInterval(interval);
  }, [phase, settleRound]);

  useEffect(() => {
    if (phase !== 'intro') return;
    const introTimer = window.setTimeout(() => {
      if (settledRef.current) return;
      deadlineRef.current = Date.now() + GAME_CONFIG.roundSeconds * 1000;
      setPhase('playing');
    }, GAME_CONFIG.introDurationMs);
    return () => window.clearTimeout(introTimer);
  }, [phase]);

  useEffect(() => () => {
    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
  }, []);

  const handleLoaded = () => {
    if (phase !== 'loading') return;
    setPhase('intro');
  };

  const handleTarget = (target: Target) => {
    if (phase !== 'playing' || settledRef.current || foundRef.current.includes(target.id)) return;
    const currentSeconds = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
    if (currentSeconds === 0) {
      timeRef.current = 0;
      setRemainingSeconds(0);
      settleRound(false, foundRef.current, 0);
      return;
    }
    timeRef.current = currentSeconds;
    setRemainingSeconds(currentSeconds);
    const nextFound = [...foundRef.current, target.id];
    foundRef.current = nextFound;
    setFoundTargetIds(nextFound);
    const remaining = question.targets.length - nextFound.length;
    if (remaining === 0) settleRound(true, nextFound, currentSeconds);
    else {
      setToast(remainingTargetText(language, remaining));
      window.setTimeout(() => setToast(''), 1100);
    }
  };

  const handleWrongClick = () => {
    if (phase !== 'playing' || settledRef.current) return;
    if (Date.now() >= deadlineRef.current) {
      timeRef.current = 0;
      setRemainingSeconds(0);
      settleRound(false, foundRef.current, 0);
      return;
    }
    wrongRef.current += 1;
    setWrongClicks(wrongRef.current);
    setToast(c.lookAgain);
    window.setTimeout(() => setToast(''), 650);
  };

  if (!question) return null;
  const foundCount = foundTargetIds.length;

  return (
    <main className={`game-shell lang-${language}`}>
      <header className="game-header">
        <div className="round-identity">
          <span className="round-number">{String(roundIndex + 1).padStart(2, '0')} <i>/</i> 05</span>
          <span className={`difficulty difficulty-${question.difficulty}`}>
            {DIFFICULTY_CODES[question.difficulty]}{language === 'zh' ? ` · ${DIFFICULTY_LABELS.zh[question.difficulty]}` : ''}
          </span>
        </div>
        <div className="game-stat found-stat"><small>{c.found}</small><b>{foundCount} <span>/ {question.targets.length}</span></b></div>
        <div className={`game-stat timer-stat ${remainingSeconds <= 8 && phase === 'playing' ? 'urgent' : ''}`}>
          <small>{c.timeLeft}</small><b>00:{String(remainingSeconds).padStart(2, '0')}</b>
        </div>
        <div className="game-stat miss-stat"><small>{c.wrongClicks}</small><b>{String(wrongClicks).padStart(2, '0')}</b></div>
        <LanguageToggle language={language} onChange={onLanguageChange} className="game-language" />
      </header>

      <section className="game-main">
        <div className="mission-line">
          <span><i /> {c.missionLive}</span>
          <p>{zoom > 1 ? c.dragHint : c.clickHint}</p>
        </div>
        <PhotoStage
          key={`${gameId}-${question.id}`}
          question={question}
          language={language}
          phase={phase}
          foundTargetIds={foundTargetIds}
          zoom={zoom}
          pan={pan}
          onPan={setPan}
          onZoom={(nextZoom) => {
            setZoom(nextZoom);
            if (nextZoom === 1) setPan({ x: 0, y: 0 });
          }}
          onLoaded={handleLoaded}
          onTarget={handleTarget}
          onWrongClick={handleWrongClick}
        />
      </section>

      <aside className="round-tip" aria-live="polite">
        {phase === 'loading' && <><span className="loading-ring" /><b>{c.loadingPhoto}</b></>}
        {phase === 'intro' && <><small>{c.roundGoal}</small><b>{targetCountText(language, question.targets.length)}</b></>}
        {phase === 'complete' && <><small>{c.observationComplete}</small><b>{c.allFound}</b></>}
        {phase === 'timeout' && <><small>{c.roundFinished}</small><b>{c.timeUp}</b></>}
        {phase === 'playing' && toast && <b>{toast}</b>}
      </aside>
    </main>
  );
}

function PhotoStage({
  question,
  language,
  phase,
  foundTargetIds,
  zoom,
  pan,
  onPan,
  onZoom,
  onLoaded,
  onTarget,
  onWrongClick,
}: {
  question: Question;
  language: Language;
  phase: RoundPhase;
  foundTargetIds: string[];
  zoom: number;
  pan: Point;
  onPan: (point: Point) => void;
  onZoom: (zoom: number) => void;
  onLoaded: () => void;
  onTarget: (target: Target) => void;
  onWrongClick: () => void;
}) {
  const c = COPY[language];
  const viewportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ id: number; startX: number; startY: number; panX: number; panY: number; moved: boolean } | null>(null);
  const [viewportSize, setViewportSize] = useState({ width: 1000, height: 650 });

  useEffect(() => {
    if (!viewportRef.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setViewportSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, []);

  const fitted = useMemo(() => {
    const imageRatio = question.sourceWidth / question.sourceHeight;
    const viewportRatio = viewportSize.width / viewportSize.height;
    if (imageRatio > viewportRatio) return { width: viewportSize.width, height: viewportSize.width / imageRatio };
    return { width: viewportSize.height * imageRatio, height: viewportSize.height };
  }, [question.sourceHeight, question.sourceWidth, viewportSize]);

  const clampPan = (point: Point) => ({
    x: Math.max(-fitted.width * (zoom - 1) / 2, Math.min(fitted.width * (zoom - 1) / 2, point.x)),
    y: Math.max(-fitted.height * (zoom - 1) / 2, Math.min(fitted.height * (zoom - 1) / 2, point.y)),
  });

  const updateZoom = (value: number) => onZoom(Math.max(1, Math.min(3, Math.round(value * 10) / 10)));

  return (
    <div
      className={`photo-viewport phase-${phase}`}
      ref={viewportRef}
      onWheel={(event) => {
        event.preventDefault();
        updateZoom(zoom + (event.deltaY < 0 ? 0.2 : -0.2));
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest('[data-ui-control]')) return;
        pointerRef.current = { id: event.pointerId, startX: event.clientX, startY: event.clientY, panX: pan.x, panY: pan.y, moved: false };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        const pointer = pointerRef.current;
        if (!pointer || pointer.id !== event.pointerId) return;
        const deltaX = event.clientX - pointer.startX;
        const deltaY = event.clientY - pointer.startY;
        if (Math.hypot(deltaX, deltaY) > 7) pointer.moved = true;
        if (zoom > 1 && pointer.moved) onPan(clampPan({ x: pointer.panX + deltaX, y: pointer.panY + deltaY }));
      }}
      onPointerUp={(event) => {
        const pointer = pointerRef.current;
        pointerRef.current = null;
        if (!pointer || pointer.id !== event.pointerId || pointer.moved || phase !== 'playing' || !boardRef.current) return;
        const rect = boardRef.current.getBoundingClientRect();
        const sourceX = (event.clientX - rect.left) / rect.width * question.sourceWidth;
        const sourceY = (event.clientY - rect.top) / rect.height * question.sourceHeight;
        const tolerance = GAME_CONFIG.hitTolerancePx * question.sourceWidth / rect.width;
        const outcome = resolveTargetClick(question.targets, foundTargetIds, sourceX, sourceY, tolerance);
        if (outcome.kind === 'found-again') return;
        if (outcome.kind === 'found-new') onTarget(outcome.target);
        else onWrongClick();
      }}
      onPointerCancel={() => { pointerRef.current = null; }}
    >
      <div
        className="photo-board"
        ref={boardRef}
        style={{
          width: fitted.width,
          height: fitted.height,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        }}
      >
        <img src={assetUrl(question.image)} alt={c.photoAlt} draggable={false} onLoad={onLoaded} />
        {question.targets.map((target) => {
          const found = foundTargetIds.includes(target.id);
          const revealed = phase === 'timeout' && !found;
          if (!found && !revealed) return null;
          return (
            <span
              className={`target-frame ${found ? 'target-found' : 'target-missed'}`}
              key={target.id}
              style={{
                left: `${target.x / question.sourceWidth * 100}%`,
                top: `${target.y / question.sourceHeight * 100}%`,
                width: `${target.width / question.sourceWidth * 100}%`,
                height: `${target.height / question.sourceHeight * 100}%`,
              }}
            ><i>{found ? '✓' : '!'}</i></span>
          );
        })}
      </div>

      <div className="zoom-controls" data-ui-control onPointerDown={(event) => event.stopPropagation()}>
        <button onClick={() => updateZoom(zoom - 0.2)} aria-label={c.zoomOut} disabled={zoom <= 1}>−</button>
        <input aria-label={c.zoomLevel} type="range" min="1" max="3" step="0.1" value={zoom} onChange={(event) => updateZoom(Number(event.target.value))} />
        <button onClick={() => updateZoom(zoom + 0.2)} aria-label={c.zoomIn} disabled={zoom >= 3}>＋</button>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
      <span className="photo-index">PHOTO {question.filename.replace(/\.[^.]+$/, '').slice(-8).toUpperCase()}</span>
    </div>
  );
}

function ResultsScreen({ language, results, onLanguageChange, onReplay }: { language: Language; results: RoundResult[]; onLanguageChange: () => void; onReplay: () => void }) {
  const c = COPY[language];
  const totalScore = results.reduce((sum, result) => sum + result.score, 0);
  const completedCount = results.filter((result) => result.completed).length;
  const resultCopy = completedCount === 5 ? c.perfectResult : completedCount >= 3 ? c.goodResult : c.tryAgainResult;

  return (
    <main className={`results-shell lang-${language}`}>
      <header className="results-hero">
        <LanguageToggle language={language} onChange={onLanguageChange} className="results-language" />
        <div>
          <p className="eyebrow"><span /> {c.resultsKicker}</p>
          <h1>{totalScore.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-AU')} <small>/ 5000</small></h1>
          <p>{resultCopy}</p>
        </div>
        <div className="result-summary">
          <span><small>{c.completedRounds}</small><b>{completedCount} / 5</b></span>
          <span><small>{c.foundTargets}</small><b>{results.reduce((sum, result) => sum + result.found, 0)} / {results.reduce((sum, result) => sum + result.totalTargets, 0)}</b></span>
          <button className="primary-button" onClick={onReplay}>{c.replay} <span>↻</span></button>
        </div>
      </header>

      <section className="result-list" aria-label={c.resultsLabel}>
        {results.map((result, index) => (
          <article className="result-round-card" key={`${result.question.id}-${index}`}>
            <header>
              <span className="result-round">{String(index + 1).padStart(2, '0')}</span>
              <div><small>{DIFFICULTY_CODES[result.question.difficulty]}</small><h2>{roundTitle(language, result.question.difficulty)}</h2></div>
              <span className={`completion-badge ${result.completed ? 'complete' : 'incomplete'}`}>
                {result.completed ? c.completed : c.incomplete}
              </span>
            </header>
            <div className="result-data">
              <span><small>{c.roundScore}</small><b>{result.score}</b></span>
              <span><small>{c.wrongClicks}</small><b>{result.wrongClicks}</b></span>
              <span><small>{c.timeResult}</small><b>{result.completed ? remainingTimeText(language, result.remainingSeconds) : c.exhausted}</b></span>
            </div>
            <div className="answer-grid">
              {result.question.targets.map((target) => {
                const found = result.foundTargetIds.includes(target.id);
                return (
                  <div className="bird-answer" key={target.id}>
                    <BirdCrop language={language} question={result.question} target={target} />
                    <div className="bird-names">
                      <span className={found ? 'answer-found' : 'answer-missed'}>{found ? c.answerFound : c.answerMissed}</span>
                      <h3>{language === 'zh' ? target.nameZh : target.nameEn}</h3>
                      <p>{language === 'zh' ? target.nameEn : target.nameZh}</p>
                      <em>{target.scientificName}</em>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </section>
      <footer className="results-footer">
        <span>FindBird · UNSW Bird Observers’ Club</span>
        <button className="primary-button" onClick={onReplay}>{c.retry} <span>↗</span></button>
      </footer>
    </main>
  );
}

function BirdCrop({ language, question, target }: { language: Language; question: Question; target: Target }) {
  const paddingX = target.width * 0.8;
  const paddingY = target.height * 0.8;
  const cropX = Math.max(0, target.x - paddingX);
  const cropY = Math.max(0, target.y - paddingY);
  const cropRight = Math.min(question.sourceWidth, target.x + target.width + paddingX);
  const cropBottom = Math.min(question.sourceHeight, target.y + target.height + paddingY);
  const cropWidth = cropRight - cropX;
  const cropHeight = cropBottom - cropY;

  return (
    <div className="bird-crop" style={{ aspectRatio: `${cropWidth} / ${cropHeight}` }}>
      <img
        src={assetUrl(question.image)}
        alt={cropAltText(language, target.nameZh, target.nameEn)}
        style={{
          width: `${question.sourceWidth / cropWidth * 100}%`,
          left: `${-cropX / cropWidth * 100}%`,
          top: `${-cropY / cropHeight * 100}%`,
        }}
      />
    </div>
  );
}
