/**
 * Fix user profiles to link them with Supabase Auth users
 * Run with: npx tsx scripts/fix-user-profiles.ts
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

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const USERS_TO_FIX = [
  { email: "jelidiadam12@gmail.com", role: "admin" },
  { email: "youssef.takhi@hotmail.com", role: "manager" },
];

async function fixProfiles() {
  console.log("🔧 Fixing user profiles...\n");

  // Get all auth users
  const { data: authUsers } = await admin.auth.admin.listUsers();

  if (!authUsers?.users) {
    console.error("❌ Could not list auth users");
    return;
  }

  for (const userToFix of USERS_TO_FIX) {
    console.log(`👤 Fixing: ${userToFix.email}`);

    // Find auth user
    const authUser = authUsers.users.find((u) => u.email === userToFix.email);

    if (!authUser) {
      console.log(`   ⚠️  Not found in Supabase Auth, skipping\n`);
      continue;
    }

    console.log(`   ✓ Found in Auth: ${authUser.id}`);

    // Update the profile to link to auth user
    const { error } = await admin
      .from("users")
      .update({ user_id: authUser.id })
      .eq("email", userToFix.email);

    if (error) {
      console.log(`   ❌ Error updating profile:`, error.message);
    } else {
      console.log(`   ✅ Profile linked to auth user\n`);
    }
  }

  // Verify all users
  console.log("🔍 Verifying all users...\n");

  const { data: profiles } = await admin
    .from("users")
    .select("user_id, email, full_name, role")
    .order("role");

  if (!profiles) {
    console.log("❌ Could not fetch profiles");
    return;
  }

  console.log("📊 All Profiles:");
  console.table(profiles);

  // Check which ones have matching auth users
  console.log("\n🔑 Auth Status:");
  for (const profile of profiles) {
    const authUser = authUsers.users.find((u) => u.id === profile.user_id);
    const status = authUser ? "✅ Linked" : "❌ Not linked";
    console.log(`   ${profile.email} (${profile.role}): ${status}`);
  }

  console.log("\n✅ Fix complete! Try logging in now.");
}

fixProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  });
