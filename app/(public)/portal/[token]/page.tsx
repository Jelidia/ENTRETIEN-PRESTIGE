import { createAdminClient } from "@/lib/supabaseServer";
import { validatePortalToken } from "@/lib/security";
import { portalTokenParamSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type InvoiceRow = {
  invoice_id: string;
  invoice_number: string;
  payment_status?: string | null;
  total_amount?: number | null;
  due_date?: string | null;
  issued_date?: string | null;
};

type JobRow = {
  job_id: string;
  service_type?: string | null;
  status?: string | null;
  scheduled_date?: string | null;
  scheduled_start_time?: string | null;
  scheduled_end_time?: string | null;
};

const invoiceStatusLabels: Record<string, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  paid: "Payée",
  partially_paid: "Partielle",
  overdue: "En retard",
};

const jobStatusLabels: Record<string, string> = {
  created: "Créé",
  dispatched: "Assigné",
  in_progress: "En cours",
  completed: "Terminé",
  cancelled: "Annulé",
  no_show: "Absent",
  scheduled: "Planifié",
};

const formatDate = (value?: string | null) => {
  if (!value) return "Date à confirmer";
  const raw = value.length <= 10 ? `${value}T00:00:00` : value;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("fr-CA");
};

const formatMoney = (value?: number | null) =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(value ?? 0);

const formatTime = (value?: string | null) => {
  if (!value) return "";
  return value.slice(0, 5);
};

const formatTimeRange = (job: JobRow) => {
  const start = formatTime(job.scheduled_start_time);
  const end = formatTime(job.scheduled_end_time);
  if (start && end) {
    return `${start} - ${end}`;
  }
  if (start) {
    return `À partir de ${start}`;
  }
  return "Heure à confirmer";
};

const renderError = (title: string, message: string) => (
  <div className="content">
    <div className="page">
      <div className="card">
        <div className="card-title">{title}</div>
        <div className="card-meta">{message}</div>
      </div>
    </div>
  </div>
);

export default async function PortalPage({ params }: { params: { token: string } }) {
  const parsedParams = portalTokenParamSchema.safeParse(params);
  if (!parsedParams.success) {
    return renderError("Lien invalide", "Ce lien est invalide ou incomplet.");
  }

  const validation = validatePortalToken(parsedParams.data.token);
  if (!validation.ok) {
    const title = validation.reason === "expired" ? "Lien expiré" : "Lien invalide";
    const message =
      validation.reason === "expired"
        ? "Ce lien n'est plus actif. Veuillez demander un nouveau lien."
        : "Ce lien est invalide ou a été révoqué.";
    return renderError(title, message);
  }

  const admin = createAdminClient();
  const { payload, expiresAt } = validation;
  const { data: customer, error: customerError } = await admin
    .from("customers")
    .select("customer_id, first_name, last_name, email, phone")
    .eq("customer_id", payload.customer_id)
    .eq("company_id", payload.company_id)
    .maybeSingle();

  if (customerError || !customer) {
    return renderError("Accès refusé", "Ce lien n'est plus valide.");
  }

  const { data: company } = await admin
    .from("companies")
    .select("name")
    .eq("company_id", payload.company_id)
    .maybeSingle();

  const companyName = company?.name ?? "Entreprise";
  const customerName = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() || "Client";
  const today = new Date().toISOString().slice(0, 10);

  const { data: jobs } = await admin
    .from("jobs")
    .select("job_id, service_type, status, scheduled_date, scheduled_start_time, scheduled_end_time")
    .eq("customer_id", payload.customer_id)
    .eq("company_id", payload.company_id)
    .gte("scheduled_date", today)
    .order("scheduled_date", { ascending: true });

  const { data: invoices } = await admin
    .from("invoices")
    .select("invoice_id, invoice_number, payment_status, total_amount, due_date, issued_date")
    .eq("customer_id", payload.customer_id)
    .eq("company_id", payload.company_id)
    .order("issued_date", { ascending: false })
    .limit(20);

  return (
    <div className="content">
      <div className="page">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-label">Portail client</div>
              <div className="section-title">{companyName}</div>
            </div>
            <span className="tag">Accès temporaire</span>
          </div>
          <div className="list">
            <div className="list-item">
              <div>
                <strong>{customerName}</strong>
                <div className="card-meta">Courriel: {customer.email ?? "Non fourni"}</div>
                <div className="card-meta">Téléphone: {customer.phone ?? "Non fourni"}</div>
              </div>
              <span className="tag">Expire le {expiresAt.toLocaleDateString("fr-CA")}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-label">Rendez-vous</div>
              <div className="card-title">Prochains rendez-vous</div>
            </div>
          </div>
          {jobs && jobs.length ? (
            <div className="list">
              {jobs.map((job) => {
                const statusLabel = job.status ? jobStatusLabels[job.status] ?? job.status : "";
                return (
                  <div className="list-item" key={job.job_id}>
                    <div>
                      <strong>{job.service_type ?? "Service"}</strong>
                      <div className="card-meta">
                        {formatDate(job.scheduled_date)} · {formatTimeRange(job)}
                      </div>
                    </div>
                    <span className="tag">{statusLabel}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hint">Aucun rendez-vous planifié.</div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-label">Factures</div>
              <div className="card-title">Historique des factures</div>
            </div>
          </div>
          {invoices && invoices.length ? (
            <div className="list">
              {invoices.map((invoice: InvoiceRow) => {
                const statusLabel = invoice.payment_status
                  ? invoiceStatusLabels[invoice.payment_status] ?? invoice.payment_status
                  : "";
                const dueLabel = invoice.due_date ? formatDate(invoice.due_date) : "Échéance à confirmer";
                return (
                  <div className="list-item" key={invoice.invoice_id}>
                    <div>
                      <strong>Facture {invoice.invoice_number}</strong>
                      <div className="card-meta">Échéance: {dueLabel}</div>
                      {statusLabel ? <div className="card-meta">Statut: {statusLabel}</div> : null}
                    </div>
                    <div className="list-item-actions">
                      <span className="tag">{formatMoney(invoice.total_amount)}</span>
                      <a
                        className="button-ghost"
                        href={`/portal/${parsedParams.data.token}/invoice/${invoice.invoice_id}`}
                      >
                        Télécharger
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="hint">Aucune facture disponible.</div>
          )}
        </div>
      </div>
    </div>
  );
}
