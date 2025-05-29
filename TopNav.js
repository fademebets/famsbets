export default function TopNav() {
  return (
    <nav className="bg-black text-white flex justify-between p-4">
      <div className="flex space-x-6">
        <a href="/+ev">+EV</a>
        <a href="/lock">🔒 Lock of the Day</a>
        <a href="/standings">Standings</a>
        <a href="/odds">Odds</a>
        <a href="/tools/parlay">Parlay Calculator</a>
        <a href="/tools/ev">EV Calculator</a>
      </div>
      <div>🔔</div>
    </nav>
  )
}
