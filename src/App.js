import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const UPGRADES = [
  {
    id: 'bunker_drill',
    name: 'Бункерная дрель',
    emoji: '🔧',
    maxLevel: 5,
    costs: [150, 300, 600, 1200, 2400],
    effects: [2, 3, 5, 8, 12],
    description: 'Увеличивает добычу ресурсов за клик'
  },
  {
    id: 'power_generator',
    name: 'Генератор питания',
    emoji: '⚡',
    maxLevel: 4,
    costs: [200, 500, 1000, 2000],
    effects: [20, 40, 70, 100],
    description: 'Увеличивает максимальную энергию'
  },
  {
    id: 'air_filter',
    name: 'Система вентиляции',
    emoji: '🌪️',
    maxLevel: 3,
    costs: [400, 800, 1600],
    effects: [5, 10, 15],
    description: 'Ускоряет восстановление энергии'
  },
  {
    id: 'storage_room',
    name: 'Склад ресурсов',
    emoji: '📦',
    maxLevel: 4,
    costs: [300, 600, 1200, 2400],
    effects: [100, 250, 500, 1000],
    description: 'Увеличивает лимит ресурсов'
  }
];

const BUNKER_ROOMS = [
  {
    id: 'living_quarters',
    name: 'Жилые помещения',
    emoji: '🏠',
    cost: 1000,
    description: 'Улучшает условия жизни в бункере'
  },
  {
    id: 'medical_bay',
    name: 'Медицинский отсек',
    emoji: '🏥',
    cost: 1500,
    description: 'Лечение и поддержка здоровья'
  },
  {
    id: 'workshop',
    name: 'Мастерская',
    emoji: '🔨',
    cost: 2000,
    description: 'Создание и ремонт оборудования'
  },
  {
    id: 'security_room',
    name: 'Охранная',
    emoji: '🛡️',
    cost: 2500,
    description: 'Защита бункера от угроз'
  }
];

function Modal({ children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}

function App() {
  // Основные состояния
  const [resources, setResources] = useState(() => parseInt(localStorage.getItem('bunker_resources')) || 0);
  const [clickPower, setClickPower] = useState(() => parseInt(localStorage.getItem('bunker_clickPower')) || 1);
  const [energy, setEnergy] = useState(() => parseInt(localStorage.getItem('bunker_energy')) || 100);
  const [maxEnergy, setMaxEnergy] = useState(() => parseInt(localStorage.getItem('bunker_maxEnergy')) || 100);
  const [energyRegen, setEnergyRegen] = useState(() => parseInt(localStorage.getItem('bunker_energyRegen')) || 1);
  const [maxStorage, setMaxStorage] = useState(() => parseInt(localStorage.getItem('bunker_maxStorage')) || 1000);
  
  // Улучшения и комнаты
  const [upgradeLevels, setUpgradeLevels] = useState(() => {
    const saved = localStorage.getItem('bunker_upgradeLevels');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [builtRooms, setBuiltRooms] = useState(() => {
    const saved = localStorage.getItem('bunker_builtRooms');
    return saved ? JSON.parse(saved) : {};
  });
  
  const [autoMinerActive, setAutoMinerActive] = useState(() => 
    localStorage.getItem('bunker_autoMiner') === 'true'
  );
  
  // UI состояния
  const [showUpgrades, setShowUpgrades] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [currentTab, setCurrentTab] = useState('upgrades');
  const [popups, setPopups] = useState([]);
  const popupId = useRef(0);

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem('bunker_resources', resources.toString());
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('bunker_clickPower', clickPower.toString());
  }, [clickPower]);

  useEffect(() => {
    localStorage.setItem('bunker_energy', energy.toString());
  }, [energy]);

  useEffect(() => {
    localStorage.setItem('bunker_maxEnergy', maxEnergy.toString());
  }, [maxEnergy]);

  useEffect(() => {
    localStorage.setItem('bunker_energyRegen', energyRegen.toString());
  }, [energyRegen]);

  useEffect(() => {
    localStorage.setItem('bunker_maxStorage', maxStorage.toString());
  }, [maxStorage]);

  useEffect(() => {
    localStorage.setItem('bunker_upgradeLevels', JSON.stringify(upgradeLevels));
  }, [upgradeLevels]);

  useEffect(() => {
    localStorage.setItem('bunker_builtRooms', JSON.stringify(builtRooms));
  }, [builtRooms]);

  useEffect(() => {
    localStorage.setItem('bunker_autoMiner', autoMinerActive.toString());
  }, [autoMinerActive]);

  // Автоматическая добыча (если есть мастерская)
  useEffect(() => {
    if (!autoMinerActive) return;
    
    const interval = setInterval(() => {
      setResources(prev => Math.min(prev + 3, maxStorage));
    }, 4000);
    
    return () => clearInterval(interval);
  }, [autoMinerActive, maxStorage]);

  // Восстановление энергии
  useEffect(() => {
    const regenInterval = setInterval(() => {
      setEnergy(prev => Math.min(prev + energyRegen, maxEnergy));
    }, 30000); // каждые 30 секунд
    
    return () => clearInterval(regenInterval);
  }, [maxEnergy, energyRegen]);

  // Основная функция добычи
  function handleMining() {
    if (energy < 15) {
      showPopup('Недостаточно энергии!', 'error');
      return;
    }

    if (resources >= maxStorage) {
      showPopup('Склад переполнен!', 'warning');
      return;
    }

    const gained = Math.min(clickPower, maxStorage - resources);
    setResources(prev => prev + gained);
    setEnergy(prev => prev - 15);

    showPopup(`+${gained} ресурсов`, 'success');
  }

  // Функция покупки улучшений
  function buyUpgrade(upgradeId) {
    const upgrade = UPGRADES.find(u => u.id === upgradeId);
    if (!upgrade) return;

    const currentLevel = upgradeLevels[upgradeId] || 0;
    if (currentLevel >= upgrade.maxLevel) return;

    const cost = upgrade.costs[currentLevel];
    if (resources < cost) {
      showPopup('Недостаточно ресурсов!', 'error');
      return;
    }

    setResources(prev => prev - cost);
    const newLevel = currentLevel + 1;
    setUpgradeLevels(prev => ({ ...prev, [upgradeId]: newLevel }));

    // Применение эффектов
    applyUpgradeEffect(upgradeId, newLevel, upgrade.effects[newLevel - 1]);
    showPopup(`${upgrade.name} улучшено!`, 'success');
  }

  // Применение эффектов улучшений
  function applyUpgradeEffect(upgradeId, level, effect) {
    switch (upgradeId) {
      case 'bunker_drill':
        setClickPower(effect);
        break;
      case 'power_generator':
        setMaxEnergy(100 + effect);
        break;
      case 'air_filter':
        setEnergyRegen(1 + effect);
        break;
      case 'storage_room':
        setMaxStorage(1000 + effect);
        break;
    }
  }

  // Функция строительства комнат
  function buildRoom(roomId) {
    const room = BUNKER_ROOMS.find(r => r.id === roomId);
    if (!room || builtRooms[roomId]) return;

    if (resources < room.cost) {
      showPopup('Недостаточно ресурсов!', 'error');
      return;
    }

    setResources(prev => prev - room.cost);
    setBuiltRooms(prev => ({ ...prev, [roomId]: true }));

    // Активация автодобычи при постройке мастерской
    if (roomId === 'workshop') {
      setAutoMinerActive(true);
    }

    showPopup(`${room.name} построено!`, 'success');
  }

  // Показ всплывающих уведомлений
  function showPopup(text, type = 'success') {
    const id = popupId.current++;
    setPopups(current => [...current, { id, text, type }]);
    setTimeout(() => {
      setPopups(current => current.filter(p => p.id !== id));
    }, 2000);
  }

  const bunkerLevel = Object.keys(builtRooms).length;
  const energyPercentage = (energy / maxEnergy) * 100;
  const storagePercentage = (resources / maxStorage) * 100;

  return (
    <div className="bunker-app">
      {/* Заголовок */}
      <header className="bunker-header">
        <div className="bunker-logo">
          <span className="bunker-icon">🏭</span>
          <div className="bunker-title">
            <h1>Bunker Tycoon</h1>
            <p>Уровень бункера: {bunkerLevel}</p>
          </div>
        </div>
        <div className="resource-display">
          <div className="resource-count">
            <span className="resource-icon">💎</span>
            <span className="resource-number">{resources.toLocaleString()}</span>
          </div>
          <div className="storage-info">
            <div className="storage-bar">
              <div className="storage-fill" style={{ width: `${storagePercentage}%` }}></div>
            </div>
            <span className="storage-text">{resources}/{maxStorage}</span>
          </div>
        </div>
      </header>

      {/* Панель энергии */}
      <div className="energy-panel">
        <div className="energy-info">
          <span className="energy-icon">⚡</span>
          <div className="energy-details">
            <div className="energy-bar">
              <div className="energy-fill" style={{ width: `${energyPercentage}%` }}></div>
            </div>
            <span className="energy-text">Энергия: {energy}/{maxEnergy}</span>
          </div>
        </div>
        <div className="energy-regen">
          <span>+{energyRegen} каждые 30с</span>
        </div>
      </div>

      {/* Основная игровая зона */}
      <main className="game-area">
        <div className="mining-section">
          <div className="bunker-visual">
            <div className="bunker-entrance">🚪</div>
            <div className="bunker-structure">
              <div className="bunker-level">
                <span className="bunker-room">🏠</span>
                <span className="bunker-room">⚡</span>
                <span className="bunker-room">🔧</span>
              </div>
              <div className="bunker-level">
                <span className="bunker-room">📦</span>
                <span className="bunker-room">🏥</span>
                <span className="bunker-room">🛡️</span>
              </div>
            </div>
          </div>

          <div className="mining-controls">
            <button 
              className={`mining-button ${energy < 15 ? 'disabled' : ''}`}
              onClick={handleMining}
              disabled={energy < 15}
            >
              <span className="mining-icon">⛏️</span>
              <span className="mining-text">ДОБЫЧА</span>
              <span className="mining-power">+{clickPower} ресурсов</span>
            </button>

            <div className="mining-status">
              <div className="status-item">
                <span className="status-icon">🔧</span>
                <span className="status-label">Мощность</span>
                <span className="status-value">{clickPower}</span>
              </div>
              <div className="status-item">
                <span className="status-icon">🤖</span>
                <span className="status-label">Автодобыча</span>
                <span className="status-value">{autoMinerActive ? 'ВКЛ' : 'ВЫКЛ'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Кнопки управления */}
        <div className="control-buttons">
          <button 
            className="control-btn upgrades-btn"
            onClick={() => setShowUpgrades(true)}
          >
            <span className="btn-icon">🔧</span>
            <span className="btn-text">Улучшения</span>
          </button>
          <button 
            className="control-btn rooms-btn"
            onClick={() => setShowRooms(true)}
          >
            <span className="btn-icon">🏗️</span>
            <span className="btn-text">Строительство</span>
          </button>
        </div>
      </main>

      {/* Всплывающие уведомления */}
      <div className="popups-container">
        {popups.map(popup => (
          <div key={popup.id} className={`popup popup-${popup.type}`}>
            {popup.text}
          </div>
        ))}
      </div>

      {/* Модальное окно улучшений */}
      {showUpgrades && (
        <Modal onClose={() => setShowUpgrades(false)}>
          <h2 className="modal-title">🔧 Улучшения оборудования</h2>
          <div className="upgrades-list">
            {UPGRADES.map(upgrade => {
              const level = upgradeLevels[upgrade.id] || 0;
              const canUpgrade = resources >= upgrade.costs[level] && level < upgrade.maxLevel;
              
              return (
                <div key={upgrade.id} className="upgrade-card">
                  <div className="upgrade-header">
                    <span className="upgrade-emoji">{upgrade.emoji}</span>
                    <div className="upgrade-info">
                      <h3 className="upgrade-name">{upgrade.name}</h3>
                      <p className="upgrade-desc">{upgrade.description}</p>
                      <div className="upgrade-level">Уровень: {level}/{upgrade.maxLevel}</div>
                    </div>
                  </div>
                  <button
                    className={`upgrade-btn ${canUpgrade ? 'available' : 'unavailable'}`}
                    onClick={() => buyUpgrade(upgrade.id)}
                    disabled={!canUpgrade}
                  >
                    {level >= upgrade.maxLevel ? 'МАКС' : `${upgrade.costs[level]} 💎`}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}

      {/* Модальное окно строительства */}
      {showRooms && (
        <Modal onClose={() => setShowRooms(false)}>
          <h2 className="modal-title">🏗️ Строительство комнат</h2>
          <div className="rooms-list">
            {BUNKER_ROOMS.map(room => {
              const isBuilt = builtRooms[room.id];
              const canBuild = resources >= room.cost && !isBuilt;
              
              return (
                <div key={room.id} className={`room-card ${isBuilt ? 'built' : ''}`}>
                  <div className="room-header">
                    <span className="room-emoji">{room.emoji}</span>
                    <div className="room-info">
                      <h3 className="room-name">{room.name}</h3>
                      <p className="room-desc">{room.description}</p>
                    </div>
                  </div>
                  <button
                    className={`room-btn ${isBuilt ? 'built' : canBuild ? 'available' : 'unavailable'}`}
                    onClick={() => buildRoom(room.id)}
                    disabled={!canBuild}
                  >
                    {isBuilt ? 'ПОСТРОЕНО' : `${room.cost} 💎`}
                  </button>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default App;
