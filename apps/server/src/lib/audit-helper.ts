import { auditQueue } from './queue';

const ALLOWED_AUDIT_ROLES = ['super_admin', 'admin', 'staff'];
const CRITICAL_ENTITIES = ['tenant', 'user', 'parent', 'teacher', 'student', 'finance', 'payment'];

export async function createAuditLog(params: {
  action: string;
  resource: string;
  details: any;
  userId?: string | null;
  tenantId?: string | null;
  userRole?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const { action, resource, details, userId, tenantId, userRole, ipAddress, userAgent } = params;

  // 1. Global Role Authorization Lock
  if (userRole && !ALLOWED_AUDIT_ROLES.includes(userRole)) {
    return;
  }

  // 2. Specific Filter: Only log critical entity types
  const normalizedResource = resource.toLowerCase();
  const isCriticalEntity = CRITICAL_ENTITIES.some(r => normalizedResource.includes(r));
  if (!isCriticalEntity) {
    return;
  }

  // 3. Specific Filter: Log all actions for critical entities without dropping updates
  // This ensures school admins adding/editing students show up correctly.

  // 4. Structure exact payload requested by user and push to background queue
  const dataObj = typeof details === 'string' ? { message: details } : (details || {});
  
  const actLower = action.toLowerCase();
  const isDelete = actLower.includes('delete') || actLower.includes('remove');
  const isCreate = actLower.includes('create') || actLower.includes('add');

  let finalOld = dataObj.oldData || null;
  let finalNew = dataObj.newData || dataObj;

  // Auto-route logic if not explicitly separated by caller
  if (!dataObj.oldData && !dataObj.newData) {
    if (isDelete) {
      finalOld = dataObj; // Action is deletion -> details contain what was lost
      finalNew = null;
    } else if (isCreate) {
      finalOld = null;
      finalNew = dataObj;
    }
  } else {
    // Use explicitly provided split if available
    finalOld = dataObj.oldData || null;
    finalNew = dataObj.newData || null;
  }

  try {
    await auditQueue.add('save-audit', {
      tenantId: tenantId || null,
      userId: userId || null,
      action: action,
      entityType: resource,
      entityId: dataObj.id || dataObj.userId || dataObj.tenantId || dataObj.entityId || null,
      oldData: finalOld,
      newData: finalNew,
      ip: ipAddress || null,
      userAgent: userAgent || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error('[AUDIT-HELPER] Failed to queue audit log:', err);
  }
}
