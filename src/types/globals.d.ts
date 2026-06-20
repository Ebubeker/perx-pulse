export type AccountType = "company" | "provider";
export type CompanyRole = "ADMIN" | "HR" | "FINANCE" | "EMPLOYEE";

// Typed Clerk metadata — no `as` casts. accountType = self-signup side (company vs
// provider). invited* are set server-side by an admin's invitation and consumed by
// the employee onboarding flow (a user cannot set their own publicMetadata, so these
// are trustworthy).
declare global {
  interface UserPublicMetadata {
    accountType?: AccountType;
    onboardingComplete?: boolean;
    invitedToCompanyId?: string;
    invitedRole?: CompanyRole;
    invitationId?: string;
  }
  interface CustomJwtSessionClaims {
    metadata?: {
      accountType?: AccountType;
      onboardingComplete?: boolean;
      invitedToCompanyId?: string;
    };
  }
}
