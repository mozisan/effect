import * as McpServer from "@effect/ai/McpServer"
import * as Tool from "@effect/ai/Tool"
import * as Toolkit from "@effect/ai/Toolkit"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Schema from "effect/Schema"

describe("McpServer", () => {
  describe("registerResource", () => {
    it.effect("should preserve _meta when registering resource templates", () =>
      Effect.scoped(
        Effect.gen(function*() {
          const meta = { feature: "resource-meta" } as const
          const registerTemplate = McpServer.registerResource`resource://${Schema.String}`

          yield* registerTemplate({
            name: "templated-resource",
            content: () => Effect.succeed("ok"),
            _meta: meta
          })

          const server = yield* McpServer.McpServer
          const template = server.resourceTemplates.find((entry) => entry.name === "templated-resource")

          assert.notStrictEqual(template, undefined)
          assert.deepStrictEqual(template!._meta, meta)
        }).pipe(
          Effect.provideServiceEffect(
            McpServer.McpServer,
            McpServer.McpServer.make
          )
        )
      ))

    it.effect("should preserve _meta when registering concrete resources", () =>
      Effect.scoped(
        Effect.gen(function*() {
          const meta = { feature: "resource-meta" } as const

          yield* McpServer.registerResource({
            uri: "resource://direct",
            name: "direct-resource",
            content: Effect.succeed("ok"),
            _meta: meta
          })

          const server = yield* McpServer.McpServer
          const resource = server.resources.find((entry) => entry.uri === "resource://direct")

          assert.notStrictEqual(resource, undefined)
          assert.deepStrictEqual(resource!._meta, meta)
        }).pipe(
          Effect.provideServiceEffect(
            McpServer.McpServer,
            McpServer.McpServer.make
          )
        )
      ))
  })

  describe("registerToolkit", () => {
    it.effect("should propagate tool _meta into registered MCP tools", () =>
      Effect.scoped(
        Effect.gen(function*() {
          const meta = { capability: "tool-meta" } as const
          const tool = Tool.make("MetaTool", {
            description: "tool with meta",
            success: Schema.Void,
            _meta: meta
          })
          const toolkit = Toolkit.make(tool)
          const handlersLayer = toolkit.toLayer({
            MetaTool: () => Effect.succeed(undefined)
          })

          yield* McpServer.registerToolkit(toolkit).pipe(Effect.provide(handlersLayer))

          const server = yield* McpServer.McpServer
          const registered = server.tools.find((entry) => entry.name === tool.name)

          assert.notStrictEqual(registered, undefined)
          assert.deepStrictEqual(registered!._meta, meta)
        }).pipe(
          Effect.provideServiceEffect(
            McpServer.McpServer,
            McpServer.McpServer.make
          )
        )
      ))
  })
})
