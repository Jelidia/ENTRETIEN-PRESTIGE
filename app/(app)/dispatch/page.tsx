import DispatchColumn from "@/components/DispatchColumn";
import TopBar from "@/components/TopBar";
import { getDispatchBoard } from "@/lib/queries";

export default async function DispatchPage() {
  const board = await getDispatchBoard();

  return (
    <div className="page">
      <TopBar
        title="Dispatch"
        subtitle="Week view and crew balance"
        actions={
          <>
            <button className="button-secondary" type="button">
              Auto-assign
            </button>
            <button className="button-primary" type="button">
              New job
            </button>
          </>
        }
      />

      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
        }}
      >
        {board.map((column) => (
          <DispatchColumn key={column.technician} column={column} />
        ))}
      </div>
    </div>
  );
}
