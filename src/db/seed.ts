import { db } from "@/config/database";
import { users, categories } from "./schema";
import { hashPassword } from "@/utils/password";
import { ROLES } from "@/config/constants";

async function seed() {
  console.log("🌱 Seed başlıyor...");

  // Admin kullanıcı
  const passwordHash = await hashPassword("Admin123!");
  await db
    .insert(users)
    .values({
      email: "admin@example.com",
      passwordHash,
      name: "Admin",
      role: ROLES.ADMIN,
      isEmailVerified: true,
    })
    .onConflictDoNothing();

  // Kategoriler
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
