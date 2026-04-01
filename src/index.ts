import type { Core } from '@strapi/strapi';

/**
 * Region-based Access Control for Admin Users
 * 
 * This middleware filters content based on the admin user's role.
 * If a user has roles like "Admin Jabar" and "Admin Banten", they will see
 * content associated with BOTH "JABAR" and "BANTEN" regions.
 */

// Helper: Extract ALL regions from role names
function getRegionsFromRoles(roles: any[]): string[] {
    if (!roles || !Array.isArray(roles)) return [];

    const regions: string[] = [];
    for (const role of roles) {
        const roleName = role.name || role.code || '';
        const match = roleName.match(/^Admin\s+(.+)$/i);
        if (match) {
            regions.push(match[1].toUpperCase());
        }
    }
    return regions;
}

// Check if user is Super Admin
function isSuperAdmin(roles: any[]): boolean {
    if (!roles || !Array.isArray(roles)) return false;
    return roles.some(role =>
        role.code === 'strapi-super-admin' ||
        role.name === 'Super Admin' ||
        role.id === 1
    );
}

export default {
    register({ strapi }: { strapi: Core.Strapi }) {
        // Add Koa middleware to intercept Content Manager API
        strapi.server.use(async (ctx: any, next: any) => {
            await next();

            const url = ctx.request.url;

            // Only process content-manager routes
            if (!url.includes('/content-manager/')) {
                return;
            }

            // Get current user from state
            const user = ctx.state?.user;
            if (!user || !user.roles) {
                return;
            }

            // Skip for super admins
            if (isSuperAdmin(user.roles)) {
                return;
            }

            const userRegions = getRegionsFromRoles(user.roles);
            if (userRegions.length === 0) {
                return;
            }

            // 1. Filter Content Manager relations endpoint for regionals dropdown
            const isRegionalsEndpoint = url.includes('/content-manager/relations/') &&
                (url.includes('/regionals') || url.includes('/regional'));

            if (isRegionalsEndpoint) {
                if (ctx.body && ctx.body.results && Array.isArray(ctx.body.results)) {
                    ctx.body.results = ctx.body.results.filter((item: any) => {
                        const regionName = (item.region || item.name || '').toUpperCase();
                        return userRegions.includes(regionName);
                    });
                }
                strapi.log.debug(`[RegionFilter] Filtered relation picker to ${userRegions.join(', ')}`);
                return;
            }

            // 2. Filter Content Manager collection-types listing for articles, products, etc.
            const collectionTypesMatch = url.match(/\/content-manager\/collection-types\/(api::[^/?]+)/);
            if (collectionTypesMatch) {
                const contentTypeRaw = collectionTypesMatch[1];
                const targetTypes = ['api::article.article', 'api::product.product', 'api::press-release.press-release', 'api::regional-banner.regional-banner'];

                if (targetTypes.includes(contentTypeRaw)) {
                    if (ctx.body && ctx.body.results && Array.isArray(ctx.body.results)) {
                        const originalCount = ctx.body.results.length;

                        try {
                            // Determine table names based on content type
                            let linkTable = '';
                            let idColumn = '';

                            if (contentTypeRaw === 'api::article.article') {
                                linkTable = 'articles_regionals_lnk';
                                idColumn = 'article_id';
                            } else if (contentTypeRaw === 'api::product.product') {
                                linkTable = 'products_regionals_lnk';
                                idColumn = 'product_id';
                            } else if (contentTypeRaw === 'api::press-release.press-release') {
                                linkTable = 'press_releases_regionals_lnk';
                                idColumn = 'press_release_id';
                            } else if (contentTypeRaw === 'api::regional-banner.regional-banner') {
                                linkTable = 'regional_banners_regional_lnk';
                                idColumn = 'regional_banner_id';
                            }

                            if (linkTable) {
                                // Use Strapi's entity service to get regional IDs
                                const regionalsData = await strapi.documents('api::regional.regional').findMany({
                                    filters: { region: { $in: userRegions } },
                                });
                                const regionalIds = regionalsData.map((r: any) => r.id);

                                strapi.log.info(`[RegionFilter] Found ${regionalIds.length} regional IDs for [${userRegions.join(', ')}]`);

                                if (regionalIds.length > 0) {
                                    // Get allowed content IDs using better-sqlite3 direct query
                                    const Database = require('better-sqlite3');
                                    const db = new Database('.tmp/data.db', { readonly: true });
                                    const placeholders = regionalIds.map(() => '?').join(',');
                                    const stmt = db.prepare(`SELECT DISTINCT ${idColumn} as id FROM ${linkTable} WHERE regional_id IN (${placeholders})`);
                                    const allowedIdsResult = stmt.all(...regionalIds);
                                    db.close();

                                    const allowedIds = new Set(allowedIdsResult.map((r: any) => r.id));

                                    strapi.log.info(`[RegionFilter] Allowed IDs: [${Array.from(allowedIds).join(', ')}]`);

                                    // Filter results by ID
                                    ctx.body.results = ctx.body.results.filter((item: any) => {
                                        return allowedIds.has(item.id);
                                    });

                                    // Update pagination info
                                    if (ctx.body.pagination) {
                                        ctx.body.pagination.total = ctx.body.results.length;
                                        ctx.body.pagination.pageCount = Math.ceil(ctx.body.results.length / ctx.body.pagination.pageSize);
                                    }

                                    strapi.log.info(`[RegionFilter] Filtered ${contentTypeRaw}: ${originalCount} -> ${ctx.body.results.length}`);
                                } else {
                                    // No regional IDs found - show nothing
                                    ctx.body.results = [];
                                    if (ctx.body.pagination) {
                                        ctx.body.pagination.total = 0;
                                        ctx.body.pagination.pageCount = 0;
                                    }
                                    strapi.log.warn(`[RegionFilter] No regional IDs found - showing 0 results`);
                                }
                            }
                        } catch (dbError) {
                            strapi.log.error(`[RegionFilter] Database query error: ${dbError}`);
                        }
                    }
                }
            }
        });
    },

    bootstrap({ strapi }: { strapi: Core.Strapi }) {
        // Content types that have regional filtering
        const REGIONAL_CONTENT_TYPES = [
            'api::article.article',
            'api::product.product',
            'api::regional-banner.regional-banner',
            'api::press-release.press-release',
            'api::regional.regional',
        ];

        // Subscribe to document service middleware for filtering
        strapi.documents.use(async (context: any, next: any) => {
            const { action, contentType, params } = context;

            const contentTypeStr = String(contentType);
            if (!REGIONAL_CONTENT_TYPES.includes(contentTypeStr)) {
                return next();
            }

            // In Strapi 5, sometimes we need to get the user from the global context
            const user = (strapi as any).requestContext?.get()?.state?.user;

            // Log for debugging
            if (contentTypeStr === 'api::article.article' && (action === 'create' || action === 'update')) {
                strapi.log.info(`[RegionFilter] Document call: ${action} ${contentTypeStr} by user: ${user?.email || 'unknown'}`);
            }

            // If no user is found, it's an internal call or something we don't want to filter
            if (!user) {
                return next();
            }

            // Improved role check - check everything we can
            const roles = user.roles || [];
            const userIsSuperAdmin = roles.some((role: any) =>
                role.code === 'strapi-super-admin' ||
                role.name === 'Super Admin' ||
                String(role.id) === '1' ||
                String(role.documentId) === 'kzvtd8plg794kc8xbeju51sz' // From our DB check
            );

            if (userIsSuperAdmin) {
                if (action === 'create' || action === 'update') {
                    strapi.log.info(`[RegionFilter] Super Admin ${user.email} is performing ${action} - allowing all actions`);
                }
                return next();
            }

            const userRegions = getRegionsFromRoles(roles);
            if (userRegions.length === 0) {
                // If it's not a super admin but has no regional roles, just continue
                return next();
            }

            // Auto-assign region on CREATE and UPDATE for regional admins
            if ((action === 'create' || action === 'update')) {
                try {
                    if (!params.data) {
                        params.data = {};
                    }

                    // For Articles and Press Releases, force is_national = false for REGIONAL admins
                    if (contentTypeStr === 'api::article.article' || contentTypeStr === 'api::press-release.press-release') {
                        // Only force if it's NOT national already or if we want to ensure it's false for regional
                        params.data.is_national = false;
                        strapi.log.info(`[RegionFilter] Forced is_national=false for Regional Admin ${user.email} on ${contentTypeStr}`);
                    }

                    // Auto-assign ALL user's regions on CREATE
                    if (contentTypeStr !== 'api::regional.regional') {
                        const allRegionals = await strapi.documents('api::regional.regional').findMany({
                            filters: { region: { $in: userRegions } },
                        });

                        if (allRegionals && allRegionals.length > 0) {
                            if (contentTypeStr === 'api::regional-banner.regional-banner') {
                                if (action === 'create' || !(params.data as any).regional) {
                                    (params.data as any).regional = allRegionals[0].documentId;
                                    strapi.log.debug(`[RegionFilter] Auto-assigned region to ${contentTypeStr}`);
                                }
                            } else {
                                const currentData = params.data as any;

                                if (action === 'create') {
                                    currentData.regionals = allRegionals.map((r: any) => r.documentId);
                                    strapi.log.debug(`[RegionFilter] Auto-assigned regions to new ${contentTypeStr}`);
                                } else if (action === 'update') {
                                    if (!currentData.regionals || (Array.isArray(currentData.regionals) && currentData.regionals.length === 0)) {
                                        currentData.regionals = allRegionals.map((r: any) => r.documentId);
                                        strapi.log.debug(`[RegionFilter] Auto-filled empty regionals`);
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    strapi.log.error(`[RegionFilter] Error in CREATE/UPDATE handler: ${error}`);
                }
            }

            return next();
        });

        strapi.log.info('✅ Region-based access control middleware registered');
    },
};
