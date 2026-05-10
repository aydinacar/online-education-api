import { db } from "@/config/database";
import { users, categories } from "./schema";
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
