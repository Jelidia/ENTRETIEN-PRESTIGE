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
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function verifyUsers() {
  console.log("🔍 Checking users in database...\n");

  // Check public.users table
  const { data: profiles, error: profilesError } = await admin
    .from("users")
    .select("user_id, email, role, full_name")
    .order("created_at");

  if (profilesError) {
    console.error("❌ Error querying profiles:", profilesError);
    return;
  }

  console.log(`Found ${profiles?.length || 0} users in public.users table:`);
  profiles?.forEach((user: any) => {
    console.log(`  - ${user.email} (${user.role}) - ${user.full_name}`);
  });

  // Check auth.users table
  console.log("\n🔍 Checking Supabase Auth users...\n");

  const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();

  if (authError) {
    console.error("❌ Error querying auth users:", authError);
    return;
  }

  console.log(`Found ${authUsers.users?.length || 0} users in auth.users:`);
  authUsers.users?.forEach((user: any) => {
    console.log(`  - ${user.email} (ID: ${user.id.substring(0, 8)}...)`);
  });

  // Cross-reference
  console.log("\n✅ Users with matching Auth + Profile:");
  const profileEmails = new Set(profiles?.map((p: any) => p.email) || []);
  const authEmails = new Set(authUsers.users?.map((u: any) => u.email) || []);

  const matched = profiles?.filter((p: any) => authEmails.has(p.email)) || [];
  matched.forEach((user: any) => {
    console.log(`  ✅ ${user.email} (${user.role})`);
  });

  const profilesOnly = profiles?.filter((p: any) => !authEmails.has(p.email)) || [];
  if (profilesOnly.length > 0) {
    console.log("\n⚠️  Users with profile but NO auth:");
    profilesOnly.forEach((user: any) => {
      console.log(`  ⚠️  ${user.email} (${user.role})`);
    });
  }

  const authOnly = authUsers.users?.filter((u: any) => !profileEmails.has(u.email)) || [];
  if (authOnly.length > 0) {
    console.log("\n⚠️  Users with auth but NO profile:");
    authOnly.forEach((user: any) => {
      console.log(`  ⚠️  ${user.email}`);
    });
  }
}

verifyUsers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
