import React, { useState } from 'react';
import Papa from 'papaparse';
import { supabase } from '../utils/supabaseClient';

interface CsvRow {
  Date: string;
  [key: string]: string;
}

const CsvImport: React.FC = () => {
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSuccess('');
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data as CsvRow[]);
      },
      error: (err) => {
        setError('Failed to parse CSV: ' + err.message);
      }
    });
  };

  const handleImport = async () => {
    setLoading(true);
    setSuccess('');
    setError('');
    try {
      // First, ensure players exist
      let gillesPlayer, tadPlayer;
      try {
        // Try to get existing players
        const { data: players, error: playersError } = await supabase.from('players').select('*');
        if (playersError) throw playersError;
        gillesPlayer = players.find((p: any) => p.name === 'Gilles');
        tadPlayer = players.find((p: any) => p.name === 'Tad');
        // Create players if they don't exist
        if (!gillesPlayer) {
          const { data, error } = await supabase.from('players').insert([{ name: 'Gilles' }]).select();
          if (error) throw error;
          gillesPlayer = data && data[0];
        }
        if (!tadPlayer) {
          const { data, error } = await supabase.from('players').insert([{ name: 'Tad' }]).select();
          if (error) throw error;
          tadPlayer = data && data[0];
        }
      } catch (playerError) {
        console.error('Error handling players:', playerError);
        setError('Failed to create/find players: ' + (playerError as Error).message);
        setLoading(false);
        return;
      }
      for (const row of csvData) {
        // Parse date
        const dateString = row[''];
        if (!dateString) {
          console.log('Skipping row - no date found');
          console.log(row);
          continue;
        }
        // Validate and parse date (European style: dd/mm/YYYY)
        let parsedDate: Date;
        try {
          const dateParts = dateString.split('/');
          if (dateParts.length === 3) {
            const day = parseInt(dateParts[0], 10);
            const month = parseInt(dateParts[1], 10) - 1;
            const year = parseInt(dateParts[2], 10);
            parsedDate = new Date(year, month, day);
          } else {
            parsedDate = new Date(dateString);
          }
          if (isNaN(parsedDate.getTime())) {
            console.log('Skipping row - invalid date:', dateString);
            console.log(row);
            continue;
          }
        } catch (err) {
          continue;
        }
        // Parse sets
        const sets = [];
        for (let i = 1; i <= 6; i++) {
          const gillesScore = row[`Set ${i}`];
          const tadScore = row[`_${i + 1}`];
          if (gillesScore && tadScore) {
            sets.push({
              player1Score: parseInt(gillesScore, 10),
              player2Score: parseInt(tadScore, 10),
              winner: parseInt(gillesScore, 10) > parseInt(tadScore, 10) ? 'player1' : 'player2',
            });
          }
        }
        if (sets.length === 0) {
          continue;
        }
        // Count sets won by each player
        const p1SetWins = sets.filter(s => s.winner === 'player1').length;
        const p2SetWins = sets.filter(s => s.winner === 'player2').length;
        let matchWinner: 'player1' | 'player2' | undefined = undefined;
        if (p1SetWins > p2SetWins) matchWinner = 'player1';
        else if (p2SetWins > p1SetWins) matchWinner = 'player2';
        // Create match with actual player IDs
        const { data: matchData, error: matchError } = await supabase.from('matches').insert([
          {
            sportType: 'badminton',
            matchType: 'singles',
            player1Id: gillesPlayer.id,
            player2Id: tadPlayer.id,
            player1Name: 'Gilles',
            player2Name: 'Tad',
            date: parsedDate.toISOString(),
            winner: matchWinner,
          }
        ]).select();
        if (matchError) throw matchError;
        const newMatch = matchData && matchData[0];
        if (!newMatch) continue;
        // Insert sets
        const setsToInsert = sets.map(set => ({
          matchId: newMatch.id,
          player1Score: set.player1Score,
          player2Score: set.player2Score,
          winner: set.winner
        }));
        if (setsToInsert.length > 0) {
          const { error: setsError } = await supabase.from('sets').insert(setsToInsert);
          if (setsError) throw setsError;
        }
      }
      setSuccess('CSV data imported successfully!');
    } catch (err) {
      setError('Failed to import data: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">CSV Import</h1>
      <input type="file" accept=".csv" onChange={handleFileChange} className="mb-4" />
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 mb-4 rounded">{error}</div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 mb-4 rounded">{success}</div>}
      {csvData.length > 0 && (
        <>
          <div className="mb-4">
            <button
              onClick={handleImport}
              disabled={loading}
              className="bg-primary-600 text-white px-4 py-2 rounded font-semibold hover:bg-primary-700 transition-colors"
            >
              {loading ? 'Importing...' : 'Import to Database'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs border">
              <thead>
                <tr>
                  {Object.keys(csvData[0]).map((key) => (
                    <th key={key} className="border px-2 py-1 bg-gray-100">{key}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="border px-2 py-1">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-gray-500 mt-2">Showing first 5 rows</div>
          </div>
        </>
      )}
    </div>
  );
};

export default CsvImport; 