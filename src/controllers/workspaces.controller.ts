import type { Request, Response } from "express";
import { workspacesService } from "@/services/workspaces.service";
import { sendSuccess, sendCreated, sendNoContent } from "@/utils/api-response";
import { ApiError } from "@/utils/api-error";

export const workspacesController = {
  create: async (req: Request, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const workspace = await workspacesService.create(req.user.id, req.body);
    sendCreated(res, workspace, "Workspace oluşturuldu");
  },

  getById: async (req: Request<{ id: string }>, res: Response) => {
    const data = await workspacesService.getById(req.params.id);
    sendSuccess(res, { data });
  },

  update: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await workspacesService.update(
      req.params.id,
      req.body,
      req.user.id,
    );
    sendSuccess(res, { data, message: "Workspace güncellendi" });
  },

  getMembers: async (req: Request<{ id: string }>, res: Response) => {
    const data = await workspacesService.getMembers(req.params.id);
    sendSuccess(res, { data });
  },

  addMember: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await workspacesService.addMember(
      req.params.id,
      req.body.email,
      req.user.id,
    );
    sendCreated(res, data, "Üye eklendi");
  },

  removeMember: async (
    req: Request<{ id: string; userId: string }>,
    res: Response,
  ) => {
    if (!req.user) throw ApiError.unauthorized();
    await workspacesService.removeMember(
      req.params.id,
      req.params.userId,
      req.user.id,
    );
    sendNoContent(res);
  },

  transferOwnership: async (req: Request<{ id: string }>, res: Response) => {
    if (!req.user) throw ApiError.unauthorized();
    const data = await workspacesService.transferOwnership(
      req.params.id,
      req.body.userId,
      req.user.id,
    );
    sendSuccess(res, { data, message: "Sahiplik devredildi" });
  },
};
