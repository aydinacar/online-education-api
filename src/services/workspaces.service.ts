import { eq, and, asc } from "drizzle-orm";
import { db } from "@/config/database";
import { workspaces, users } from "@/db/schema";
import { ApiError } from "@/utils/api-error";
import { slugify } from "@/utils/slugify";
import { ROLES } from "@/config/constants";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/validations/workspace.schema";

async function generateUniqueSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (true) {
    const [existing] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.slug, slug))
      .limit(1);
    if (!existing) return slug;
    slug = `${base}-${i}`;
    i++;
  }
}

export const workspacesService = {
  async list() {
    return db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        slug: workspaces.slug,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
        owner: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(workspaces)
      .leftJoin(users, eq(workspaces.ownerId, users.id))
      .orderBy(asc(workspaces.name));
  },

  async create(callerId: string, input: CreateWorkspaceInput) {
    const [caller] = await db
      .select()
      .from(users)
      .where(eq(users.id, callerId))
      .limit(1);
    if (!caller) throw ApiError.notFound("Kullanıcı bulunamadı");
    if (caller.workspaceId) {
      throw ApiError.conflict("Zaten bir workspace'e bağlısınız");
    }

    const baseSlug = input.slug ? input.slug : slugify(input.name);
    if (!baseSlug) throw ApiError.badRequest("Geçerli bir slug üretilemedi");
    const slug = await generateUniqueSlug(baseSlug);

    return db.transaction(async (tx) => {
      const [workspace] = await tx
        .insert(workspaces)
        .values({ name: input.name, slug, ownerId: callerId })
        .returning();
      if (!workspace) throw ApiError.internal("Workspace oluşturulamadı");

      await tx
        .update(users)
        .set({
          workspaceId: workspace.id,
          role: caller.role === ROLES.ADMIN ? caller.role : ROLES.INSTRUCTOR,
          updatedAt: new Date(),
        })
        .where(eq(users.id, callerId));

      return workspace;
    });
  },

  async getById(id: string) {
    const [w] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id))
      .limit(1);
    if (!w) throw ApiError.notFound("Workspace bulunamadı");
    return w;
  },

  async getMembers(workspaceId: string) {
    return db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
        isOwner: eq(users.id, workspaces.ownerId),
      })
      .from(users)
      .innerJoin(workspaces, eq(workspaces.id, users.workspaceId))
      .where(eq(users.workspaceId, workspaceId))
      .orderBy(asc(users.name));
  },

  async update(id: string, input: UpdateWorkspaceInput, callerId: string) {
    const workspace = await this.getById(id);
    if (workspace.ownerId !== callerId) {
      throw ApiError.forbidden("Bu workspace'i düzenleme yetkiniz yok");
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (input.name !== undefined) update.name = input.name;
    if (input.slug !== undefined) {
      update.slug = await generateUniqueSlug(input.slug);
    } else if (input.name) {
      const base = slugify(input.name);
      if (base && base !== workspace.slug) {
        update.slug = await generateUniqueSlug(base);
      }
    }

    const [w] = await db
      .update(workspaces)
      .set(update)
      .where(eq(workspaces.id, id))
      .returning();
    return w;
  },

  async addMember(workspaceId: string, email: string, callerId: string) {
    const workspace = await this.getById(workspaceId);
    if (workspace.ownerId !== callerId) {
      throw ApiError.forbidden("Bu workspace'e üye ekleme yetkiniz yok");
    }

    const [target] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!target) throw ApiError.notFound("Kullanıcı bulunamadı");

    if (target.workspaceId === workspaceId) {
      throw ApiError.conflict("Kullanıcı zaten bu workspace'in üyesi");
    }
    if (target.workspaceId) {
      throw ApiError.conflict("Kullanıcı başka bir workspace'e bağlı");
    }

    const [updated] = await db
      .update(users)
      .set({
        workspaceId,
        role: target.role === ROLES.ADMIN ? target.role : ROLES.INSTRUCTOR,
        updatedAt: new Date(),
      })
      .where(eq(users.id, target.id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        role: users.role,
      });
    return updated;
  },

  async removeMember(workspaceId: string, userId: string, callerId: string) {
    const workspace = await this.getById(workspaceId);
    if (workspace.ownerId !== callerId) {
      throw ApiError.forbidden("Bu workspace'ten üye çıkarma yetkiniz yok");
    }
    if (userId === workspace.ownerId) {
      throw ApiError.badRequest(
        "Workspace sahibi çıkarılamaz; önce sahipliği devredin",
      );
    }

    const [target] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.workspaceId, workspaceId)))
      .limit(1);
    if (!target) throw ApiError.notFound("Üye bulunamadı");

    await db
      .update(users)
      .set({
        workspaceId: null,
        role: target.role === ROLES.ADMIN ? target.role : ROLES.STUDENT,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));
  },

  async transferOwnership(
    workspaceId: string,
    newOwnerUserId: string,
    callerId: string,
  ) {
    const workspace = await this.getById(workspaceId);
    if (workspace.ownerId !== callerId) {
      throw ApiError.forbidden("Sahipliği devretme yetkiniz yok");
    }
    if (newOwnerUserId === callerId) {
      throw ApiError.badRequest("Zaten sahipsiniz");
    }

    const [newOwner] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, newOwnerUserId), eq(users.workspaceId, workspaceId)))
      .limit(1);
    if (!newOwner) {
      throw ApiError.badRequest("Yeni sahip bu workspace'in üyesi olmalı");
    }

    const [w] = await db
      .update(workspaces)
      .set({ ownerId: newOwnerUserId, updatedAt: new Date() })
      .where(eq(workspaces.id, workspaceId))
      .returning();
    return w;
  },
};
