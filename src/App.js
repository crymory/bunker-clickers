// App.js
import React, { useState, useEffect } from 'react';
import './App.css';

const TABS = {
  GAME: 'game',
  SHOP: 'shop',
  STATS: 'stats'
};

function App() {
  const [tab, setTab] = useState(TABS.GAME);
  const [caps, setCaps] = useState(() => parseInt(localStorage.getItem('caps')) || 0);
  const [clickValue, setClickValue] = useState(() => parseInt(localStorage.getItem('clickValue')) || 1);
  const [autoClicker, setAutoClicker] = useState(() => localStorage.getItem('autoClicker') === 'true');
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('energy')) || 20);
  const [maxEnergy, setMaxEnergy] = useState(() => parseInt(localStorage.getItem('maxEnergy')) || 20);
  const [clickGains, setClickGains] = useState([]);
  const [showBoostsModal, setShowBoostsModal] = useState(false);

  useEffect(() => {
    let interval = null;
    if (autoClicker) {
      interval = setInterval(() => {
        setCaps(prev => {
          const next = prev + 1;
          localStorage.setItem('caps', next);
          return next;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [autoClicker]);

  useEffect(() => {
    const regenInterval = setInterval(() => {
      setEnergy(prev => {
        if (prev < maxEnergy) {
          const next = prev + 1;
          localStorage.setItem('energy', next);
          return next;
        }
        return prev;
      });
    }, 60000);
    return () => clearInterval(regenInterval);
  }, [maxEnergy]);

  useEffect(() => localStorage.setItem('caps', caps), [caps]);
  useEffect(() => localStorage.setItem('clickValue', clickValue), [clickValue]);
  useEffect(() => localStorage.setItem('autoClicker', autoClicker), [autoClicker]);
  useEffect(() => localStorage.setItem('energy', energy), [energy]);
  useEffect(() => localStorage.setItem('maxEnergy', maxEnergy), [maxEnergy]);

  function handleClick() {
    if (energy > 0) {
      setCaps(prev => prev + clickValue);
      setEnergy(prev => prev - 1);
      const id = Date.now() + Math.random();
      setClickGains(prev => [...prev, { id, text: `+${clickValue}` }]);
      setTimeout(() => {
        setClickGains(prev => prev.filter(g => g.id !== id));
      }, 800);
    } else {
      alert('Недостаточно энергии!');
    }
  }

  function buyUpgrade(id) {
    if (id === 'clickUpgrade' && caps >= 100 && clickValue === 1) {
      setCaps(caps - 100);
      setClickValue(2);
    } else if (id === 'autoClicker' && caps >= 250 && !autoClicker) {
      setCaps(caps - 250);
      setAutoClicker(true);
    } else if (id === 'energyBoost' && caps >= 150) {
      setCaps(caps - 150);
      setMaxEnergy(prev => prev + 10);
      setEnergy(prev => prev + 10);
    } else {
      alert('Недостаточно капс или улучшение уже куплено');
    }
  }

  function openBoostsModal() {
    setShowBoostsModal(true);
  }

  function closeBoostsModal() {
    setShowBoostsModal(false);
  }

  return (
    <div className="app">
      {tab === TABS.GAME && (
        <div className="game">
          <div className="counter">Капсы: {caps.toLocaleString('ru-RU')}</div>
          <div className="energy">
            <span className="battery-icon">🔋</span> {energy}/{maxEnergy}
          </div>

          <button className="boosts-toggle-button" onClick={openBoostsModal}>⚡ Бусты</button>

          <div className="click-button-container">
            <button
              className="click-button"
              onClick={handleClick}
              disabled={energy === 0}
              title={energy === 0 ? 'Недостаточно энергии' : 'Кликни!'}
            ></button>
            {clickGains.map(gain => (
              <div key={gain.id} className="click-gain">{gain.text}</div>
            ))}
          </div>
        </div>
      )}

      {tab === TABS.SHOP && (
        <div className="shop">
          <p>Магазин будет позже :)</p>
        </div>
      )}

      {tab === TABS.STATS && (
        <div className="stats">
          <p>Всего капс: {caps.toLocaleString('ru-RU')}</p>
          <p>Значение клика: x{clickValue}</p>
          <p>Автокликер: {autoClicker ? 'Включён' : 'Выключен'}</p>
          <p>Энергия: {energy}/{maxEnergy}</p>
        </div>
      )}

      {showBoostsModal && (
  <div className="modal-overlay" onClick={closeBoostsModal}>
    <div className="modal-content" onClick={e => e.stopPropagation()}>
      <h2>Улучшения</h2>

      <div className="boosts">
        <div className="boost-card">
          <h3>Улучшенный клик</h3>
          <p>x2 к силе клика</p>
          <button
            onClick={() => buyUpgrade('clickUpgrade')}
            disabled={clickValue > 1 || caps < 100}
          >
            {clickValue > 1 ? 'Куплено ✅' : 'Купить за 100 капс'}
          </button>
        </div>

        <div className="boost-card">
          <h3>Автокликер</h3>
          <p>+1 капса каждые 2с</p>
          <button
            onClick={() => buyUpgrade('autoClicker')}
            disabled={autoClicker || caps < 250}
          >
            {autoClicker ? 'Куплено ✅' : 'Купить за 250 капс'}
          </button>
        </div>

        <div className="boost-card">
          <h3>Энергия</h3>
          <p>+10 к максимуму энергии</p>
          <button
            onClick={() => buyUpgrade('energyBoost')}
            disabled={caps < 150}
          >
            Купить за 150 капс
          </button>
        </div>
      </div>

      <button className="modal-close-button" onClick={closeBoostsModal}>
        Закрыть
      </button>
    </div>
  </div>
)}


      <nav className="bottom-tabs">
        {Object.values(TABS).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`bottom-tab ${tab === t ? 'active' : ''}`}
          >
            {t === 'game' ? '🎮' : t === 'shop' ? '🛒' : '📊'}
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
