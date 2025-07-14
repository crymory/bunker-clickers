import React, { useState, useEffect } from 'react';
import './App.css';

/* --- константы --- */
const TABS = { GAME: 'game', SHOP: 'shop', STATS: 'stats' };
const AUTO_INTERVAL = 2000;           // автоклик: 1 капса / 2 с
const OFFLINE_THRESHOLD = 60 * 60e3;  // офлайн-модалка после 1 ч

/* --- хелперы --- */
const num = key => parseInt(localStorage.getItem(key) || '0', 10);

function App() {
  /* ---------- состояние ---------- */
  const [loading, setLoading] = useState(true);

  const [tab, setTab]           = useState(TABS.GAME);
  const [caps, setCaps]         = useState(() => num('caps'));
  const [clickValue, setClickValue] = useState(() => num('clickValue') || 1);
  const [autoClicker, setAutoClicker] = useState(() => localStorage.getItem('autoClicker') === 'true');
  const [energy, setEnergy]     = useState(() => num('energy') || 20);
  const [maxEnergy, setMaxEnergy] = useState(() => num('maxEnergy') || 20);
  const [clickLevel, setClickLevel] = useState(() => num('clickLevel') || 1);
  const [energyLevel, setEnergyLevel] = useState(() => num('energyLevel') || 1);

  const [clickGains, setClickGains] = useState([]);
  const [boostsModal, setBoostsModal] = useState(false);

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineEarned, setOfflineEarned] = useState(0);

  /* ---------- прелоадер + офлайн-фарм ---------- */
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);   // имитация загрузки

    /* офлайн-калькуляция */
    const lastVisit = parseInt(localStorage.getItem('lastVisit') || Date.now(), 10);
    const delta = Date.now() - lastVisit;

    if (autoClicker && delta > AUTO_INTERVAL) {
      const earned = Math.floor(delta / AUTO_INTERVAL);
      if (earned > 0) {
        setCaps(prev => {
          const next = prev + earned;
          localStorage.setItem('caps', next);
          return next;
        });
        setOfflineEarned(earned);
        if (delta >= OFFLINE_THRESHOLD) setShowOfflineModal(true);
      }
    }

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- онлайн-автоклик ---------- */
  useEffect(() => {
    if (!autoClicker) return;
    const id = setInterval(() => {
      setCaps(prev => {
        const next = prev + 1;
        localStorage.setItem('caps', next);
        return next;
      });
    }, AUTO_INTERVAL);
    return () => clearInterval(id);
  }, [autoClicker]);

  /* ---------- реген энергии ---------- */
  useEffect(() => {
    const id = setInterval(() => {
      setEnergy(prev => {
        if (prev < maxEnergy) {
          const next = prev + 1;
          localStorage.setItem('energy', next);
          return next;
        }
        return prev;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [maxEnergy]);

  /* ---------- запись всех стейтов ---------- */
  useEffect(() => {
    localStorage.setItem('caps', caps);
    localStorage.setItem('clickValue', clickValue);
    localStorage.setItem('autoClicker', autoClicker);
    localStorage.setItem('energy', energy);
    localStorage.setItem('maxEnergy', maxEnergy);
    localStorage.setItem('clickLevel', clickLevel);
    localStorage.setItem('energyLevel', energyLevel);
  }, [caps, clickValue, autoClicker, energy, maxEnergy, clickLevel, energyLevel]);

  /* ---------- запоминаем время ухода ---------- */
  useEffect(() => {
    const saveVisit = () => {
      if (document.visibilityState === 'hidden') {
        localStorage.setItem('lastVisit', Date.now());
      }
    };
    window.addEventListener('visibilitychange', saveVisit);
    window.addEventListener('beforeunload', saveVisit);
    return () => {
      window.removeEventListener('visibilitychange', saveVisit);
      window.removeEventListener('beforeunload', saveVisit);
    };
  }, []);

  /* ---------- клик по бомбе ---------- */
  function handleClick() {
    if (!energy) return alert('Недостаточно энергии!');
    setCaps(p => p + clickValue);
    setEnergy(p => p - 1);

    const id = Date.now() + Math.random();
    setClickGains(p => [...p, { id, text: `+${clickValue}` }]);
    setTimeout(() => setClickGains(p => p.filter(g => g.id !== id)), 800);
  }

  /* ---------- покупки ---------- */
  function buyUpgrade(id) {
    const cost = {
      clickUpgrade: 100 * clickLevel,
      autoClicker: 250,
      energyBoost: 150 * energyLevel,
    }[id];

    if (caps < cost) return alert('Недостаточно капс!');

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

  /* ---------- UI-часть ---------- */
  if (loading) {
    return (
      <div className="preloader">
        <div className="spinner" /><p>Загрузка…</p>
      </div>
    );
  }

  return (
    <div className="app">
      {/* нижние вкладки */}
      <nav className="bottom-tabs">
        {Object.values(TABS).map(t => (
          <button key={t}
                  className={`bottom-tab ${tab === t ? 'active' : ''}`}
                  onClick={() => setTab(t)}>
            {t === 'game' ? '🎮' : t === 'shop' ? '🛒' : '📊'}
          </button>
        ))}
      </nav>

      {/* --- GAME --- */}
      {tab === TABS.GAME && (
        <>
          <div className="top-bar">
            <button className="boosts-toggle-button" onClick={() => setBoostsModal(true)}>
              Бусты
            </button>
            <div className="energy" title="Энергия">
              🔋 {energy}/{maxEnergy}
            </div>
          </div>

          <div className="counter">{caps.toLocaleString('ru-RU')}</div>

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

      {/* --- SHOP / STATS --- */}
      {tab === TABS.SHOP && <div className="shop"><p>Магазин будет позже 🙂</p></div>}
      {tab === TABS.STATS && (
        <div className="stats">
          <p>Всего капс: {caps.toLocaleString('ru-RU')}</p>
          <p>Сила клика: x{clickValue}</p>
          <p>Автокликер: {autoClicker ? 'Вкл.' : 'Выкл.'}</p>
          <p>Энергия: {energy}/{maxEnergy}</p>
          <p>Lvl клика: {clickLevel}</p>
          <p>Lvl энергии: {energyLevel}</p>
        </div>
      )}

      {/* --- модалка бустов --- */}
      {boostsModal && (
        <div className="modal-overlay" onClick={() => setBoostsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Бусты</h2>

            <div className="boosts">
              {/* click */}
              <div className="boost-card">
                <div className="boost-icon">💥</div>
                <div className="boost-info">
                  <h4>Улучшенный клик</h4>
                  <p>Уровень: {clickLevel} • +{clickLevel} к силе клика</p>
                </div>
                <button
                  onClick={() => buyUpgrade('clickUpgrade')}
                  disabled={caps < 100 * clickLevel}>
                  {100 * clickLevel} капс
                </button>
              </div>

              {/* auto */}
              <div className="boost-card">
                <div className="boost-icon">🤖</div>
                <div className="boost-info">
                  <h4>Автокликер</h4>
                  <p>+1 капса каждые 2 с</p>
                </div>
                <button
                  onClick={() => buyUpgrade('autoClicker')}
                  disabled={autoClicker || caps < 250}>
                  {autoClicker ? 'Куплено ✅' : '250 капс'}
                </button>
              </div>

              {/* energy */}
              <div className="boost-card">
                <div className="boost-icon">⚡</div>
                <div className="boost-info">
                  <h4>Энергия</h4>
                  <p>Уровень: {energyLevel} • +{energyLevel * 10} к максимуму энергии</p>
                </div>
                <button
                  onClick={() => buyUpgrade('energyBoost')}
                  disabled={caps < 150 * energyLevel}>
                  {150 * energyLevel} капс
                </button>
              </div>
            </div>

            <button className="modal-close-button"
                    onClick={() => setBoostsModal(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* --- офлайн-модалка --- */}
      {showOfflineModal && (
        <div className="modal-overlay" onClick={() => setShowOfflineModal(false)}>
          <div className="offline-modal" onClick={e => e.stopPropagation()}>
            <h3>Автокликер трудился!</h3>
            <p>Пока вас не было, добыто:</p>
            <p className="big">{offlineEarned.toLocaleString('ru-RU')} капс 💰</p>
            <button onClick={() => setShowOfflineModal(false)}>Класс!</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
