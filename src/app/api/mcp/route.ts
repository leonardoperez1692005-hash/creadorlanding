import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { handleMCPRequest, MCP_TOOLS, type MCPRequest, type MCPResponse } from '@/lib/mcp/server'
import { THEME_PRESETS } from '@/features/wizard/config/themes'
import { rateLimitAsync } from '@/shared/lib/rate-limit'

export async function POST(req: NextRequest) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
    const rl = await rateLimitAsync(`mcp:${ip}`, { limit: 30, windowSec: 60 })
    if (!rl.allowed) {
        return NextResponse.json(
            { jsonrpc: '2.0', id: 0, error: { code: -32000, message: 'Too many requests' } },
            { status: 429 },
        )
    }

    try {
        const body = (await req.json()) as MCPRequest

        // Handle standard MCP methods (initialize, tools/list)
        if (body.method !== 'tools/call') {
            return NextResponse.json(handleMCPRequest(body))
        }

        // Handle tool calls
        const toolName = (body.params as { name?: string })?.name
        const args = (body.params as { arguments?: Record<string, unknown> })?.arguments ?? {}

        let result: unknown

        switch (toolName) {
            case 'list_theme_presets':
                result = {
                    presets: THEME_PRESETS.map((t) => ({
                        id: t.id,
                        name: t.name,
                        description: t.description,
                        primary: t.primary,
                        secondary: t.secondary,
                        accent: t.accent,
                        isDark: t.isDark,
                        fontHeading: t.fontHeading,
                        fontBody: t.fontBody,
                    })),
                }
                break

            case 'generate_landing':
            case 'analyze_competitor':
            case 'create_attack_plan':
            case 'export_report':
                // These tools require authenticated context and complex logic.
                // For now, return a structured message pointing to the API endpoints.
                result = {
                    message: `Tool "${toolName}" requires authenticated access. Use the BrandVortix web interface or API endpoints directly.`,
                    endpoint: getEndpointForTool(toolName),
                    args,
                }
                break

            default:
                return NextResponse.json({
                    jsonrpc: '2.0',
                    id: body.id,
                    error: {
                        code: -32602,
                        message: `Unknown tool: ${toolName}. Available: ${MCP_TOOLS.map((t) => t.name).join(', ')}`,
                    },
                } satisfies MCPResponse)
        }

        return NextResponse.json({
            jsonrpc: '2.0',
            id: body.id,
            result: { content: [{ type: 'text', text: JSON.stringify(result) }] },
        } satisfies MCPResponse)
    } catch (err) {
        return NextResponse.json(
            {
                jsonrpc: '2.0',
                id: 0,
                error: {
                    code: -32603,
                    message: err instanceof Error ? err.message : 'Internal error',
                },
            } satisfies MCPResponse,
            { status: 500 },
        )
    }
}

function getEndpointForTool(tool: string): string {
    switch (tool) {
        case 'generate_landing':
            return 'POST /api/license/projects (create) + POST /wizard/publish'
        case 'analyze_competitor':
            return 'POST /api/intelligence/analyze'
        case 'create_attack_plan':
            return 'POST /api/intelligence/attack-plan'
        case 'export_report':
            return 'POST /api/exports/{pdf|pptx|docx|xlsx}'
        default:
            return 'See documentation'
    }
}
