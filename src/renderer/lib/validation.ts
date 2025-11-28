import { z } from "zod"

export const userSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(255),
  phone: z.string().regex(/^\+\d{1,3}\d{4,14}$/, "Invalid phone format (e.g., +966501234567)"),
  email: z.string().email().optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  preferredLanguage: z.enum(["en", "ar"]),
  notes: z.string().optional(),
})

export const eventSchema = z.object({
  userId: z.number().positive(),
  eventType: z.enum(["meeting", "embassy", "flight", "birthday", "custom"]),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  eventDate: z.string().datetime(),
  location: z.string().optional(),
  reminderEnabled: z.boolean().default(true),
})

export const reminderSchema = z.object({
  eventId: z.number().positive(),
  reminderTime: z.string().datetime(),
  messageTemplateId: z.number().optional(),
  customMessage: z.string().optional(),
  fileId: z.number().optional(),
})

export const templateSchema = z.object({
  name: z.string().min(1).max(255),
  eventType: z.enum(["meeting", "embassy", "flight", "birthday", "custom"]),
  language: z.enum(["en", "ar"]),
  templateText: z.string().min(1),
  variables: z.array(z.string()).optional(),
  isDefault: z.boolean().optional(),
})

export const campaignSchema = z.object({
  name: z.string().min(1).max(255),
  messageText: z.string().min(1),
  recipients: z.array(z.number().positive()).min(1),
  minDelaySec: z.number().positive().default(5),
  maxDelaySec: z.number().positive().default(15),
})

export type User = z.infer<typeof userSchema>
export type Event = z.infer<typeof eventSchema>
export type Reminder = z.infer<typeof reminderSchema>
export type Template = z.infer<typeof templateSchema>
export type Campaign = z.infer<typeof campaignSchema>
