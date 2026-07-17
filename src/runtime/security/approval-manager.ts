import type {
  AuthorizationRequest,
  RiskAssessment,
  SecurityApprovalDecision,
  SecurityApprovalRequest,
} from './security-types';
import { SecurityRuntimeError } from './security-types';

/** Human approval request manager for high-risk actions. */
export class ApprovalManager {
  private readonly approvals = new Map<string, SecurityApprovalRequest>();

  /** Creates a pending approval request. */
  public request(
    request: AuthorizationRequest,
    risk: RiskAssessment,
    ttlMs = 5 * 60 * 1000,
  ): SecurityApprovalRequest {
    const approval: SecurityApprovalRequest = {
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      id: crypto.randomUUID(),
      request,
      risk,
      status: 'pending',
    };
    this.approvals.set(approval.id, approval);
    return approval;
  }

  /** Applies a human decision. */
  public decide(decision: SecurityApprovalDecision): SecurityApprovalRequest {
    const approval = this.approvals.get(decision.approvalId);

    if (approval === undefined) {
      throw new SecurityRuntimeError(
        'SECURITY_APPROVAL_NOT_FOUND',
        `Approval not found: ${decision.approvalId}`,
      );
    }

    if (approval.status !== 'pending') {
      return approval;
    }

    const status = decision.decision === 'approved' ? 'approved' : decision.decision === 'modified' ? 'modified' : 'rejected';
    const next: SecurityApprovalRequest = {
      ...approval,
      ...(decision.comment === undefined ? {} : { comment: decision.comment }),
      decidedAt: Date.now(),
      ...(decision.modifiedMetadata === undefined ? {} : { modifiedMetadata: decision.modifiedMetadata }),
      status,
    };
    this.approvals.set(next.id, next);
    return next;
  }

  /** Reads one approval and expires stale pending requests. */
  public get(approvalId: string): SecurityApprovalRequest | undefined {
    const approval = this.approvals.get(approvalId);

    if (approval === undefined) {
      return undefined;
    }

    if (approval.status === 'pending' && approval.expiresAt <= Date.now()) {
      const expired = { ...approval, decidedAt: Date.now(), status: 'expired' as const };
      this.approvals.set(approvalId, expired);
      return expired;
    }

    return approval;
  }

  /** Lists approvals. */
  public list(): readonly SecurityApprovalRequest[] {
    return [...this.approvals.keys()].map((id) => this.get(id)).filter((item): item is SecurityApprovalRequest => item !== undefined);
  }
}
