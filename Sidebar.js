const sports = ["nfl", "nba", "mlb", "ncaaf", "ncaab", "ufc"];

export default function Sidebar({ selected, setSelected }) {
  return (
    <aside className="w-40 bg-gray-100 p-4">
      {sports.map((sport) => (
        <div
          key={sport}
          className={\`cursor-pointer mb-2 \${selected === sport ? "font-bold text-blue-600" : ""}\`}
          onClick={() => setSelected(sport)}
        >
          {sport.toUpperCase()}
        </div>
      ))}
    </aside>
  );
}
