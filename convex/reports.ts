import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getReports = query({
  args: {
    influencerId: v.optional(v.id("influencers")),
    channelId: v.optional(v.id("channels")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    let reports = ctx.db.query("reports");

    if (args.influencerId) {
      reports = reports.filter((q) => q.eq(q.field("influencerId"), args.influencerId));
    }
    if (args.channelId) {
      reports = reports.filter((q) => q.eq(q.field("channelId"), args.channelId));
    }

    return await reports.collect();
  },
});

export const createReport = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    influencerId: v.optional(v.id("influencers")),
    channelId: v.optional(v.id("channels")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;

    // Optional: Validate influencerId/channelId ownership if provided
    if (args.influencerId) {
      const influencer = await ctx.db.get(args.influencerId);
      if (!influencer || influencer.userId !== userId) {
        throw new Error("Influencer not found or unauthorized.");
      }
    }

    if (args.channelId) {
      const channel = await ctx.db.get(args.channelId);
      if (!channel) {
        throw new Error("Channel not found.");
      }
      const influencer = await ctx.db.get(channel.influencerId);
      if (!influencer || influencer.userId !== userId) {
        throw new Error("Channel not found or unauthorized.");
      }
    }

    const reportId = await ctx.db.insert("reports", {
      title: args.title,
      content: args.content,
      influencerId: args.influencerId,
      channelId: args.channelId,
      generatedByUserId: userId,
      generatedAt: Date.now(),
    });

    return reportId;
  },
});

export const updateReport = mutation({
  args: {
    id: v.id("reports"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    influencerId: v.optional(v.id("influencers")),
    channelId: v.optional(v.id("channels")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;
    const { id, ...updates } = args;

    const existingReport = await ctx.db.get(id);
    if (!existingReport || existingReport.generatedByUserId !== userId) {
      throw new Error("Unauthorized to update this report.");
    }

    // Optional: Validate influencerId/channelId ownership if provided
    if (updates.influencerId) {
      const influencer = await ctx.db.get(updates.influencerId);
      if (!influencer || influencer.userId !== userId) {
        throw new Error("Influencer not found or unauthorized.");
      }
    }

    if (updates.channelId) {
      const channel = await ctx.db.get(updates.channelId);
      if (!channel) {
        throw new Error("Channel not found.");
      }
      const influencer = await ctx.db.get(channel.influencerId);
      if (!influencer || influencer.userId !== userId) {
        throw new Error("Channel not found or unauthorized.");
      }
    }

    await ctx.db.patch(id, updates);
  },
});

export const deleteReport = mutation({
  args: {
    id: v.id("reports"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const userId = identity.subject;

    const existingReport = await ctx.db.get(args.id);
    if (!existingReport || existingReport.generatedByUserId !== userId) {
      throw new Error("Unauthorized to delete this report.");
    }

    await ctx.db.delete(args.id);
  },
});
