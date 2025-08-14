import React, { useEffect, useState } from 'react';

type RoleOption = {
  number: number;
  options: string[];
};

type Props = {
  playerCount: number; // Кількість гравців у лобі
  onSave: (selectedRoles: Record<number, string>) => void; // Повертає вибрані ролі
};

const roleData: RoleOption[] = [
  { number: 1, options: ['Вбивця'] },
  { number: 2, options: ['Шпигун'] },
  { number: 3, options: ['Таємний агент', 'Чарівник', 'Провидець'] },
  { number: 4, options: ['Хлопець з рушницею'] },
  { number: 5, options: ['Містик', 'Інженер'] },
  { number: 6, options: ['Медик'] },
  { number: 7, options: ['Хакер', 'Оборотень'] },
  { number: 8, options: ['Клоун'] },
  { number: 9, options: ['Політик', 'Самурай'] },
  { number: 10, options: ['Невідомий', 'Священик'] },
];

const LobbyRoleSettings: React.FC<Props> = ({ playerCount, onSave }) => {
  const [selectedRoles, setSelectedRoles] = useState<Record<number, string>>({});

  const handleRoleChange = (number: number, role: string) => {
    setSelectedRoles(prev => ({ ...prev, [number]: role }));
  };

  const filteredRoles = roleData.filter(role => role.number <= playerCount);

  const handleSubmit = () => {
    const missing = filteredRoles.filter(role => !selectedRoles[role.number]);
    if (missing.length > 0) {
      alert('Будь ласка, виберіть роль для кожного числа!');
      return;
    }
    onSave(selectedRoles);
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Налаштування ролей для лобі</h2>
      {filteredRoles.map(({ number, options }) => (
        <div key={number} className="flex items-center space-x-4">
          <span className="w-8 font-semibold">[{number}]</span>
          {options.length === 1 ? (
            <span className="text-gray-800">{options[0]}</span>
          ) : (
            <select
              className="p-2 border rounded"
              value={selectedRoles[number] || ''}
              onChange={(e) => handleRoleChange(number, e.target.value)}
            >
              <option value="">— виберіть роль —</option>
              {options.map((role, idx) => (
                <option key={idx} value={role}>
                  {role}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Зберегти ролі
      </button>
    </div>
  );
};

export default LobbyRoleSettings;
