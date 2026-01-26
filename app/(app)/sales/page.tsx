import TopBar from "@/components/TopBar";
import { getLeaderboard } from "@/lib/queries";

export default async function SalesPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="page">
      <TopBar
        title="Sales"
        subtitle="Territory performance and leaderboard"
        actions={<button className="button-secondary" type="button">Assign territory</button>}
      />

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Representative</th>
              <th>Revenue</th>
              <th>Leads</th>
              <th>Conversion</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((rep) => (
              <tr key={rep.rank}>
                <td>{rep.rank}</td>
                <td>{rep.name}</td>
                <td>{rep.revenue}</td>
                <td>{rep.leads}</td>
                <td>{rep.conversion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
