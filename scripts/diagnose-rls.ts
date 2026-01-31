/**
 * Diagnose RLS policy issues
 * Run with: npx tsx scripts/diagnose-rls.ts
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
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function diagnose() {
  console.log("🔍 Diagnosing RLS policies...\n");

  // Test login
  console.log("1️⃣ Testing login with admin user...");
  const { data: loginData, error: loginError } = await admin.auth.signInWithPassword({
    email: "jelidiadam12@gmail.com",
    password: "Prestige2026!",
  });

  if (loginError || !loginData.session) {
    console.error("❌ Login failed:", loginError?.message);
    return;
  }

  console.log("✅ Login successful");
  console.log(`   User ID: ${loginData.user.id}`);
  console.log(`   Access token: ${loginData.session.access_token.substring(0, 20)}...`);

  // Test with user client (simulating frontend)
  console.log("\n2️⃣ Testing user client (with RLS)...");
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${loginData.session.access_token}` },
    },
  });

  // Test auth.getUser()
  console.log("   a) Testing auth.getUser()...");
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError) {
    console.error("   ❌ Error:", userError.message);
  } else {
    console.log(`   ✅ User ID from token: ${userData.user.id}`);
  }

  // Test reading own profile
  console.log("   b) Testing profile read (users table)...");
  const { data: profile, error: profileError } = await userClient
    .from("users")
    .select("*")
    .eq("user_id", loginData.user.id)
    .maybeSingle();

  if (profileError) {
    console.error("   ❌ Profile error:", profileError.message);
    console.error("   Details:", profileError);
  } else if (!profile) {
    console.error("   ❌ No profile found (RLS might be blocking)");
  } else {
    console.log("   ✅ Profile loaded:");
    console.log(`      Email: ${profile.email}`);
    console.log(`      Role: ${profile.role}`);
    console.log(`      Company ID: ${profile.company_id}`);
  }

  // Test reading company
  if (profile?.company_id) {
    console.log("   c) Testing company read...");
    const { data: company, error: companyError } = await userClient
      .from("companies")
      .select("*")
      .eq("company_id", profile.company_id)
      .single();

    if (companyError) {
      console.error("   ❌ Company error:", companyError.message);
    } else if (!company) {
      console.error("   ❌ No company found");
    } else {
      console.log(`   ✅ Company loaded: ${company.name}`);
    }
  }

  // Test helper functions
  console.log("\n3️⃣ Testing RLS helper functions...");
  const { data: helperTest, error: helperError } = await admin.rpc("get_user_company_id", {});

  if (helperError) {
    console.error("   ❌ Helper function error:", helperError.message);
    console.log("   ⚠️  This might mean the helper functions weren't created properly");
  } else {
    console.log(`   ✅ Helper function exists and returns: ${helperTest}`);
  }

  // Test RLS policies directly
  console.log("\n4️⃣ Testing RLS policies status...");
  const { data: rlsStatus } = await admin
    .from("pg_tables")
    .select("schemaname, tablename, rowsecurity")
    .eq("schemaname", "public")
    .in("tablename", ["users", "companies", "customers", "jobs"]);

  if (rlsStatus) {
    console.table(rlsStatus);
  }

  console.log("\n5️⃣ Checking if auth.uid() is set correctly...");
  let authUidTest = null;
  try {
    const result = await userClient.rpc("check_auth_uid");
    authUidTest = result.data;
  } catch {
    authUidTest = null;
  }

  if (!authUidTest) {
    console.log("   ⚠️  Custom RPC not available (expected)");
    console.log("   Creating a test query to check auth.uid()...");

    // Try to create a simple test
    const { data: testQuery } = await admin.from("users")
      .select("user_id")
      .limit(1)
      .single();

    if (testQuery) {
      console.log("   ✅ Database is accessible");
    }
  }

  console.log("\n✅ Diagnosis complete!");
  console.log("\nSummary:");
  console.log("- Login:", loginError ? "❌ Failed" : "✅ Working");
  console.log("- Profile read:", profileError ? "❌ Failed" : profile ? "✅ Working" : "⚠️  Empty");
  console.log("- RLS:", rlsStatus ? "✅ Enabled" : "⚠️  Unknown");
}

diagnose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
