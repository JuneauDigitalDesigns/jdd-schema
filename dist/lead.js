import { z } from "zod";
export const zWebLead = z.object({
    leadId: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().nullable(),
    phone: z.string().nullable(),
    phoneRaw: z.string().nullable(),
    email: z.string().nullable(),
    message: z.string().nullable(),
    fields: z.record(z.string()),
    createdAt: z.string(),
    readAt: z.string().nullable(),
    source: z.literal("web-form"),
    callbackPlaced: z.boolean(),
});
//# sourceMappingURL=lead.js.map