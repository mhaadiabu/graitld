import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireAuth } from './auth';

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Return active notifications for the current user, newest-first.
 * Filters out notifications the user has dismissed.
 * Filters out expired notifications.
 */
export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const userId = user.userId ?? String(user._id);
    const now = Date.now();
    const limit = args.limit ?? 20;

    const all = await ctx.db
      .query('notifications')
      .withIndex('by_createdAt')
      .order('desc')
      .take(100);

    return all
      .filter((n) => {
        if (n.expiresAt && n.expiresAt < now) return false;
        if (n.dismissedBy?.includes(userId)) return false;
        return true;
      })
      .slice(0, limit);
  },
});

/**
 * Return the count of unread notifications for the current user.
 */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const userId = user.userId ?? String(user._id);
    const now = Date.now();

    const all = await ctx.db
      .query('notifications')
      .withIndex('by_createdAt')
      .order('desc')
      .take(100);

    return all.filter((n) => {
      if (n.expiresAt && n.expiresAt < now) return false;
      if (n.dismissedBy?.includes(userId)) return false;
      if (n.readBy?.includes(userId)) return false;
      return true;
    }).length;
  },
});

// ─── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Mark a notification as read for the current user.
 */
export const markRead = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const userId = user.userId ?? String(user._id);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    const readBy = notification.readBy ?? [];
    if (!readBy.includes(userId)) {
      await ctx.db.patch(args.notificationId, {
        readBy: [...readBy, userId],
      });
    }
  },
});

/**
 * Mark all unread notifications as read for the current user.
 */
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const userId = user.userId ?? String(user._id);
    const now = Date.now();

    const all = await ctx.db
      .query('notifications')
      .withIndex('by_createdAt')
      .order('desc')
      .take(100);

    const unread = all.filter((n) => {
      if (n.expiresAt && n.expiresAt < now) return false;
      if (n.dismissedBy?.includes(userId)) return false;
      if (n.readBy?.includes(userId)) return false;
      return true;
    });

    await Promise.all(
      unread.map(async (n) => {
        const readBy = n.readBy ?? [];
        await ctx.db.patch(n._id, { readBy: [...readBy, userId] });
      }),
    );
  },
});

/**
 * Dismiss a notification for the current user (won't show again).
 */
export const dismiss = mutation({
  args: {
    notificationId: v.id('notifications'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const userId = user.userId ?? String(user._id);

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) return;

    const dismissedBy = notification.dismissedBy ?? [];
    const readBy = notification.readBy ?? [];

    await ctx.db.patch(args.notificationId, {
      dismissedBy: dismissedBy.includes(userId) ? dismissedBy : [...dismissedBy, userId],
      readBy: readBy.includes(userId) ? readBy : [...readBy, userId],
    });
  },
});

/**
 * Internal helper — create a system notification. Called from other mutations.
 */
export const createNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    severity: v.union(
      v.literal('info'),
      v.literal('warning'),
      v.literal('error'),
      v.literal('success'),
    ),
    entityType: v.optional(v.string()),
    entityId: v.optional(v.string()),
    actionUrl: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.insert('notifications', {
      ...args,
      readBy: [],
      dismissedBy: [],
      createdAt: Date.now(),
    });
  },
});
