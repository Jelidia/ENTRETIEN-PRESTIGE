import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabaseServer";

// WARNING: This endpoint creates users with proper authentication
// Only use in development/initial setup

export async function POST(request: Request) {
  const admin = createAdminClient();

  try {
    // Step 1: Delete all existing users
    const { data: existingUsers } = await admin.from("users").select("user_id");

    if (existingUsers && existingUsers.length > 0) {
      for (const user of existingUsers) {
        // Delete from auth.users (cascades to public.users via FK)
        await admin.auth.admin.deleteUser(user.user_id);
      }
    }

    // Step 2: Ensure company exists
    const { data: company } = await admin
      .from("companies")
      .select("company_id")
      .eq("name", "Entretien Prestige")
      .maybeSingle();

    let companyId = company?.company_id;

    if (!companyId) {
      const { data: newCompany } = await admin
        .from("companies")
        .insert({
          name: "Entretien Prestige",
          legal_name: "Entretien Prestige Inc.",
          status: "active",
          timezone: "America/Montreal",
          country: "CA",
        })
        .select("company_id")
        .single();
      companyId = newCompany!.company_id;
    }

    // Step 3: Define users to create
    const usersToCreate = [
      {
        email: "jelidiadam12@gmail.com",
        password: "jelidiadam12@gmail.com",
        full_name: "Adam Jelidi",
        phone: "+15147587963",
        role: "admin",
        two_factor_enabled: true,
        two_factor_method: "sms",
      },
      {
        email: "youssef.takhi@hotmail.com",
        password: "youssef.takhi@hotmail.com",
        full_name: "Youssef Takhi",
        phone: "+14383652445",
        role: "manager",
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      },
      {
        email: "jelidiadam12+1@gmail.com",
        password: "jelidiadam12+1@gmail.com",
        full_name: "Amine Bouchard",
        phone: "+15145550131",
        role: "technician",
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      },
      {
        email: "jelidiadam12+2@gmail.com",
        password: "jelidiadam12+2@gmail.com",
        full_name: "Nadia Tremblay",
        phone: "+15145550162",
        role: "sales_rep",
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      },
      {
        email: "jelidiadam12+3@gmail.com",
        password: "jelidiadam12+3@gmail.com",
        full_name: "Olivier Roy",
        phone: "+15145550194",
        role: "dispatcher",
        two_factor_enabled: false,
        two_factor_method: "authenticator",
      },
    ];

    // Step 4: Create users using Supabase Admin API
    const createdUsers = [];

    for (const userData of usersToCreate) {
      // Create auth user
      const { data: authUser, error: authError } = await admin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        phone: userData.phone,
        phone_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          phone: userData.phone,
        },
      });

      if (authError || !authUser.user) {
        console.error(`Failed to create auth user for ${userData.email}:`, authError);
        continue;
      }

      // Create public.users entry
      const { error: publicUserError } = await admin.from("users").insert({
        user_id: authUser.user.id,
        company_id: companyId,
        email: userData.email,
        email_verified: true,
        phone: userData.phone,
        phone_verified: true,
        full_name: userData.full_name,
        role: userData.role,
        status: "active",
        two_factor_enabled: userData.two_factor_enabled,
        two_factor_method: userData.two_factor_method,
      });

      if (publicUserError) {
        console.error(`Failed to create public user for ${userData.email}:`, publicUserError);
        // Cleanup: delete auth user if public user creation failed
        await admin.auth.admin.deleteUser(authUser.user.id);
        continue;
      }

      createdUsers.push({
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        user_id: authUser.user.id,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdUsers.length} users`,
      users: createdUsers,
      note: "All passwords are set to the email address. Users should change them after first login.",
    });
  } catch (error) {
    console.error("Seed users error:", error);
    return NextResponse.json(
      { error: "Failed to seed users", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
