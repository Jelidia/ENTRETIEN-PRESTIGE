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

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkPolicies() {
  console.log("🔍 Checking actual RLS policies in database...\n");

  // Query for all policies on the users table
  const { data, error } = await admin
    .from("pg_policies")
    .select("*")
    .eq("tablename", "users")
    .eq("schemaname", "public");

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${data?.length || 0} policies on users table:\n`);

  if (data && data.length > 0) {
    data.forEach((policy: any) => {
      console.log(`Policy: ${policy.policyname}`);
      console.log(`  Command: ${policy.cmd}`);
      console.log(`  USING: ${policy.qual}`);
      console.log(`  WITH CHECK: ${policy.with_check}`);
      console.log("");
    });
  } else {
    console.log("⚠️  No policies found!");
  }

  // Check if RLS is enabled
  const { data: tableInfo } = await admin
    .from("pg_tables")
    .select("*")
    .eq("tablename", "users")
    .eq("schemaname", "public")
    .single();

  if (tableInfo) {
    console.log(`\nRLS Status: ${(tableInfo as any).rowsecurity ? "✅ ENABLED" : "❌ DISABLED"}`);
  }
}

checkPolicies()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
