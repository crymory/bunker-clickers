import React, { useState, useEffect } from 'react';

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

  // Автокликер
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

  // Сохраняем капсы и клик в localStorage
  useEffect(() => {
    localStorage.setItem('caps', caps);
  }, [caps]);

  useEffect(() => {
    localStorage.setItem('clickValue', clickValue);
  }, [clickValue]);

  useEffect(() => {
    localStorage.setItem('autoClicker', autoClicker);
  }, [autoClicker]);

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
    <div style={{ maxWidth: 480, margin: 'auto', padding: 20, fontFamily: 'Segoe UI, sans-serif', color: '#fff', background: 'linear-gradient(to bottom, #0f2027, #203a43, #2c5364)', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center' }}>Bunker Clicker</h1>
      <nav style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        {Object.values(TABS).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              margin: '0 10px',
              padding: '10px 15px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              backgroundColor: tab === t ? '#16a085' : '#117864',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            {t === 'game' ? 'Игра' : t === 'shop' ? 'Магазин' : 'Статистика'}
          </button>
        ))}
      </nav>

      {tab === TABS.GAME && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 20 }}>Капсы: {caps.toLocaleString('ru-RU')}</div>
          <button
            onClick={handleClick}
            style={{
              padding: '20px 40px',
              fontSize: 24,
              background: '#1abc9c',
              border: 'none',
              borderRadius: 12,
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 6px #117864',
              userSelect: 'none',
            }}
          >
            💥 Кликни!
          </button>
        </div>
      )}

      {tab === TABS.SHOP && (
        <div>
          {SHOP_ITEMS.map(item => (
            <div key={item.id} style={{ marginBottom: 15 }}>
              <button
                disabled={
                  (item.id === 'clickUpgrade' && clickValue > 1) ||
                  (item.id === 'autoClicker' && autoClicker) ||
                  caps < item.cost
                }
                onClick={() => buyUpgrade(item.id)}
                style={{
                  width: '100%',
                  padding: '15px',
                  fontSize: 18,
                  borderRadius: 12,
                  border: 'none',
                  backgroundColor:
                    (item.id === 'clickUpgrade' && clickValue > 1) ||
                    (item.id === 'autoClicker' && autoClicker)
                      ? '#27ae60'
                      : caps >= item.cost
                      ? '#0984e3'
                      : '#b2bec3',
                  color: 'white',
                  cursor: caps >= item.cost ? 'pointer' : 'not-allowed',
                }}
              >
                {item.name} — {item.cost} капс {((item.id === 'clickUpgrade' && clickValue > 1) || (item.id === 'autoClicker' && autoClicker)) && '✅'}
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === TABS.STATS && (
        <div style={{ textAlign: 'center', fontSize: 18 }}>
          <p>Всего капс: {caps.toLocaleString('ru-RU')}</p>
          <p>Значение клика: x{clickValue}</p>
          <p>Автокликер: {autoClicker ? 'Включён' : 'Выключен'}</p>
        </div>
      )}
    </div>
  );
}

export default App;
