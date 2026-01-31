import TopBar from "@/components/TopBar";
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAccessTokenFromCookies } from "@/lib/session";
import { createUserClient } from "@/lib/supabaseServer";
import { REQUEST_ID_HEADER } from "@/lib/requestId";
import { getDefaultDashboard } from "@/lib/types";

type TeamMember = {
  user_id: string;
  full_name: string | null;
  email: string;
  role: string;
  phone: string | null;
  status: string | null;
};

async function getTeamMembers() {
  const token = getAccessTokenFromCookies();
  if (!token) {
    return { members: [], error: "session_expired" };
  }

  const client = createUserClient(token);
  const { data: { user } } = await client.auth.getUser();

  if (!user) {
    return { members: [], error: "session_expired" };
  }

  const { data: profile } = await client
    .from("users")
    .select("company_id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    return { members: [], error: "missing_profile" };
  }

  // Only admin and manager can view team - redirect others
  if (profile.role !== "admin" && profile.role !== "manager") {
    return { members: [], error: "forbidden", role: profile.role };
  }

  const { data: members, error } = await client
    .from("users")
    .select("user_id, full_name, email, role, phone, status")
    .eq("company_id", profile.company_id)
    .is("deleted_at", null)
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Failed to load team members:", error);
    return { members: [], error: "load_failed" };
  }

  return { members: (members || []) as TeamMember[], error: null };
}

export default async function TeamPage() {
  const requestId = headers().get(REQUEST_ID_HEADER) ?? undefined;
  const { members, error, role } = await getTeamMembers() as { members: TeamMember[], error: string | null, role?: string };

  // Redirect non-admin/manager users to their dashboard
  if (error === "forbidden" && role) {
    redirect(getDefaultDashboard(role));
  }

  const errorDetails =
    error === "session_expired"
      ? {
          title: "Session expirée",
          message: "Votre session a expiré. Veuillez vous reconnecter pour continuer.",
          actionHref: "/login?message=session-expired",
          actionLabel: "Se reconnecter",
        }
      : error === "missing_profile"
      ? {
          title: "Profil introuvable",
          message: "Impossible de charger votre profil. Veuillez contacter un gestionnaire.",
        }
      : error === "forbidden"
      ? {
          title: "Accès refusé",
          message: "Vous n'avez pas la permission de voir cette page.",
        }
      : error === "load_failed"
      ? {
          title: "Données indisponibles",
          message: "Impossible de charger l'équipe. Réessayez dans quelques minutes.",
        }
      : null;

  const roleLabels: Record<string, string> = {
    admin: "Administrateur",
    manager: "Gestionnaire",
    sales_rep: "Représentant",
    technician: "Technicien",
  };

  const statusLabels: Record<string, string> = {
    active: "Actif",
    inactive: "Inactif",
    suspended: "Suspendu",
  };

  return (
    <div className="page">
      <TopBar
        title="Équipe"
        subtitle={`${members.length} membre${members.length !== 1 ? "s" : ""}`}
        actions={
          errorDetails ? undefined : (
            <Link href="/admin/users" className="button-primary">
              Ajouter membre
            </Link>
          )
        }
      />

      {errorDetails ? (
        <section className="card" style={{ marginTop: 24 }}>
          <h3 className="card-title">{errorDetails.title}</h3>
          <div className="card-meta" style={{ marginTop: 8 }}>
            {errorDetails.message}
          </div>
          {errorDetails.actionHref ? (
            <Link
              className="button-primary"
              href={errorDetails.actionHref}
              style={{ marginTop: 16, display: "inline-flex" }}
            >
              {errorDetails.actionLabel}
            </Link>
          ) : null}
        </section>
      ) : (
        <section className="card" style={{ marginTop: 24 }}>
          <div className="list">
            {members.length === 0 ? (
              <div className="card-meta" style={{ padding: 16, textAlign: "center" }}>
                Aucun membre d&apos;équipe trouvé.
              </div>
            ) : (
              members.map((member) => (
                <Link
                  key={member.user_id}
                  href={`/team/${member.user_id}`}
                  className="list-item"
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div>
                    <strong>
                      {member.full_name || member.email}
                    </strong>
                    <div className="card-meta">
                      {roleLabels[member.role] || member.role}
                      {member.phone && ` · ${member.phone}`}
                    </div>
                  </div>
                  <span
                    className="pill"
                    style={{
                      backgroundColor:
                        member.status === "active"
                          ? "#DEF7EC"
                          : member.status === "inactive"
                          ? "#FEF3C7"
                          : "#FEE2E2",
                      color:
                        member.status === "active"
                          ? "#03543F"
                          : member.status === "inactive"
                          ? "#92400E"
                          : "#991B1B",
                    }}
                  >
                    {statusLabels[member.status || "inactive"] || "Inconnu"}
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}
