// =============================================
// BrandVortix — MCP Server Tool Definitions
// =============================================
// Exposes BrandVortix capabilities as MCP tools.
// Used via HTTP transport at /api/mcp.

export interface MCPTool {
    name: string
    description: string
    inputSchema: {
        type: 'object'
        properties: Record<string, unknown>
        required?: string[]
    }
}

export const MCP_TOOLS: MCPTool[] = [
    {
        name: 'generate_landing',
        description: 'Generate a landing page from a project configuration. Returns compiled HTML.',
        inputSchema: {
            type: 'object',
            properties: {
                projectName: {
                    type: 'string',
                    description: 'Name of the landing page project',
                },
                structureType: {
                    type: 'string',
                    enum: ['vsl', 'webinar', 'carta_larga', 'libre'],
                    description: 'Landing page structure type',
                },
                theme: {
                    type: 'string',
                    enum: [
                        'midnight-tech',
                        'elegant-luxury',
                        'clean-corporate',
                        'bold-startup',
                        'warm-artisan',
                        'ocean-depths',
                        'sunset-boulevard',
                        'arctic-frost',
                        'desert-rose',
                        'neon-city',
                    ],
                    description: 'Theme preset ID',
                },
            },
            required: ['projectName'],
        },
    },
    {
        name: 'analyze_competitor',
        description:
            'Analyze competitor websites and generate an intelligence report with strengths, weaknesses, and attack vectors.',
        inputSchema: {
            type: 'object',
            properties: {
                competitors: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'List of competitor URLs to analyze',
                },
                industry: {
                    type: 'string',
                    description: 'Industry/sector for context',
                },
            },
            required: ['competitors'],
        },
    },
    {
        name: 'create_attack_plan',
        description:
            'Generate a ZMOT attack plan with ad copy, social media scripts, and landing section content for each competitor vulnerability.',
        inputSchema: {
            type: 'object',
            properties: {
                intelReportId: {
                    type: 'string',
                    description: 'ID of a previously generated intelligence report',
                },
            },
            required: ['intelReportId'],
        },
    },
    {
        name: 'export_report',
        description:
            'Export a report as PDF, PPTX, DOCX, or XLSX. Returns the file as base64-encoded data.',
        inputSchema: {
            type: 'object',
            properties: {
                format: {
                    type: 'string',
                    enum: ['pdf', 'pptx', 'docx', 'xlsx'],
                    description: 'Export file format',
                },
                type: {
                    type: 'string',
                    enum: ['strategy', 'attack-plan', 'intel-report', 'political', 'leads'],
                    description: 'Type of report to export',
                },
                data: {
                    type: 'object',
                    description: 'Report data payload',
                },
            },
            required: ['format', 'type', 'data'],
        },
    },
    {
        name: 'political_intelligence',
        description:
            'Generate a political intelligence report by scraping social media profiles, researching SERP context, and analyzing with Gemini AI. Requires configured monitors.',
        inputSchema: {
            type: 'object',
            properties: {
                monitorIds: {
                    type: 'array',
                    items: { type: 'string' },
                    description:
                        'Optional: specific monitor IDs to analyze. If empty, all active monitors are used.',
                },
                generateAttackVectors: {
                    type: 'boolean',
                    description:
                        'Whether to also generate attack vectors for detected vulnerabilities (requires campaign profile)',
                },
            },
        },
    },
    {
        name: 'list_theme_presets',
        description: 'List all available landing page theme presets with their colors and fonts.',
        inputSchema: {
            type: 'object',
            properties: {},
        },
    },
]

export interface MCPRequest {
    jsonrpc: '2.0'
    id: string | number
    method: string
    params?: Record<string, unknown>
}

export interface MCPResponse {
    jsonrpc: '2.0'
    id: string | number
    result?: unknown
    error?: { code: number; message: string }
}

/**
 * Handle MCP JSON-RPC request and return response.
 */
export function handleMCPRequest(request: MCPRequest): MCPResponse {
    const { id, method } = request

    switch (method) {
        case 'initialize':
            return {
                jsonrpc: '2.0',
                id,
                result: {
                    protocolVersion: '2024-11-05',
                    capabilities: { tools: {} },
                    serverInfo: {
                        name: 'brandvortix',
                        version: '1.0.0',
                    },
                },
            }

        case 'tools/list':
            return {
                jsonrpc: '2.0',
                id,
                result: { tools: MCP_TOOLS },
            }

        case 'tools/call':
            // Tool execution is handled in the API route
            return {
                jsonrpc: '2.0',
                id,
                error: { code: -32601, message: 'Tool execution handled by API route' },
            }

        default:
            return {
                jsonrpc: '2.0',
                id,
                error: { code: -32601, message: `Method not found: ${method}` },
            }
    }
}
