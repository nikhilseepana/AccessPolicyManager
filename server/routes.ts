import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { schemaUploadSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Schema routes
  app.get("/api/schemas", isAuthenticated, async (req, res) => {
    try {
      const schemas = await storage.getAllSchemas();
      res.json(schemas);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schemas" });
    }
  });

  app.post("/api/schemas", isAdmin, async (req, res) => {
    try {
      const validatedData = schemaUploadSchema.parse(req.body);
      const schema = await storage.createSchema(validatedData);
      res.status(201).json(schema);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schema data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create schema" });
    }
  });

  app.get("/api/schemas/:id", isAuthenticated, async (req, res) => {
    try {
      const schema = await storage.getSchemaWithTablesAndFields(parseInt(req.params.id));
      if (!schema) {
        return res.status(404).json({ message: "Schema not found" });
      }
      res.json(schema);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch schema" });
    }
  });

  // Access Request routes
  app.post("/api/access-requests", isAuthenticated, async (req, res) => {
    try {
      const request = await storage.createAccessRequest({
        userId: req.user!.id,
        ...req.body,
      });
      
      // Create notification for admins
      const admins = await storage.getAdminUsers();
      for (const admin of admins) {
        await storage.createNotification({
          userId: admin.id,
          type: "new_request",
          message: `New access request from ${req.user!.email}`,
        });
      }
      
      res.status(201).json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to create access request" });
    }
  });

  app.get("/api/access-requests", isAuthenticated, async (req, res) => {
    try {
      let requests;
      if (req.user!.role === "admin") {
        requests = await storage.getAllAccessRequests();
      } else {
        requests = await storage.getUserAccessRequests(req.user!.id);
      }
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access requests" });
    }
  });

  app.get("/api/access-requests/:id", isAuthenticated, async (req, res) => {
    try {
      const request = await storage.getAccessRequestWithItems(parseInt(req.params.id));
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Check if user is admin or the request belongs to them
      if (req.user!.role !== "admin" && request.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access request" });
    }
  });

  app.patch("/api/access-requests/:id", isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const request = await storage.updateAccessRequestStatus(
        parseInt(req.params.id),
        status
      );
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      // Create policies if approved
      if (status === "approved") {
        const requestItems = await storage.getAccessRequestItems(request.id);
        for (const item of requestItems) {
          // Check for conflicts before creating policy
          const hasConflict = await storage.checkPolicyConflict(
            request.userId,
            request.schemaId,
            item.tableId,
            item.effect,
            item.fields as string[]
          );
          
          if (!hasConflict) {
            await storage.createAccessPolicy({
              userId: request.userId,
              schemaId: request.schemaId,
              tableId: item.tableId,
              effect: item.effect,
              fields: item.fields as string[],
            });
          } else {
            // Handle conflict - in this case we'll reject the specific conflicting policy
            // but still approve the request overall
            console.log(`Conflict detected for user ${request.userId}, table ${item.tableId}`);
          }
        }
      }
      
      // Create notification for the user
      await storage.createNotification({
        userId: request.userId,
        type: status === "approved" ? "request_approved" : "request_rejected",
        message: `Your access request has been ${status}`,
      });
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Failed to update access request" });
    }
  });

  // Access Policy routes
  app.get("/api/access-policies", isAuthenticated, async (req, res) => {
    try {
      let policies;
      if (req.user!.role === "admin") {
        if (req.query.userId) {
          policies = await storage.getUserAccessPolicies(parseInt(req.query.userId as string));
        } else {
          policies = await storage.getAllAccessPolicies();
        }
      } else {
        policies = await storage.getUserAccessPolicies(req.user!.id);
      }
      res.json(policies);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access policies" });
    }
  });

  app.post("/api/access-policies/copy", isAdmin, async (req, res) => {
    try {
      const { sourceUserId, targetUserId, replaceExisting } = req.body;
      if (!sourceUserId || !targetUserId) {
        return res.status(400).json({ message: "Source and target user IDs are required" });
      }
      
      const result = await storage.copyUserAccessPolicies(
        parseInt(sourceUserId), 
        parseInt(targetUserId),
        !!replaceExisting
      );
      
      res.json({ success: true, message: "Access policies copied successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to copy access policies" });
    }
  });

  // User routes
  app.get("/api/users", isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Notification routes
  app.get("/api/notifications", isAuthenticated, async (req, res) => {
    try {
      const notifications = await storage.getUserNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const notification = await storage.getNotification(parseInt(req.params.id));
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      await storage.markNotificationAsRead(notification.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
