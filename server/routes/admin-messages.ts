import { Router } from "express";
import { storage } from "../storage";
import { requireAdminAuth } from "./shared";
import { insertMessagesSchema } from "../../shared/schema";

const router = Router();

router.post("/", requireAdminAuth, async (req, res) => {
  try {
    const validatedData = insertMessagesSchema.parse(req.body);
    const newMessage = await storage.createMessage(validatedData);
    res.status(201).json(newMessage);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Invalid message data", 
        errors: error.errors 
      });
    }
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Failed to create message" });
  }
});

router.get("/", requireAdminAuth, async (req, res) => {
  try {
    const { upcoming } = req.query;
    const messages = upcoming === 'true' 
      ? await storage.getUpcomingMessages()
      : await storage.getAllMessages();
    res.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
});

router.get("/:date", async (req, res) => {
  try {
    const { date } = req.params;
    const message = await storage.getMessageByDate(date);
    
    if (!message) {
      return res.status(404).json({ message: "No message found for this date" });
    }
    
    res.json(message);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch message" });
  }
});

router.put("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateSchema = insertMessagesSchema.omit({ 
      id: true, 
      createdAt: true, 
      updatedAt: true 
    });
    const validatedData = updateSchema.parse(req.body);
    const updatedMessage = await storage.updateMessage(parseInt(id), validatedData);
    res.json(updatedMessage);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: "Invalid message data", 
        errors: error.errors 
      });
    }
    console.error("Error updating message:", error);
    res.status(500).json({ message: "Failed to update message" });
  }
});

router.delete("/:id", requireAdminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await storage.deleteMessage(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Failed to delete message" });
  }
});

export default router;
