import React, { useState } from 'react';
import { Player } from '../types';

interface PlayersProps {
  players: Player[];
  onAddPlayer: (player: Player) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
}

const initialForm = { name: '', email: '', phone: '' };

const Players: React.FC<PlayersProps> = ({ players, onAddPlayer, onUpdatePlayer, onDeletePlayer }) => {
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      createdAt: new Date(),
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
    };
    onAddPlayer(newPlayer);
    setForm(initialForm);
  };

  const handleEdit = (player: Player) => {
    setEditingId(player.id);
    setForm({ name: player.name, email: player.email || '', phone: player.phone || '' });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    onUpdatePlayer({
      ...players.find(p => p.id === editingId)!,
      name: form.name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
    });
    setEditingId(null);
    setForm(initialForm);
  };

  const handleCancel = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Players</h1>
      <form onSubmit={editingId ? handleUpdate : handleAdd} className="mb-6 flex flex-col md:flex-row gap-2 items-start md:items-end">
        <input
          type="text"
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Name"
          className="border rounded px-3 py-2 mr-2"
          required
        />
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email (optional)"
          className="border rounded px-3 py-2 mr-2"
        />
        <input
          type="tel"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone (optional)"
          className="border rounded px-3 py-2 mr-2"
        />
        <button
          type="submit"
          className="bg-primary-600 text-white px-4 py-2 rounded font-semibold hover:bg-primary-700 transition-colors"
        >
          {editingId ? 'Update' : 'Add'}
        </button>
        {editingId && (
          <button type="button" onClick={handleCancel} className="ml-2 text-gray-500 hover:underline">Cancel</button>
        )}
      </form>
      <div className="bg-white rounded shadow p-6">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Phone</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {players.length === 0 && (
              <tr><td colSpan={4} className="text-gray-500 py-4 text-center">No players yet.</td></tr>
            )}
            {players.map(player => (
              <tr key={player.id} className="border-t">
                <td className="py-2 font-medium">{player.name}</td>
                <td className="py-2">{player.email || '-'}</td>
                <td className="py-2">{player.phone || '-'}</td>
                <td className="py-2">
                  <button
                    className="text-primary-600 hover:underline mr-2"
                    onClick={() => handleEdit(player)}
                  >Edit</button>
                  <button
                    className="text-red-500 hover:underline"
                    onClick={() => onDeletePlayer(player.id)}
                  >Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Players; 