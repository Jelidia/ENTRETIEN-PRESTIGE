import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";

/**
 * ADMIN ENDPOINT - One-time use to seed test users
 * Creates users in BOTH Supabase Auth AND public.users table
 *
 * ⚠️ DELETE THIS FILE AFTER USING IT IN PRODUCTION
 *
 * Usage:
 * POST /api/admin/seed-users
 * Body: { "secret": "your-secret-key-here" }
 */

const SEED_SECRET = process.env.SEED_SECRET || "DELETE_ME_AFTER_SEEDING_2026";

interface SeedUser {
  email: string;
  phone: string;
  fullName: string;
  role: "admin" | "manager" | "sales_rep" | "technician";
  department: string;
}

const SEED_USERS: SeedUser[] = [
  {
    email: "jelidiadam12@gmail.com",
    phone: "5147587963",
    fullName: "Adam Jelidi",
    role: "admin",
    department: "Executive",
  },
  {
    email: "youssef.takhi@hotmail.com",
    phone: "5145550001",
    fullName: "Youssef Takhi",
    role: "manager",
    department: "Operations",
  },
  {
    email: "jelidiadam12+2@gmail.com",
    phone: "5145550002",
    fullName: "Sales Rep Demo",
    role: "sales_rep",
    department: "Sales",
  },
  {
    email: "jelidiadam12+1@gmail.com",
    phone: "5145550003",
    fullName: "Technician Demo",
    role: "technician",
    department: "Field Services",
  },
];

const PASSWORD = "Prestige2026!";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Security check
    if (body.secret !== SEED_SECRET) {
      return NextResponse.json({ success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Get or create the company
    let { data: company } = await admin
      .from("companies")
      .select("company_id")
      .eq("name", "Entretien Prestige")
      .single();

    if (!company) {
      const { data: newCompany, error: companyError } = await admin
        .from("companies")
        .insert({
          name: "Entretien Prestige",
          legal_name: "Entretien Prestige Inc.",
          email: "info@entretien-prestige.ca",
          phone: "514-555-0000",
          address: "123 Rue Principale",
          city: "Laval",
          province: "QC",
          postal_code: "H7L 3N2",
          country: "CA",
          timezone: "America/Montreal",
          status: "active",
        })
        .select("company_id")
        .single();

      if (companyError || !newCompany) {
        return NextResponse.json({ success: false, error: "Failed to create company", details: companyError },
          { status: 500 }
        );
      }
      company = newCompany;
    }

    const results = [];
    let adminUserId: string | null = null;

    // Create each user
    for (const user of SEED_USERS) {
      try {
        // Check if user already exists in Auth
        const { data: existingAuthUsers } = await admin.auth.admin.listUsers();
        const existingAuthUser = existingAuthUsers?.users?.find(
          (u) => u.email === user.email
        );

        let authUserId: string;

        if (existingAuthUser) {
          authUserId = existingAuthUser.id;
          results.push({
            email: user.email,
            status: "already_exists_in_auth",
            user_id: authUserId,
          });
        } else {
          // Create user in Supabase Auth
          const { data: authData, error: authError } = await admin.auth.admin.createUser(
            {
              email: user.email,
              password: PASSWORD,
              email_confirm: true,
              user_metadata: {
                full_name: user.fullName,
                phone: user.phone,
              },
            }
          );

          if (authError || !authData.user) {
            results.push({
              email: user.email,
              status: "error",
              error: authError?.message || "Failed to create auth user",
            });
            continue;
          }

          authUserId = authData.user.id;
          results.push({
            email: user.email,
            status: "created_in_auth",
            user_id: authUserId,
          });
        }

        // Check if profile exists
        const { data: existingProfile } = await admin
          .from("users")
          .select("user_id")
          .eq("user_id", authUserId)
          .single();

        if (existingProfile) {
          // Update existing profile
          await admin
            .from("users")
            .update({
              company_id: company.company_id,
              email: user.email,
              phone: user.phone,
              full_name: user.fullName,
              role: user.role,
              status: "active",
              department: user.department,
              two_factor_enabled: false, // Disabled for testing
              email_verified: true,
              phone_verified: true,
            })
            .eq("user_id", authUserId);

          results.push({
            email: user.email,
            status: "updated_profile",
            user_id: authUserId,
          });
        } else {
          // Create new profile
          const { error: profileError } = await admin.from("users").insert({
            user_id: authUserId,
            company_id: company.company_id,
            email: user.email,
            phone: user.phone,
            full_name: user.fullName,
            role: user.role,
            status: "active",
            department: user.department,
            two_factor_enabled: false, // Disabled for testing
            two_factor_method: "sms",
            email_verified: true,
            phone_verified: true,
            hire_date: "2024-01-01",
          });

          if (profileError) {
            results.push({
              email: user.email,
              status: "error",
              error: `Failed to create profile: ${profileError.message}`,
            });
            continue;
          }

          results.push({
            email: user.email,
            status: "created_profile",
            user_id: authUserId,
          });
        }

        // Track admin user ID for manager relationships
        if (user.role === "admin") {
          adminUserId = authUserId;
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        results.push({
          email: user.email,
          status: "error",
          error: message,
        });
      }
    }

    // Update manager relationships
    if (adminUserId) {
      await admin
        .from("users")
        .update({ manager_id: adminUserId })
        .in("role", ["manager", "sales_rep", "technician"])
        .eq("company_id", company.company_id);
    }

    return NextResponse.json({
      success: true,
      message: "User seeding complete",
      company_id: company.company_id,
      results,
      credentials: {
        password: PASSWORD,
        users: SEED_USERS.map((u) => u.email),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: "Seeding failed",
        details: message,
      },
      { status: 500 }
    );
  }
}
