import type { Component } from "solid-js"
import { Icon } from "@opencode-ai/ui/icon"
import type { BudgetNotice as BudgetNoticeType } from "@/context/global-sync/types"

export const BudgetNotice: Component<{
  notice: BudgetNoticeType
  onDismiss?: () => void
}> = (props) => {
  return (
    <div
      data-component="budget-notice"
      class="flex items-start gap-3 rounded-[8px] border border-warning-base/30 bg-warning-base/5 px-4 py-3"
    >
      <Icon name="warning" class="mt-0.5 size-4 shrink-0 text-warning-base" />
      <div class="min-w-0 flex-1">
        <div class="text-14-medium text-text-strong">Model switched</div>
        <div class="mt-1 text-12-regular text-text-weak">
          {props.notice.text}
        </div>
        <div class="mt-1 text-12-regular text-text-weak">
          Switched to {props.notice.model.providerID}/{props.notice.model.id}
        </div>
      </div>
      {props.onDismiss && (
        <button
          type="button"
          class="shrink-0 p-1 text-text-weak hover:text-text-strong"
          onClick={props.onDismiss}
        >
          <Icon name="close-small" class="size-3.5" />
        </button>
      )}
    </div>
  )
}
