import { BudgetGuardian } from "../session/budget-guardian"

// Layer that provides BudgetGuardian.Service so the session runner can
// query threshold checks and trigger provider failover.
export const layer = BudgetGuardian.layer

export * as BudgetGuardianPlugin from "./budget-guardian"
