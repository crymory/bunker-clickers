import React, { useState, useEffect, useRef } from 'react';
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

  // Для хранения массива всплывающих анимаций
  const [popups, setPopups] = useState([]);
  const popupId = useRef(0);

  useEffect(() => {
    if (autoClicker) {
      const interval = setInterval(() => {
        setCaps(prev => {
          const next = prev + 1;
          localStorage.setItem('caps', next);
          return next;
        });
      }, 2000);
      return () => clearInterval(interval);
    }
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

      // Добавляем всплывающий попап с уникальным id
      const id = popupId.current++;
      setPopups(current => [...current, { id, text: `+${clickValue}` }]);
      // Убираем его через 700ms
      setTimeout(() => {
        setPopups(current => current.filter(p => p.id !== id));
      }, 700);
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
      // <h1 className="title">Bunker Clicker</h1>

      {tab === TABS.GAME && (
        <div className="game">
          <div className="counter">
            Капсы: {caps.toLocaleString('ru-RU')}
          </div>

          <div className="energy" title={`Энергия: ${energy} из ${maxEnergy}`}>
  <span className="battery-icon">🔋</span>
  <div className="energy-bar">
    <div
      className="energy-bar-fill"
      style={{ width: `${(energy / maxEnergy) * 100}%` }}
    ></div>
  </div>
  <span>{energy}/{maxEnergy}</span>
</div>

          <button
            className="click-button"
            onClick={handleClick}
            disabled={energy === 0}
            title={energy === 0 ? 'Недостаточно энергии' : 'Кликни!'}
          ></button>

          {/* Рендерим все попапы */}
          <div className="popups-container">
            {popups.map(popup => (
              <div key={popup.id} className="caps-popup">
                {popup.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === TABS.SHOP && (
  <div className="shop-cards">
    {SHOP_ITEMS.map(item => {
      // Проверка доступности покупки и состояние кнопки
      const disabled =
        (item.id === 'clickUpgrade' && clickValue > 1) ||
        (item.id === 'autoClicker' && autoClicker) ||
        caps < item.cost;

      // Эмодзи для предметов по id
      const emojiMap = {
        clickUpgrade: '🖱️',
        autoClicker: '🤖',
        energyBoost: '🔋',
      };

      return (
        <div key={item.id} className={`shop-card ${disabled ? 'disabled' : ''}`}>
          <div className="shop-emoji">{emojiMap[item.id] || '❓'}</div>
          <div className="shop-name">{item.name}</div>
          <div className="shop-cost">{item.cost} капс</div>
          <button
            onClick={() => buyUpgrade(item.id)}
            disabled={disabled}
            className="shop-buy-btn"
          >
            {disabled ? 'Куплено / Недоступно' : 'Купить'}
          </button>
        </div>
      );
    })}
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
