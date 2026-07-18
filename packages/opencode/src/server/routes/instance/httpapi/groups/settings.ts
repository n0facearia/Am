import { HttpApi, HttpApiEndpoint, HttpApiError, HttpApiGroup, OpenApi } from "effect/unstable/httpapi"
import { Schema } from "effect"
import { Authorization } from "../middleware/authorization"
import { InstanceContextMiddleware } from "../middleware/instance-context"
import { WorkspaceRoutingMiddleware, WorkspaceRoutingQuery } from "../middleware/workspace-routing"
import { described } from "./metadata"

const SettingsInfo = Schema.Struct({
  budgetGuardian: Schema.optional(
    Schema.Struct({
      fallbackModels: Schema.optional(Schema.Array(Schema.String)),
      contextThreshold: Schema.optional(Schema.Number),
    }),
  ),
  agentModels: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  customInstructions: Schema.optional(Schema.Record(Schema.String, Schema.Array(Schema.String))),
  userProfile: Schema.optional(
    Schema.Struct({
      preferredName: Schema.optional(Schema.String),
      bio: Schema.optional(Schema.String),
      experienceLevel: Schema.optional(Schema.String),
    }),
  ),
}).annotate({ identifier: "SettingsInfo" })

const root = "/settings"

export const SettingsApi = HttpApi.make("settings")
  .add(
    HttpApiGroup.make("settings")
      .add(
        HttpApiEndpoint.get("get", root, {
          query: WorkspaceRoutingQuery,
          success: described(SettingsInfo, "Get project settings"),
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "settings.get",
            summary: "Get settings",
            description: "Retrieve the project-level settings.json configuration.",
          }),
        ),
        HttpApiEndpoint.patch("update", root, {
          query: WorkspaceRoutingQuery,
          payload: SettingsInfo,
          success: described(SettingsInfo, "Successfully updated settings"),
          error: HttpApiError.BadRequest,
        }).annotateMerge(
          OpenApi.annotations({
            identifier: "settings.update",
            summary: "Update settings",
            description: "Update the project-level settings.json configuration.",
          }),
        ),
      )
      .annotateMerge(
        OpenApi.annotations({
          title: "settings",
          description: "Project-level settings.json routes.",
        }),
      )
      .middleware(InstanceContextMiddleware)
      .middleware(WorkspaceRoutingMiddleware)
      .middleware(Authorization),
  )
  .annotateMerge(
    OpenApi.annotations({
      title: "opencode experimental HttpApi",
      version: "0.0.1",
      description: "Experimental HttpApi surface for selected instance routes.",
    }),
  )
