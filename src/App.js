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
];

function App() {
  const [tab, setTab] = useState(TABS.GAME);
  const [caps, setCaps] = useState(() => parseInt(localStorage.getItem('caps')) || 0);
  const [clickValue, setClickValue] = useState(() => parseInt(localStorage.getItem('clickValue')) || 1);
  const [autoClicker, setAutoClicker] = useState(() => localStorage.getItem('autoClicker') === 'true');

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

  useEffect(() => localStorage.setItem('caps', caps), [caps]);
  useEffect(() => localStorage.setItem('clickValue', clickValue), [clickValue]);
  useEffect(() => localStorage.setItem('autoClicker', autoClicker), [autoClicker]);

  function handleClick() {
    setCaps(prev => prev + clickValue);
  }

  function buyUpgrade(id) {
    if (id === 'clickUpgrade' && caps >= 100 && clickValue === 1) {
      setCaps(caps - 100);
      setClickValue(2);
    } else if (id === 'autoClicker' && caps >= 250 && !autoClicker) {
      setCaps(caps - 250);
      setAutoClicker(true);
    } else {
      alert('Недостаточно капс или улучшение уже куплено');
    }
  }

  return (
    <div className="app">
      <h1 className="title">Bunker Clicker</h1>
      <nav className="tabs">
        {Object.values(TABS).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`tab ${tab === t ? 'active' : ''}`}
          >
            {t === 'game' ? 'Игра' : t === 'shop' ? 'Магазин' : 'Статистика'}
          </button>
        ))}
      </nav>

      {tab === TABS.GAME && (
        <div className="game">
          <div className="counter">Капсы: {caps.toLocaleString('ru-RU')}</div>
          <button className="click-button" onClick={handleClick}></button>
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
              {item.name} — {item.cost} капс {((item.id === 'clickUpgrade' && clickValue > 1) || (item.id === 'autoClicker' && autoClicker)) && '✅'}
            </button>
          ))}
        </div>
      )}

      {tab === TABS.STATS && (
        <div className="stats">
          <p>Всего капс: {caps.toLocaleString('ru-RU')}</p>
          <p>Значение клика: x{clickValue}</p>
          <p>Автокликер: {autoClicker ? 'Включён' : 'Выключен'}</p>
        </div>
      )}
    </div>
  );
}

export default App;
