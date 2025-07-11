import React, { useState, useEffect } from 'react';
import './App.css';

const TABS = {
  GAME: 'game',
  SHOP: 'shop',
  STATS: 'stats',
};

function App() {
  const [tab, setTab] = useState(TABS.GAME);
  const [caps, setCaps] = useState(() => parseInt(localStorage.getItem('caps')) || 0);
  const [clickValue, setClickValue] = useState(() => parseInt(localStorage.getItem('clickValue')) || 1);
  const [autoClicker, setAutoClicker] = useState(() => localStorage.getItem('autoClicker') === 'true');
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('energy')) || 20);
  const [maxEnergy, setMaxEnergy] = useState(() => parseInt(localStorage.getItem('maxEnergy')) || 20);

  const [clickLevel, setClickLevel] = useState(() => parseInt(localStorage.getItem('clickLevel')) || 1);
  const [energyLevel, setEnergyLevel] = useState(() => parseInt(localStorage.getItem('energyLevel')) || 1);

  const [clickGains, setClickGains] = useState([]);
  const [boostsModalOpen, setBoostsModalOpen] = useState(false);

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
  useEffect(() => localStorage.setItem('clickLevel', clickLevel), [clickLevel]);
  useEffect(() => localStorage.setItem('energyLevel', energyLevel), [energyLevel]);

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
    if (id === 'clickUpgrade' && caps >= 100 * clickLevel) {
      setCaps(caps - 100 * clickLevel);
      setClickValue(prev => prev + 1);
      setClickLevel(prev => prev + 1);
    } else if (id === 'autoClicker' && caps >= 250 && !autoClicker) {
      setCaps(caps - 250);
      setAutoClicker(true);
    } else if (id === 'energyBoost' && caps >= 150 * energyLevel) {
      setCaps(caps - 150 * energyLevel);
      setMaxEnergy(prev => prev + 10);
      setEnergy(prev => prev + 10);
      setEnergyLevel(prev => prev + 1);
    } else {
      alert('Недостаточно капс или улучшение уже куплено');
    }
  }

  return (
    <div className="app">
      {/* Нижняя панель вкладок */}
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

      {/* Контент вкладок */}
      {tab === TABS.GAME && (
        <>
          <div className="top-bar">
            <button className="boosts-toggle-button" onClick={() => setBoostsModalOpen(true)}>
              Бусты
            </button>

            <div className="energy" title="Энергия">
              <span className="battery-icon">🔋</span> {energy}/{maxEnergy}
            </div>
          </div>

          <div className="counter">Капсы: {caps.toLocaleString('ru-RU')}</div>

          <div className="click-button-container">
            <button
              className="click-button"
              onClick={handleClick}
              disabled={energy === 0}
              title={energy === 0 ? 'Недостаточно энергии' : 'Кликни!'}
            >
              💣
            </button>
            {clickGains.map(gain => (
              <div key={gain.id} className="click-gain">{gain.text}</div>
            ))}
          </div>
        </>
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
          <p>Уровень улучшенного клика: {clickLevel}</p>
          <p>Уровень энергии: {energyLevel}</p>
        </div>
      )}

      {/* Модальное окно бустов */}
      {boostsModalOpen && (
        <div className="modal-overlay" onClick={() => setBoostsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Бусты</h2>

            <div className="boosts">
              <div className="boost-card">
                <h3>Улучшенный клик</h3>
                <p>Уровень: {clickLevel} | +{clickLevel} к клику</p>
                <button
                  onClick={() => buyUpgrade('clickUpgrade')}
                  disabled={caps < 100 * clickLevel}
                >
                  Купить за {100 * clickLevel} капс
                </button>
              </div>

              <div className="boost-card">
                <h3>Автокликер</h3>
                <p>+1 капса каждые 2 секунды</p>
                <button
                  onClick={() => buyUpgrade('autoClicker')}
                  disabled={autoClicker || caps < 250}
                >
                  {autoClicker ? 'Куплено ✅' : 'Купить за 250 капс'}
                </button>
              </div>

              <div className="boost-card">
                <h3>Энергия</h3>
                <p>Уровень: {energyLevel} | +{energyLevel * 10} к максимуму энергии</p>
                <button
                  onClick={() => buyUpgrade('energyBoost')}
                  disabled={caps < 150 * energyLevel}
                >
                  Купить за {150 * energyLevel} капс
                </button>
              </div>
            </div>

            <button
              className="modal-close-button"
              onClick={() => setBoostsModalOpen(false)}
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
