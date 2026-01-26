import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import InvoiceForm from "@/components/forms/InvoiceForm";
import { getInvoices } from "@/lib/queries";

export default async function InvoicesPage() {
  const invoices = await getInvoices();

  return (
    <div className="page">
      <TopBar
        title="Invoices"
        subtitle="Billing status and collections"
        actions={<button className="button-primary" type="button">New invoice</button>}
      />

      <div className="grid-2">
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Due date</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.number}>
                  <td>{invoice.number}</td>
                  <td>{invoice.customer}</td>
                  <td>{invoice.dueDate}</td>
                  <td>
                    <StatusBadge status={invoice.status} />
                  </td>
                  <td>{invoice.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 className="card-title">Create invoice</h3>
          <InvoiceForm />
        </div>
      </div>
    </div>
  );
}
