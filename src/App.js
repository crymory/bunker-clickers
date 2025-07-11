import React, { useState, useEffect } from 'react';
import './App.css';

const TABS = {
  GAME: 'game',
  SHOP: 'shop',
  STATS: 'stats',
};

const SHOP_ITEMS = [
  { id: 'clickUpgrade', name: 'Улучшить клик (x2)', cost: 100 },
  { id: 'autoClicker', name: 'Автокликер (+1 капса/2с)', cost: 250 },
  { id: 'energyBoost', name: 'Энергия +10', cost: 150 },
];

function App() {
  const [tab, setTab] = useState(TABS.GAME);
  const [caps, setCaps] = useState(() => parseInt(localStorage.getItem('caps')) || 0);
  const [clickValue, setClickValue] = useState(() => parseInt(localStorage.getItem('clickValue')) || 1);
  const [autoClicker, setAutoClicker] = useState(() => localStorage.getItem('autoClicker') === 'true');
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('energy')) || 20);
  const [maxEnergy, setMaxEnergy] = useState(() => parseInt(localStorage.getItem('maxEnergy')) || 20);

  // Новое состояние для всплывающей анимации капсов
  const [popupCaps, setPopupCaps] = useState(null);

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
      setPopupCaps(`+${clickValue}`);
      setTimeout(() => setPopupCaps(null), 1000);
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

  return (
    <div className="app">
      <h1 className="title">Bunker Clicker</h1>

      {tab === TABS.GAME && (
        <div className="game">
          <div className="counter">
            Капсы: {caps.toLocaleString('ru-RU')}
          </div>

          <div className="energy">
            <span className="battery-icon">🔋</span> {energy}/{maxEnergy}
          </div>

          <button
            className="click-button"
            onClick={handleClick}
            disabled={energy === 0}
            title={energy === 0 ? 'Недостаточно энергии' : 'Кликни!'}
          ></button>

          {/* Всплывающий текст с прибавкой */}
          {popupCaps && <div className="caps-popup">{popupCaps}</div>}
        </div>
      )}

      {tab === TABS.SHOP && (
        <div className="shop">
          {SHOP_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => buyUpgrade(item.id)}
              className="shop-btn"
              disabled={
                (item.id === 'clickUpgrade' && clickValue > 1) ||
                (item.id === 'autoClicker' && autoClicker) ||
                caps < item.cost
              }
            >
              {item.name} — {item.cost} капс{' '}
              {((item.id === 'clickUpgrade' && clickValue > 1) || (item.id === 'autoClicker' && autoClicker)) && '✅'}
            </button>
          ))}
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
