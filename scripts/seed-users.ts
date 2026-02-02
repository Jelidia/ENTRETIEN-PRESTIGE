/**
 * Local script to seed users properly
 * Run with: npx tsx scripts/seed-users.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join } from "path";

// Load environment variables from .env.local
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

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ Missing environment variables:");
  console.error("   NEXT_PUBLIC_SUPABASE_URL:", SUPABASE_URL ? "✓" : "✗");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_KEY ? "✓" : "✗");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

async function seedUsers() {
  console.log("🌱 Starting user seeding process...\n");

  // Get or create company
  let { data: company } = await admin
    .from("companies")
    .select("company_id, name")
    .eq("name", "Entretien Prestige")
    .single();

  if (!company) {
    console.log("📦 Creating company: Entretien Prestige");
    const { data: newCompany, error } = await admin
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
      .select("company_id, name")
      .single();

    if (error) {
      console.error("❌ Failed to create company:", error);
      process.exit(1);
    }
    company = newCompany!;
    console.log(`✅ Company created: ${company.company_id}\n`);
  } else {
    console.log(`✅ Company found: ${company.name} (${company.company_id})\n`);
  }

  let adminUserId: string | null = null;

  for (const user of SEED_USERS) {
    console.log(`👤 Processing: ${user.email} (${user.role})`);

    try {
      // Delete existing auth user if exists (for clean re-seeding)
      const { data: existingUsers } = await admin.auth.admin.listUsers();
      const existing = existingUsers?.users?.find((u) => u.email === user.email);

      if (existing) {
        console.log(`   🗑️  Deleting existing auth user: ${existing.id}`);
        await admin.auth.admin.deleteUser(existing.id);
      }

      // Delete existing profile if exists
      await admin.from("users").delete().eq("email", user.email);

      // Create user in Supabase Auth
      console.log(`   🔐 Creating in Supabase Auth...`);
      const { data: authData, error: authError } = await admin.auth.admin.createUser({
        email: user.email,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          phone: user.phone,
        },
      });

      if (authError || !authData.user) {
        console.error(`   ❌ Auth error:`, authError);
        continue;
      }

      const authUserId = authData.user.id;
      console.log(`   ✅ Auth user created: ${authUserId}`);

      // Create profile in public.users
      console.log(`   📝 Creating profile in public.users...`);
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
        console.error(`   ❌ Profile error:`, profileError);
        continue;
      }

      console.log(`   ✅ Profile created`);

      if (user.role === "admin") {
        adminUserId = authUserId;
      }

      console.log(`   ✅ Complete!\n`);
    } catch (error: any) {
      console.error(`   ❌ Error:`, error.message, "\n");
    }
  }

  // Update manager relationships
  if (adminUserId) {
    console.log("🔗 Setting up manager relationships...");
    await admin
      .from("users")
      .update({ manager_id: adminUserId })
      .in("role", ["manager", "sales_rep", "technician"])
      .eq("company_id", company.company_id);
    console.log("✅ Manager relationships set\n");
  }

  // Verify
  console.log("🔍 Verifying seeded users...\n");
  const { data: users } = await admin
    .from("users")
    .select("email, full_name, role, department, phone")
    .eq("company_id", company.company_id)
    .order("role");

  if (users) {
    console.log("📊 Seeded Users:");
    console.table(users);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`\n🔑 Login credentials:`);
  console.log(`   Password (all users): ${PASSWORD}`);
  console.log(`\n📧 Test with:`);
  SEED_USERS.forEach((u) => console.log(`   - ${u.email}`));
}

seedUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
