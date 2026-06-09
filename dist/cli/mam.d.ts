/**
 * omc-mam — Multi-Agent Memory CLI
 *
 * Provider-agnostic shell entry point for the cross-agent collaboration
 * primitives that ship with OMC. Codex, Gemini, Ollama, or any other agent
 * harness can shell out to these commands without needing MCP support:
 *
 *   omc-mam context post   --namespace team-alpha --author codex-1 \
 *                          --kind finding --message "flaky test in auth/"
 *   omc-mam context read   --namespace team-alpha --kind blocker
 *   omc-mam context digest --namespace team-alpha
 *
 *   omc-mam brief create   --id b1 --namespace team-alpha \
 *                          --title "Fix flaky auth tests" \
 *                          --goal "Get the suite green on main" \
 *                          --created-by codex-1 \
 *                          --owner codex-1 --owner gemini-2 \
 *                          --success "no quarantined tests" \
 *                          --constraint "must run under 60s"
 *   omc-mam brief status   --id b1 --namespace team-alpha \
 *                          --status in-progress --by codex-1
 *   omc-mam brief get      --id b1 --namespace team-alpha
 *
 *   omc-mam presence announce --namespace team-alpha --agent codex-1 \
 *                             --provider codex --role executor \
 *                             --focus "fixing flaky auth tests" --ttl 600
 *   omc-mam presence list     --namespace team-alpha
 *   omc-mam presence leave    --namespace team-alpha --agent codex-1
 *
 * Output: `--json` flag returns structured JSON for programmatic callers.
 *
 * The CLI imports the same lib functions the MCP tools use, so behavior,
 * validation, and storage paths are identical regardless of caller.
 */
/** Public entry point — exported for testing. Returns the exit code. */
export declare function runMam(argv: string[]): number;
//# sourceMappingURL=mam.d.ts.map