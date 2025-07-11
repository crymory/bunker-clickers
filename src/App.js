import React, { useState, useEffect } from 'react';
import './App.css';

const TABS = {
  GAME: 'game',
  SHOP: 'shop',
  STATS: 'stats',
};

function App() {
  const [user, setUser] = useState(null); // профиль Telegram
  const [tab, setTab] = useState(TABS.GAME);
  const [caps, setCaps] = useState(0);
  const [clickValue, setClickValue] = useState(1);
  const [autoClicker, setAutoClicker] = useState(false);
  const [energy, setEnergy] = useState(20);
  const [maxEnergy, setMaxEnergy] = useState(20);
  const [clickLevel, setClickLevel] = useState(1);
  const [energyLevel, setEnergyLevel] = useState(1);

  const [clickGains, setClickGains] = useState([]);
  const [boostsModalOpen, setBoostsModalOpen] = useState(false);

  // Ключи localStorage будут с userId, чтобы разделять данные разных пользователей
  const getStorageKey = (key) => {
    if (user?.id) return `${key}_${user.id}`;
    return `guest_${key}`;
  };

  // Загрузка данных из localStorage при загрузке user
  useEffect(() => {
    if (!user) return;

    setCaps(parseInt(localStorage.getItem(getStorageKey('caps'))) || 0);
    setClickValue(parseInt(localStorage.getItem(getStorageKey('clickValue'))) || 1);
    setAutoClicker(localStorage.getItem(getStorageKey('autoClicker')) === 'true');
    setEnergy(parseInt(localStorage.getItem(getStorageKey('energy'))) || 20);
    setMaxEnergy(parseInt(localStorage.getItem(getStorageKey('maxEnergy'))) || 20);
    setClickLevel(parseInt(localStorage.getItem(getStorageKey('clickLevel'))) || 1);
    setEnergyLevel(parseInt(localStorage.getItem(getStorageKey('energyLevel'))) || 1);
  }, [user]);

  // Сохранение данных при изменении
  useEffect(() => {
    if (!user) return;

    localStorage.setItem(getStorageKey('caps'), caps);
  }, [caps, user]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem(getStorageKey('clickValue'), clickValue);
  }, [clickValue, user]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem(getStorageKey('autoClicker'), autoClicker);
  }, [autoClicker, user]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem(getStorageKey('energy'), energy);
  }, [energy, user]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem(getStorageKey('maxEnergy'), maxEnergy);
  }, [maxEnergy, user]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem(getStorageKey('clickLevel'), clickLevel);
  }, [clickLevel, user]);

  useEffect(() => {
    if (!user) return;

    localStorage.setItem(getStorageKey('energyLevel'), energyLevel);
  }, [energyLevel, user]);

  // Автокликер
  useEffect(() => {
    if (!user || !autoClicker) return;
    const interval = setInterval(() => {
      setCaps(prev => prev + 1);
    }, 2000);
    return () => clearInterval(interval);
  }, [autoClicker, user]);

  // Регенерация энергии
  useEffect(() => {
    if (!user) return;
    const regenInterval = setInterval(() => {
      setEnergy(prev => {
        if (prev < maxEnergy) return prev + 1;
        return prev;
      });
    }, 60000);
    return () => clearInterval(regenInterval);
  }, [maxEnergy, user]);

  // Получение профиля из Telegram WebApp
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      const profile = tg.initDataUnsafe?.user || null;
      setUser(profile);
      tg.ready(); // опционально — сообщаем клиенту что всё готово
    } else {
      // Для отладки или запуска вне Telegram
      setUser(null);
    }
  }, []);

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
      {/* Приветствие пользователя */}
      <div style={{ marginBottom: '10px', fontSize: '1rem', color: '#00e6a8' }}>
        {user ? (
          <>
            Привет, {user.first_name} {user.last_name || ''} {user.username ? `( @${user.username} )` : ''}
          </>
        ) : (
          <>Пожалуйста, откройте игру через Telegram WebApp для сохранения прогресса.</>
        )}
      </div>

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

          <div className="counter">{caps.toLocaleString('ru-RU')}</div>

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
                <div className="boost-icon">💥</div>
                <div className="boost-info">
                  <h4>Улучшенный клик</h4>
                  <p>Уровень: {clickLevel} — +{clickLevel} к силе клика</p>
                </div>
                <button
                  onClick={() => buyUpgrade('clickUpgrade')}
                  disabled={caps < 100 * clickLevel}
                >
                  {100 * clickLevel} капс
                </button>
              </div>

              <div className="boost-card">
                <div className="boost-icon">🤖</div>
                <div className="boost-info">
                  <h4>Автокликер</h4>
                  <p>+1 капса каждые 2 секунды</p>
                </div>
                <button
                  onClick={() => buyUpgrade('autoClicker')}
                  disabled={autoClicker || caps < 250}
                >
                  {autoClicker ? 'Куплено ✅' : '250 капс'}
                </button>
              </div>

              <div className="boost-card">
                <div className="boost-icon">⚡</div>
                <div className="boost-info">
                  <h4>Энергия</h4>
                  <p>Уровень: {energyLevel} — +{energyLevel * 10} к максимуму энергии</p>
                </div>
                <button
                  onClick={() => buyUpgrade('energyBoost')}
                  disabled={caps < 150 * energyLevel}
                >
                  {150 * energyLevel} капс
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
