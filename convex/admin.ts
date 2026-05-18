import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import type { QueryCtx } from './_generated/server';
import type { DataModel } from './_generated/dataModel';
import { requireAuth } from './auth';

// Default system configuration values shipped with the platform.
export const SYSTEM_CONFIG_DEFAULTS = {
  'tax.default_rpm_ghs': {
    value: 4,
    label: 'Default RPM (GHS)',
    description: 'Revenue per 1,000 views in GHS used when no category-specific rate applies.',
    category: 'Tax & Revenue',
  },
  'tax.rpm_finance_ghs': {
    value: 18,
    label: 'Finance RPM (GHS)',
    description: 'RPM for Finance / Investing / Investment content categories.',
    category: 'Tax & Revenue',
  },
  'tax.rpm_tech_ghs': {
    value: 12,
    label: 'Technology RPM (GHS)',
    description: 'RPM for Technology / Software / Programming content categories.',
    category: 'Tax & Revenue',
  },
  'tax.rpm_education_ghs': {
    value: 8,
    label: 'Education RPM (GHS)',
    description: 'RPM for Education / Tutorial / How-to content categories.',
    category: 'Tax & Revenue',
  },
  'tax.rpm_gaming_ghs': {
    value: 4,
    label: 'Gaming RPM (GHS)',
    description: 'RPM for Gaming content categories.',
    category: 'Tax & Revenue',
  },
  'tax.rpm_entertainment_ghs': {
    value: 3,
    label: 'Entertainment RPM (GHS)',
    description: 'RPM for Entertainment / Vlog / Lifestyle / Comedy content categories.',
    category: 'Tax & Revenue',
  },
  'currency.usd_to_ghs_rate': {
    value: 15.0,
    label: 'USD → GHS Exchange Rate',
    description: 'Conversion rate applied to USD analytics revenue before tax calculation.',
    category: 'Currency',
  },
  'system.analytics_stale_days': {
    value: 35,
    label: 'Analytics Stale Threshold (days)',
    description: 'Number of days after which a connected analytics sync is considered stale.',
    category: 'System',
  },
  'system.youtube_data_retention_days': {
    value: 30,
    label: 'YouTube Data Retention (days)',
    description: 'Per YouTube API policy, stored metadata must be refreshed or deleted within this window.',
    category: 'System',
  },
  'tax.progressive_brackets_ghs': {
    value: [
      { limit: 5880, rate: 0 },
      { limit: 1320, rate: 0.05 },
      { limit: 1560, rate: 0.10 },
      { limit: 38000, rate: 0.175 },
      { limit: 192000, rate: 0.25 },
      { limit: 366240, rate: 0.30 },
      { limit: Infinity, rate: 0.35 },
    ],
    label: 'Ghana Progressive Tax Brackets',
    description: 'Annual progressive tax brackets for Ghana Revenue Authority (JSON array).',
    category: 'Tax & Revenue',
  },
} as const;

/**
 * Internal helper to fetch system configuration values by their keys.
 * Returns a map of key -> value.
 */
export async function getConfigValues<T extends string>(
  ctx: QueryCtx,
  keys: T[],
): Promise<Record<T, any>> {
  const stored = await ctx.db
    .query('systemConfig')
    .collect(); // collecting all is fine for small config sets, or use filter
  
  const result = {} as Record<T, any>;
  const storedMap = new Map(stored.map((s: any) => [s.key, s.value]));

  for (const key of keys) {
    result[key] = storedMap.get(key) ?? SYSTEM_CONFIG_DEFAULTS[key as keyof typeof SYSTEM_CONFIG_DEFAULTS]?.value;
  }

  return result;
}

// ─── System Config Queries ────────────────────────────────────────────────────

export const getAllConfig = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const stored = await ctx.db.query('systemConfig').collect();
    const storedByKey = new Map(stored.map((item) => [item.key, item]));

    // Merge defaults with any stored overrides
    return Object.entries(SYSTEM_CONFIG_DEFAULTS).map(([key, defaults]) => {
      const stored = storedByKey.get(key);
      return {
        key,
        value: stored?.value ?? defaults.value,
        label: defaults.label,
        description: defaults.description,
        category: defaults.category,
        updatedBy: stored?.updatedBy,
        updatedAt: stored?.updatedAt,
        isCustom: stored !== undefined,
      };
    });
  },
});

export const getConfigByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const stored = await ctx.db
      .query('systemConfig')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();

    const defaults = SYSTEM_CONFIG_DEFAULTS[args.key as keyof typeof SYSTEM_CONFIG_DEFAULTS];
    if (!stored && !defaults) return null;

    return {
      key: args.key,
      value: stored?.value ?? defaults?.value,
      label: defaults?.label,
      description: defaults?.description,
      category: defaults?.category,
      updatedBy: stored?.updatedBy,
      updatedAt: stored?.updatedAt,
      isCustom: stored !== undefined,
    };
  },
});

// ─── System Config Mutations ──────────────────────────────────────────────────

export const updateConfig = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const actorId = user.userId ?? String(user._id);
    const now = Date.now();

    const existing = await ctx.db
      .query('systemConfig')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();

    const defaults = SYSTEM_CONFIG_DEFAULTS[args.key as keyof typeof SYSTEM_CONFIG_DEFAULTS];

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedBy: actorId,
        updatedAt: now,
      });
    } else {
      await ctx.db.insert('systemConfig', {
        key: args.key,
        value: args.value,
        label: defaults?.label,
        description: defaults?.description,
        category: defaults?.category,
        updatedBy: actorId,
        updatedAt: now,
      });
    }

    // Write to audit log
    await ctx.db.insert('auditLogs', {
      userId: actorId,
      userName: user.name ?? user.email ?? 'Admin',
      action: 'system_config_updated',
      entityType: 'systemConfig',
      entityId: args.key,
      details: `Updated ${defaults?.label ?? args.key} to ${JSON.stringify(args.value)}`,
      timestamp: now,
    });
  },
});

export const resetConfig = mutation({
  args: {
    key: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const actorId = user.userId ?? String(user._id);
    const now = Date.now();

    const existing = await ctx.db
      .query('systemConfig')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    const defaults = SYSTEM_CONFIG_DEFAULTS[args.key as keyof typeof SYSTEM_CONFIG_DEFAULTS];

    await ctx.db.insert('auditLogs', {
      userId: actorId,
      userName: user.name ?? user.email ?? 'Admin',
      action: 'system_config_reset',
      entityType: 'systemConfig',
      entityId: args.key,
      details: `Reset ${defaults?.label ?? args.key} to default (${JSON.stringify(defaults?.value)})`,
      timestamp: now,
    });
  },
});

// ─── Admin Audit Log Queries ──────────────────────────────────────────────────

export const getAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
    entityType: v.optional(v.string()),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const limit = args.limit ?? 50;

    if (args.entityType) {
      const logs = await ctx.db
        .query('auditLogs')
        .withIndex('by_entityType', (q) => q.eq('entityType', args.entityType!))
        .order('desc')
        .take(limit);
      return args.userId ? logs.filter((l) => l.userId === args.userId) : logs;
    }

    if (args.userId) {
      return await ctx.db
        .query('auditLogs')
        .withIndex('by_userId', (q) => q.eq('userId', args.userId!))
        .order('desc')
        .take(limit);
    }

    return await ctx.db
      .query('auditLogs')
      .withIndex('by_timestamp')
      .order('desc')
      .take(limit);
  },
});

export const getAuditLogStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_timestamp')
      .order('desc')
      .take(500);

    const now = Date.now();
    const oneDayAgo = now - 1000 * 60 * 60 * 24;
    const oneWeekAgo = now - 1000 * 60 * 60 * 24 * 7;

    const actorCounts = new Map<string, number>();
    const actionCounts = new Map<string, number>();

    for (const log of logs) {
      const actor = log.userName ?? log.userId ?? 'System';
      actorCounts.set(actor, (actorCounts.get(actor) ?? 0) + 1);
      actionCounts.set(log.action, (actionCounts.get(log.action) ?? 0) + 1);
    }

    return {
      total: logs.length,
      last24h: logs.filter((l) => l.timestamp >= oneDayAgo).length,
      lastWeek: logs.filter((l) => l.timestamp >= oneWeekAgo).length,
      topActors: Array.from(actorCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([actor, count]) => ({ actor, count })),
      topActions: Array.from(actionCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([action, count]) => ({ action, count })),
    };
  },
});

// ─── Platform Stats for Admin Overview ───────────────────────────────────────

export const getPlatformStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    const [channels, oauthConnections, analyticsSyncs, taxEstimates, auditLogs, notifications] =
      await Promise.all([
        ctx.db.query('channels').collect(),
        ctx.db.query('oauthConnections').collect(),
        ctx.db.query('analyticsSyncs').collect(),
        ctx.db.query('taxEstimates').collect(),
        ctx.db.query('auditLogs').withIndex('by_timestamp').order('desc').take(100),
        ctx.db.query('notifications').withIndex('by_createdAt').order('desc').take(50),
      ]);

    const now = Date.now();
    const oneDayAgo = now - 1000 * 60 * 60 * 24;

    const activeConnections = oauthConnections.filter((c) => c.status === 'active').length;
    const expiredConnections = oauthConnections.filter(
      (c) => c.status === 'expired' || c.status === 'refresh_failed',
    ).length;
    const failedSyncs = analyticsSyncs.filter((s) => s.syncStatus === 'failed').length;
    const recentActivity = auditLogs.filter((l) => l.timestamp >= oneDayAgo).length;
    const activeNotifications = notifications.filter(
      (n) => !n.expiresAt || n.expiresAt > now,
    ).length;

    return {
      channels: channels.length,
      activeConnections,
      expiredConnections,
      failedSyncs,
      taxEstimates: taxEstimates.length,
      recentActivity,
      activeNotifications,
    };
  },
});
