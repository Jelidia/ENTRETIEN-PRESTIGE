import TopBar from "@/components/TopBar";
import StatusBadge from "@/components/StatusBadge";
import CustomerForm from "@/components/forms/CustomerForm";
import { getCustomers } from "@/lib/queries";

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="page">
      <TopBar
        title="Customers"
        subtitle="CRM overview and account health"
        actions={<button className="button-primary" type="button">Add customer</button>}
      />
      <div className="grid-2">
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Last service</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td>{customer.name}</td>
                  <td>{customer.type}</td>
                  <td>
                    <StatusBadge status={customer.status} />
                  </td>
                  <td>{customer.lastService}</td>
                  <td>{customer.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card">
          <h3 className="card-title">New customer</h3>
          <CustomerForm />
        </div>
      </div>
    </div>
  );
}
