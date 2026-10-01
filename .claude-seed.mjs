import pg from "pg";
import fs from "fs";
for (const l of fs.readFileSync(".env", "utf8").split("\n")) { const m = l.match(/^DATABASE_URL=["']?(.*?)["']?$/); if (m) process.env.DATABASE_URL = m[1]; }
const url = new URL(process.env.DATABASE_URL);
url.searchParams.delete("sslrootcert");
const c = new pg.Client({ connectionString: url.toString() });
await c.connect();
const users = [["claude-test-user", "claude-local-test-session", null], ["claude-admin-user", "claude-admin-session", "ident!claudeAdminTest"]];
if (process.argv[2] === "up") {
  for (const [id, tok, ident] of users) {
    await c.query(`insert into "User"(id, name, email, "onboardedAt", "tourSeenAt", pumpkins, "hcIdentityId") values ($1,$2,$3, now(), now(), 30, $4) on conflict (id) do nothing`, [id, id === "claude-test-user" ? "Test Ghost" : "Test Admin", `${id}@example.invalid`, ident]);
    await c.query(`insert into "Session"(id, "sessionToken", "userId", expires) values ($1,$1,$2, now() + interval '1 day') on conflict do nothing`, [tok, id]);
  }
  console.log("seeded");
} else if (process.argv[2] === "show") {
  console.log((await c.query(`select name, link, why, status, "adminNote", "handledBy" from "Suggestion" where "userId"='claude-test-user' order by "createdAt"`)).rows);
  console.log((await c.query(`select action, detail from "AdminAudit" where "actorUserId"='claude-admin-user'`)).rows);
} else {
  const ids = users.map((u) => u[0]);
  const a = await c.query(`delete from "AdminAudit" where "actorUserId" = any($1)`, [ids]);
  const s = await c.query(`delete from "Suggestion" where "userId" = any($1)`, [ids]);
  await c.query(`delete from "Order" where "userId" = any($1)`, [ids]);
  await c.query(`delete from "Session" where "userId" = any($1)`, [ids]);
  const u = await c.query(`delete from "User" where id = any($1)`, [ids]);
  console.log("removed audits", a.rowCount, "suggestions", s.rowCount, "users", u.rowCount);
}
await c.end();
