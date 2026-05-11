import { eq } from "drizzle-orm";
import { db } from "@/config/database";
import { users, categories, workspaces } from "./schema";
import { hashPassword } from "@/utils/password";
import { ROLES } from "@/config/constants";

async function seed() {
  console.log("🌱 Seed başlıyor...");

  const passwordHash = await hashPassword("Test1234");

  const testUsers = [
    {
      email: "admin@test.com",
      passwordHash,
      name: "Admin User",
      role: ROLES.ADMIN,
      isEmailVerified: true,
    },
    {
      email: "instructor@test.com",
      passwordHash,
      name: "Instructor User",
      role: ROLES.INSTRUCTOR,
      isEmailVerified: true,
    },
    {
      email: "user@test.com",
      passwordHash,
      name: "Test User",
      role: ROLES.STUDENT,
      isEmailVerified: true,
    },
  ];

  for (const user of testUsers) {
    await db.insert(users).values(user).onConflictDoNothing({ target: users.email });
  }

  const [instructor] = await db
    .select()
    .from(users)
    .where(eq(users.email, "instructor@test.com"))
    .limit(1);

  if (instructor && !instructor.workspaceId) {
    const [workspace] = await db
      .insert(workspaces)
      .values({
        name: "Instructor Workspace",
        slug: "instructor-workspace",
        ownerId: instructor.id,
      })
      .onConflictDoNothing({ target: workspaces.slug })
      .returning();

    const workspaceId =
      workspace?.id ??
      (
        await db
          .select({ id: workspaces.id })
          .from(workspaces)
          .where(eq(workspaces.slug, "instructor-workspace"))
          .limit(1)
      )[0]?.id;

    if (workspaceId) {
      await db
        .update(users)
        .set({ workspaceId, updatedAt: new Date() })
        .where(eq(users.id, instructor.id));
    }
  }

  const defaultCategories = [
    { name: "Web Geliştirme", slug: "web-gelistirme" },
    { name: "Mobil Geliştirme", slug: "mobil-gelistirme" },
    { name: "Veri Bilimi", slug: "veri-bilimi" },
    { name: "Tasarım", slug: "tasarim" },
    { name: "İş ve Pazarlama", slug: "is-ve-pazarlama" },
  ];

  for (const cat of defaultCategories) {
    await db.insert(categories).values(cat).onConflictDoNothing();
  }

  console.log("✅ Seed tamamlandı");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed hatası:", err);
  process.exit(1);
});
