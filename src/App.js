import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const TABS = {
  GAME: 'game',
};

const BOOSTS = [
  {
    id: 'click',
    name: 'Улучшенный клик',
    emoji: '🖱️',
    maxLevel: 3,
    costs: [100, 200, 400],
    effects: [2, 3, 5], // множитель клика на уровнях
  },
  {
    id: 'energy',
    name: 'Энергия +10',
    emoji: '🔋',
    maxLevel: 3,
    costs: [150, 300, 600],
    effects: [10, 20, 30], // прибавка к maxEnergy
  },
];

function App() {
  const [caps, setCaps] = useState(() => parseInt(localStorage.getItem('caps')) || 0);
  const [clickValue, setClickValue] = useState(() => parseInt(localStorage.getItem('clickValue')) || 1);
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('energy')) || 20);
  const [maxEnergy, setMaxEnergy] = useState(() => parseInt(localStorage.getItem('maxEnergy')) || 20);
  const [boostLevels, setBoostLevels] = useState(() => {
    const saved = localStorage.getItem('boostLevels');
    return saved ? JSON.parse(saved) : {};
  });
  const [showBoosts, setShowBoosts] = useState(false);

  // Для всплывающих +капсов
  const [popups, setPopups] = useState([]);
  const popupId = useRef(0);

  // Автовосстановление энергии (1 ед. в минуту)
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

  // Сохраняем данные в localStorage
  useEffect(() => localStorage.setItem('caps', caps), [caps]);
  useEffect(() => localStorage.setItem('clickValue', clickValue), [clickValue]);
  useEffect(() => localStorage.setItem('energy', energy), [energy]);
  useEffect(() => localStorage.setItem('maxEnergy', maxEnergy), [maxEnergy]);
  useEffect(() => localStorage.setItem('boostLevels', JSON.stringify(boostLevels)), [boostLevels]);

  // Обработка клика по кнопке
  function handleClick() {
    if (energy <= 0) {
      alert('Недостаточно энергии!');
      return;
    }
    setCaps(prev => prev + clickValue);
    setEnergy(prev => prev - 1);

    // Анимация +капсов
    const id = popupId.current++;
    setPopups(current => [...current, { id, text: `+${clickValue}` }]);
    setTimeout(() => {
      setPopups(current => current.filter(p => p.id !== id));
    }, 700);
  }

  // Прокачка бустов
  function upgradeBoost(id) {
    const boost = BOOSTS.find(b => b.id === id);
    if (!boost) return;

    const currentLevel = boostLevels[id] || 0;
    if (currentLevel >= boost.maxLevel) return;

    const cost = boost.costs[currentLevel];
    if (caps < cost) {
      alert('Недостаточно капс!');
      return;
    }

    setCaps(caps - cost);
    const newLevel = currentLevel + 1;
    setBoostLevels(prev => {
      const updated = { ...prev, [id]: newLevel };
      localStorage.setItem('boostLevels', JSON.stringify(updated));
      return updated;
    });

    // Применяем эффекты
    if (id === 'click') {
      setClickValue(boost.effects[newLevel - 1]);
    } else if (id === 'energy') {
      // Вычисляем прирост энергии на этом уровне относительно предыдущего
      const prevEffect = boost.effects[currentLevel - 1] || 0;
      const delta = boost.effects[newLevel - 1] - prevEffect;
      setMaxEnergy(prev => {
        const next = prev + delta;
        localStorage.setItem('maxEnergy', next);
        return next;
      });
      setEnergy(prev => Math.min(prev + delta, maxEnergy + delta)); // увеличиваем текущую энергию
    }
  }

  return (
    <div className="app">
      <div className="game">
        <div className="counter">Капсы: {caps.toLocaleString('ru-RU')}</div>

        <div className="energy" title={`Энергия: ${energy} из ${maxEnergy}`}>
          <span className="battery-icon">🔋</span>
          <div className="energy-bar">
            <div className="energy-bar-fill" style={{ width: `${(energy / maxEnergy) * 100}%` }}></div>
          </div>
          <span>{energy}/{maxEnergy}</span>
        </div>

        <button
          className="click-button"
          onClick={handleClick}
          disabled={energy === 0}
          title={energy === 0 ? 'Недостаточно энергии' : 'Кликни!'}
        ></button>

        <div className="popups-container">
          {popups.map(popup => (
            <div key={popup.id} className="caps-popup">{popup.text}</div>
          ))}
        </div>

        <button className="open-boosts-btn" onClick={() => setShowBoosts(prev => !prev)}>
          🚀 Бусты
        </button>

        {showBoosts && (
          <div className="boosts-panel">
            {BOOSTS.map(boost => {
              const level = boostLevels[boost.id] || 0;
              const canUpgrade = caps >= boost.costs[level] && level < boost.maxLevel;

              return (
                <div key={boost.id} className="boost-card">
                  <div className="boost-emoji">{boost.emoji}</div>
                  <div className="boost-name">{boost.name}</div>
                  <div className="boost-level">Уровень: {level}</div>
                  <button
                    disabled={!canUpgrade}
                    onClick={() => upgradeBoost(boost.id)}
                    className="boost-upgrade-btn"
                  >
                    {level >= boost.maxLevel ? 'Максимум' : `Купить (${boost.costs[level]} капс)`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
