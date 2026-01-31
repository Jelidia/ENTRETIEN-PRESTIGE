/**
 * Clean slate - Delete all profiles and recreate from Auth users
 * Run with: npx tsx scripts/clean-and-reseed.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables
try {
  const envPath = join(__dirname, "..", ".env.local");
  const envFile = readFileSync(envPath, "utf8");
  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
} catch (error) {
  console.error("❌ Could not load .env.local file");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const USER_MAPPINGS = [
  {
    email: "jelidiadam12@gmail.com",
    fullName: "Adam Jelidi",
    phone: "5147587963",
    role: "admin" as const,
    department: "Executive",
  },
  {
    email: "youssef.takhi@hotmail.com",
    fullName: "Youssef Takhi",
    phone: "5145550001",
    role: "manager" as const,
    department: "Operations",
  },
  {
    email: "jelidiadam12+2@gmail.com",
    fullName: "Sales Rep Demo",
    phone: "5145550002",
    role: "sales_rep" as const,
    department: "Sales",
  },
  {
    email: "jelidiadam12+1@gmail.com",
    fullName: "Technician Demo",
    phone: "5145550003",
    role: "technician" as const,
    department: "Field Services",
  },
];

async function cleanAndReseed() {
  console.log("🧹 Clean and reseed process starting...\n");

  // Get company
  const { data: company } = await admin
    .from("companies")
    .select("company_id")
    .eq("name", "Entretien Prestige")
    .single();

  if (!company) {
    console.error("❌ Company not found");
    return;
  }

  console.log(`✅ Found company: ${company.company_id}\n`);

  // Delete dependent records first
  console.log("🗑️  Deleting dependent records...");
  await admin.from("user_audit_log").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
  await admin.from("user_sessions").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
  await admin.from("auth_challenges").delete().neq("user_id", "00000000-0000-0000-0000-000000000000");
  console.log("✅ Dependent records deleted\n");

  // Delete ALL user profiles
  console.log("🗑️  Deleting all user profiles...");
  const { error: deleteError } = await admin
    .from("users")
    .delete()
    .eq("company_id", company.company_id);

  if (deleteError) {
    console.error("❌ Delete error:", deleteError);
    return;
  }
  console.log("✅ All profiles deleted\n");

  // Get all auth users
  const { data: authData } = await admin.auth.admin.listUsers();
  if (!authData?.users) {
    console.error("❌ Could not list auth users");
    return;
  }

  let adminUserId: string | null = null;

  // Create new profiles for each auth user
  for (const mapping of USER_MAPPINGS) {
    console.log(`👤 Processing: ${mapping.email}`);

    const authUser = authData.users.find((u) => u.email === mapping.email);

    if (!authUser) {
      console.log(`   ⚠️  No auth user found, skipping\n`);
      continue;
    }

    console.log(`   ✓ Found auth user: ${authUser.id}`);

    const { error } = await admin.from("users").insert({
      user_id: authUser.id,
      company_id: company.company_id,
      email: mapping.email,
      phone: mapping.phone,
      full_name: mapping.fullName,
      role: mapping.role,
      status: "active",
      department: mapping.department,
      two_factor_enabled: false,
      two_factor_method: "sms",
      email_verified: true,
      phone_verified: true,
      hire_date: "2024-01-01",
    });

    if (error) {
      console.log(`   ❌ Error:`, error.message, "\n");
      continue;
    }

    console.log(`   ✅ Profile created\n`);

    if (mapping.role === "admin") {
      adminUserId = authUser.id;
    }
  }

  // Set manager relationships
  if (adminUserId) {
    console.log("🔗 Setting manager relationships...");
    await admin
      .from("users")
      .update({ manager_id: adminUserId })
      .in("role", ["manager", "sales_rep", "technician"])
      .eq("company_id", company.company_id);
    console.log("✅ Manager relationships set\n");
  }

  // Verify
  console.log("🔍 Verification:\n");
  const { data: users } = await admin
    .from("users")
    .select("user_id, email, full_name, role, department")
    .eq("company_id", company.company_id)
    .order("role");

  if (users) {
    console.table(users);
    console.log(`\n✅ ${users.length} users recreated successfully!`);
    console.log("\n🔑 Password for all: Prestige2026!");
    console.log("\n✅ You can now log in!");
  }
}

cleanAndReseed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
