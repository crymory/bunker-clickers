import React, { useState, useEffect } from 'react';
import './App.css';

const TABS = { GAME: 'game', SHOP: 'shop', STATS: 'stats' };
const AUTO_INTERVAL = 2000;           // 1 капса каждые 2 с
const OFFLINE_THRESHOLD = 60 * 60e3;  // 1 час-офлайн

function App() {
  /* ---------- state ---------- */
  const [loading, setLoading] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineEarned, setOfflineEarned] = useState(0);

  const [tab, setTab] = useState(TABS.GAME);
  const [caps, setCaps] = useState(() => +localStorage.getItem('caps') || 0);
  const [clickValue, setClickValue] = useState(() => +localStorage.getItem('clickValue') || 1);
  const [autoClicker, setAutoClicker] = useState(() => localStorage.getItem('autoClicker') === 'true');
  const [energy, setEnergy] = useState(() => +localStorage.getItem('energy') || 20);
  const [maxEnergy, setMaxEnergy] = useState(() => +localStorage.getItem('maxEnergy') || 20);
  const [clickLevel, setClickLevel] = useState(() => +localStorage.getItem('clickLevel') || 1);
  const [energyLevel, setEnergyLevel] = useState(() => +localStorage.getItem('energyLevel') || 1);
  const [clickGains, setClickGains] = useState([]);
  const [boostsModalOpen, setBoostsModalOpen] = useState(false);

  /* ---------- прелоадер + офлайн-добыча ---------- */
  useEffect(() => {
    // эмулируем «инициализацию» (можно убрать setTimeout, если не нужно)
    const timer = setTimeout(() => setLoading(false), 1000);

    // офлайн-добыча
    const lastVisit = +localStorage.getItem('lastVisit') || Date.now();
    const delta = Date.now() - lastVisit;

    if (autoClicker && delta > AUTO_INTERVAL) {
      const earned = Math.floor(delta / AUTO_INTERVAL);
      if (earned > 0) {
        setCaps(prev => prev + earned);
        setOfflineEarned(earned);
        localStorage.setItem('caps', String(caps + earned));
        if (delta > OFFLINE_THRESHOLD) setShowOfflineModal(true);
      }
    }
    return () => clearTimeout(timer);
    // eslint-disable-next-line
  }, []); // запускается один раз

  /* ---------- автокликер онлайн ---------- */
  useEffect(() => {
    if (!autoClicker) return;
    const id = setInterval(() => {
      setCaps(prev => {
        const next = prev + 1;
        localStorage.setItem('caps', String(next));
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
          localStorage.setItem('energy', String(next));
          return next;
        }
        return prev;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [maxEnergy]);

  /* ---------- persist ---------- */
  useEffect(() => {
    localStorage.setItem('caps', String(caps));
    localStorage.setItem('clickValue', String(clickValue));
    localStorage.setItem('autoClicker', String(autoClicker));
    localStorage.setItem('energy', String(energy));
    localStorage.setItem('maxEnergy', String(maxEnergy));
    localStorage.setItem('clickLevel', String(clickLevel));
    localStorage.setItem('energyLevel', String(energyLevel));
  }, [caps, clickValue, autoClicker, energy, maxEnergy, clickLevel, energyLevel]);

  /* ---------- сохраняем дату визита при уходе ---------- */
  useEffect(() => {
    const saveVisit = () => localStorage.setItem('lastVisit', String(Date.now()));
    window.addEventListener('visibilitychange', saveVisit);
    window.addEventListener('beforeunload', saveVisit);
    return () => {
      window.removeEventListener('visibilitychange', saveVisit);
      window.removeEventListener('beforeunload', saveVisit);
    };
  }, []);

  /* ---------- click handler ---------- */
  function handleClick() {
    if (energy === 0) return alert('Недостаточно энергии!');
    setCaps(p => p + clickValue);
    setEnergy(p => p - 1);

    const id = Date.now() + Math.random();
    setClickGains(p => [...p, { id, text: `+${clickValue}` }]);
    setTimeout(() => setClickGains(p => p.filter(g => g.id !== id)), 800);
  }

  /* ---------- покупки ---------- */
  function buyUpgrade(id) {
    const can = { clickUpgrade: 100 * clickLevel, autoClicker: 250, energyBoost: 150 * energyLevel };
    if (caps < can[id]) return alert('Недостаточно капс');

    if (id === 'clickUpgrade') {
      setCaps(caps - can[id]); setClickValue(v => v + 1); setClickLevel(l => l + 1);
    } else if (id === 'autoClicker' && !autoClicker) {
      setCaps(caps - can[id]); setAutoClicker(true);
    } else if (id === 'energyBoost') {
      setCaps(caps - can[id]); setMaxEnergy(m => m + 10); setEnergy(e => e + 10); setEnergyLevel(l => l + 1);
    }
  }

  /* ---------- UI ---------- */
  if (loading) return (
    <div className="preloader">
      <div className="spinner"/><p>Загрузка…</p>
    </div>
  );

  return (
    <div className="app">
      {/* вкладки */}
      <nav className="bottom-tabs">
        {Object.values(TABS).map(t => (
          <button key={t} onClick={() => setTab(t)}
                  className={`bottom-tab ${tab === t ? 'active' : ''}`}>
            {t === 'game' ? '🎮' : t === 'shop' ? '🛒' : '📊'}
          </button>
        ))}
      </nav>

      {/* GAME */}
      {tab === TABS.GAME && (
        <>
          <div className="top-bar">
            <button className="boosts-toggle-button" onClick={() => setBoostsModalOpen(true)}>Бусты</button>
            <div className="energy" title="Энергия">🔋 {energy}/{maxEnergy}</div>
          </div>

          <div className="counter">{caps.toLocaleString('ru-RU')}</div>

          <div className="click-button-container">
            <button className="click-button"
                    onClick={handleClick}
                    disabled={energy === 0}
                    title={energy === 0 ? 'Недостаточно энергии' : 'Кликни!'}>
              💣
            </button>
            {clickGains.map(g => (
              <div key={g.id} className="click-gain">{g.text}</div>
            ))}
          </div>
        </>
      )}

      {/* SHOP / STATS (оставляем как было) */}
      {tab === TABS.SHOP && <div className="shop"><p>Магазин будет позже :)</p></div>}
      {tab === TABS.STATS && (
        <div className="stats">
          <p>Всего капс: {caps.toLocaleString('ru-RU')}</p>
          <p>Значение клика: x{clickValue}</p>
          <p>Автокликер: {autoClicker ? 'Вкл.' : 'Выкл.'}</p>
          <p>Энергия: {energy}/{maxEnergy}</p>
          <p>Lvl клика: {clickLevel}</p>
          <p>Lvl энергии: {energyLevel}</p>
        </div>
      )}

      {/* модальное окно бустов (как было) */}
      {boostsModalOpen && /* …старый модал… */}

      {/* офлайн-добыча */}
      {showOfflineModal && (
        <div className="modal-overlay" onClick={() => setShowOfflineModal(false)}>
          <div className="offline-modal" onClick={e => e.stopPropagation()}>
            <h3>Автокликер трудился!</h3>
            <p>Пока вас не было, он добыл:</p>
            <p className="big">{offlineEarned.toLocaleString('ru-RU')} капс 💰</p>
            <button onClick={() => setShowOfflineModal(false)}>Класс!</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
