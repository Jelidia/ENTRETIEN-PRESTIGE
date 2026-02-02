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

async function checkRLSStatus() {
  console.log("🔍 Checking RLS status and policies...\n");

  // Check policies on users table
  const { data: policiesData, error: policiesError } = await admin.rpc('execute_sql', {
    query: `
      SELECT policyname, cmd, roles::text[]
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = 'users'
      ORDER BY policyname;
    `
  });

  if (policiesError) {
    console.log("Using direct SQL query instead...");

    // Try using a simpler approach
    const { data: tables, error: tablesError } = await admin.rpc('execute_sql', {
      query: `
        SELECT
          tablename,
          (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND pg_policies.tablename = t.tablename) as policy_count
        FROM pg_tables t
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'customers', 'jobs', 'companies', 'invoices')
        ORDER BY tablename;
      `
    });

    if (tablesError) {
      console.error("Error querying RLS status:", tablesError);
      console.log("\nTrying alternative method with raw connection...");

      // Just try to query as a regular user would
      const { data: testData, error: testError } = await admin
        .from("users")
        .select("user_id, email, role")
        .limit(1);

      if (testError) {
        console.log("❌ Error querying users table:", testError);
      } else {
        console.log("✅ Can query users table (service role bypasses RLS)");
        console.log("Sample user:", testData?.[0]);
      }
    } else {
      console.log("Table policy counts:");
      console.log(tables);
    }
  } else {
    console.log("Policies on users table:");
    console.log(policiesData);
  }

  console.log("\n📊 Checking if we can query basic tables...");

  const tables = ['companies', 'users', 'customers', 'jobs'];
  for (const table of tables) {
    const { data, error } = await admin
      .from(table)
      .select("*")
      .limit(1);

    if (error) {
      console.log(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: Can read (${data?.length || 0} rows in sample)`);
    }
  }
}

checkRLSStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
