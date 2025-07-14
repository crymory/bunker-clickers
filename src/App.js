import React, { useState, useEffect } from 'react';
import './App.css';

const TABS = { GAME: 'game', SHOP: 'shop', STATS: 'stats' };
const AUTO_INTERVAL = 2000;          // автоклик: 1 капса / 2 с
const OFFLINE_THRESHOLD = 60 * 60e3; // офлайн-модалка после 1 ч

/* ---------- ACHIEVEMENTS ---------- */
const ACHIEVEMENTS = [
  { id: 'firstClick',   text: 'Первый клик!',            check: s => s.clicks >= 1        },
  { id: 'caps1k',       text: '1000 капс!',              check: s => s.caps  >= 1000     },
  { id: 'auto',         text: 'Разблокируй автокликер',  check: s => s.autoClicker       },
  { id: 'clickLvl5',    text: 'Клик LVL 5',              check: s => s.clickLevel >= 5   },
  { id: 'energyLvl5',   text: 'Энергия LVL 5',           check: s => s.energyLevel >= 5  },
];

/* ---------- helpers ---------- */
const num = k => parseInt(localStorage.getItem(k) || '0', 10);

export default function App() {
  /* ---------- state ---------- */
  const [loading, setLoading] = useState(true);

  const [tab, setTab]               = useState(TABS.GAME);
  const [caps, setCaps]             = useState(() => num('caps'));
  const [clicks, setClicks]         = useState(() => num('clicks'));
  const [clickValue, setClickValue] = useState(() => num('clickValue') || 1);
  const [autoClicker, setAutoClicker] = useState(() => localStorage.getItem('autoClicker') === 'true');
  const [energy, setEnergy]         = useState(() => num('energy') || 20);
  const [maxEnergy, setMaxEnergy]   = useState(() => num('maxEnergy') || 20);
  const [clickLevel, setClickLevel] = useState(() => num('clickLevel') || 1);
  const [energyLevel, setEnergyLevel] = useState(() => num('energyLevel') || 1);

  const [clickGains, setClickGains] = useState([]);
  const [boostsModal, setBoostsModal] = useState(false);

  const [offlineEarned, setOfflineEarned] = useState(0);
  const [offlineModal, setOfflineModal]   = useState(false);

  /* ---------- DAILY REWARD ---------- */
  useEffect(() => {
    const today = new Date().toDateString();
    const last = localStorage.getItem('lastLogin');
    if (last !== today) {
      const reward = 20 + Math.floor(Math.random() * 10);   // 20-29 капс
      setCaps(p => {
        const next = p + reward;
        localStorage.setItem('caps', next);
        return next;
      });
      localStorage.setItem('lastLogin', today);
      setTimeout(() => alert(`🎁 Награда за вход: +${reward} капс`), 300); // чтобы не перекрывала прелоадер
    }
  }, []);

  /* ---------- preloader + offline farm ---------- */
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);

    const lastVisit = parseInt(localStorage.getItem('lastVisit') || Date.now(), 10);
    const delta = Date.now() - lastVisit;

    if (autoClicker && delta > AUTO_INTERVAL) {
      const earned = Math.floor(delta / AUTO_INTERVAL);
      if (earned) {
        setCaps(p => {
          const next = p + earned;
          localStorage.setItem('caps', next);
          return next;
        });
        setOfflineEarned(earned);
        if (delta >= OFFLINE_THRESHOLD) setOfflineModal(true);
      }
    }
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- online autoclick ---------- */
  useEffect(() => {
    if (!autoClicker) return;
    const id = setInterval(() => {
      setCaps(p => {
        const next = p + 1;
        localStorage.setItem('caps', next);
        return next;
      });
    }, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [autoClicker]);

  /* ---------- energy regen ---------- */
  useEffect(() => {
    const id = setInterval(() => {
      setEnergy(p => {
        if (p < maxEnergy) {
          const next = p + 1;
          localStorage.setItem('energy', next);
          return next;
        }
        return p;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [maxEnergy]);

  /* ---------- save all ---------- */
  useEffect(() => {
    const save = () => {
      localStorage.setItem('caps', caps);
      localStorage.setItem('clicks', clicks);
      localStorage.setItem('clickValue', clickValue);
      localStorage.setItem('autoClicker', autoClicker);
      localStorage.setItem('energy', energy);
      localStorage.setItem('maxEnergy', maxEnergy);
      localStorage.setItem('clickLevel', clickLevel);
      localStorage.setItem('energyLevel', energyLevel);
    };
    save();
  }, [caps, clicks, clickValue, autoClicker, energy, maxEnergy, clickLevel, energyLevel]);

  /* ---------- remember last visit ---------- */
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem('lastVisit', Date.now());
      }
    };
    window.addEventListener('visibilitychange', handler);
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('visibilitychange', handler);
      window.removeEventListener('beforeunload', handler);
    };
  }, []);

  /* ---------- ACHIEVEMENT check ---------- */
  useEffect(() => {
    const unlocked = JSON.parse(localStorage.getItem('achievements') || '[]');
    const state = { caps, clicks, autoClicker, clickLevel, energyLevel };
    const newly = ACHIEVEMENTS.filter(a => a.check(state) && !unlocked.includes(a.id));
    if (newly.length) {
      newly.forEach(a => alert(`🏅 Достижение: ${a.text}`));
      localStorage.setItem('achievements', JSON.stringify([...unlocked, ...newly.map(a => a.id)]));
    }
  }, [caps, clicks, autoClicker, clickLevel, energyLevel]);

  /* ---------- handlers ---------- */
  function handleClick() {
    if (!energy) return alert('Недостаточно энергии!');
    setCaps(p => p + clickValue);
    setEnergy(p => p - 1);
    setClicks(c => c + 1);

    const id = Date.now() + Math.random();
    setClickGains(p => [...p, { id, text: `+${clickValue}` }]);
    setTimeout(() => setClickGains(p => p.filter(g => g.id !== id)), 800);
  }

  function buyUpgrade(id) {
    const cost = {
      clickUpgrade: 100 * clickLevel,
      autoClicker: 250,
      energyBoost: 150 * energyLevel,
    }[id];

    if (caps < cost) return alert('Недостаточно капс');
    setCaps(p => p - cost);

    if (id === 'clickUpgrade') {
      setClickValue(v => v + 1);
      setClickLevel(l => l + 1);
    }
    if (id === 'autoClicker' && !autoClicker) setAutoClicker(true);
    if (id === 'energyBoost') {
      setMaxEnergy(m => m + 10);
      setEnergy(e => e + 10);
      setEnergyLevel(l => l + 1);
    }
  }

  /* ---------- progress to next 1000 caps ---------- */
  const progress = (caps % 1000) / 1000 * 100;

  /* ---------- UI ---------- */
  if (loading) {
    return (
      <div className="preloader">
        <div className="spinner" /><p>Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* bottom tabs */}
      <nav className="bottom-tabs">
        {Object.values(TABS).map(t => (
          <button key={t}
                  className={`bottom-tab ${tab === t ? 'active' : ''}`}
                  onClick={() => setTab(t)}>
            {t === 'game' ? '🎮' : t === 'shop' ? '🛒' : '📊'}
          </button>
        ))}
      </nav>

      {/* GAME */}
      {tab === TABS.GAME && (
        <>
          <div className="top-bar">
            <button className="boosts-toggle-button" onClick={() => setBoostsModal(true)}>
              Бусты
            </button>
            <div className="energy">🔋 {energy}/{maxEnergy}</div>
          </div>

          <div className="counter">{caps.toLocaleString('ru-RU')}</div>

          {/* progress bar */}
          <div className="progress-bar"><div style={{ width: `${progress}%` }} /></div>

          <div className="click-button-container">
            <button className="click-button"
                    disabled={!energy}
                    onClick={handleClick}>
              💣
            </button>
            {clickGains.map(g => (
              <div key={g.id} className="click-gain">{g.text}</div>
            ))}
          </div>
        </>
      )}

      {/* SHOP / STATS */}
      {tab === TABS.SHOP && <div className="shop"><p>Магазин будет позже 🙂</p></div>}
      {tab === TABS.STATS && (
        <div className="stats">
          <p>Капс: {caps.toLocaleString('ru-RU')}</p>
          <p>Кликов: {clicks.toLocaleString('ru-RU')}</p>
          <p>Сила клика: x{clickValue}</p>
          <p>Автокликер: {autoClicker ? 'Вкл.' : 'Выкл.'}</p>
          <p>Энергия: {energy}/{maxEnergy}</p>
          <p>Lvl клика: {clickLevel}</p>
          <p>Lvl энергии: {energyLevel}</p>
        </div>
      )}

      {/* BOOSTS modal */}
      {boostsModal && (
        <div className="modal-overlay" onClick={() => setBoostsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Бусты</h2>

            <div className="boosts">
              {/* click upgrade */}
              <div className="boost-card">
                <div className="boost-icon">💥</div>
                <div className="boost-info">
                  <h4>Улучшенный клик</h4>
                  <p>Уровень {clickLevel} • +{clickLevel} к силе</p>
                </div>
                <button onClick={() => buyUpgrade('clickUpgrade')}
                        disabled={caps < 100 * clickLevel}>
                  {100 * clickLevel} капс
                </button>
              </div>

              {/* auto clicker */}
              <div className="boost-card">
                <div className="boost-icon">🤖</div>
                <div className="boost-info"><h4>Автокликер</h4><p>+1 капса / 2 с</p></div>
                <button onClick={() => buyUpgrade('autoClicker')}
                        disabled={autoClicker || caps < 250}>
                  {autoClicker ? 'Куплено ✅' : '250 капс'}
                </button>
              </div>

              {/* energy boost */}
              <div className="boost-card">
                <div className="boost-icon">⚡</div>
                <div className="boost-info">
                  <h4>Энергия</h4>
                  <p>Уровень {energyLevel} • +{energyLevel*10} к максимуму</p>
                </div>
                <button onClick={() => buyUpgrade('energyBoost')}
                        disabled={caps < 150 * energyLevel}>
                  {150 * energyLevel} капс
                </button>
              </div>
            </div>

            <button className="modal-close-button" onClick={() => setBoostsModal(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* OFFLINE modal */}
      {offlineModal && (
        <div className="modal-overlay" onClick={() => setOfflineModal(false)}>
          <div className="offline-modal" onClick={e => e.stopPropagation()}>
            <h3>Автокликер трудился!</h3>
            <p>Пока вас не было, добыто:</p>
            <p className="big">{offlineEarned.toLocaleString('ru-RU')} капс</p>
            <button onClick={() => setOfflineModal(false)}>Круто!</button>
          </div>
        </div>
      )}
    </div>
  );
}
