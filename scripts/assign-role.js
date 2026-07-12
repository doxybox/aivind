import postgres from "postgres";

const allowedRoles = new Set(["reader", "subscriber", "journalist", "editor", "admin"]);
const [, , email, role = "admin"] = process.argv;

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to assign roles in production.");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

if (!email || !allowedRoles.has(role)) {
  console.error("Usage: npm run auth:assign-role -- user@example.com admin");
  console.error(`Allowed roles: ${Array.from(allowedRoles).join(", ")}`);
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

try {
  const users = await sql`select id, email from "user" where lower(email) = lower(${email}) limit 1`;

  if (users.length === 0) {
    console.error(`No Better Auth user found for ${email}.`);
    process.exit(1);
  }

  const userId = users[0].id;

  await sql`
    insert into user_role (user_id, role)
    values (${userId}, ${role})
    on conflict (user_id, role) do nothing
  `;

  console.log(`Assigned role "${role}" to ${users[0].email}.`);
} finally {
  await sql.end();
}
