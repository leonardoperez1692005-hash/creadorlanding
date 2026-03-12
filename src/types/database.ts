export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    name: string
                    role: string
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    name?: string
                    role?: string
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    role?: string
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            plans: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    price: number
                    currency: string
                    max_projects: number
                    max_leads: number
                    max_ai_analyses: number
                    features: Json
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    price?: number
                    currency?: string
                    max_projects?: number
                    max_leads?: number
                    max_ai_analyses?: number
                    features?: Json
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    price?: number
                    currency?: string
                    max_projects?: number
                    max_leads?: number
                    max_ai_analyses?: number
                    features?: Json
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            memberships: {
                Row: {
                    id: string
                    user_id: string
                    plan_id: string
                    status: string
                    ai_analyses_used: number
                    start_date: string
                    expires_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    plan_id: string
                    status?: string
                    ai_analyses_used?: number
                    start_date?: string
                    expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    plan_id?: string
                    status?: string
                    ai_analyses_used?: number
                    start_date?: string
                    expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'memberships_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                    {
                        foreignKeyName: 'memberships_plan_id_fkey'
                        columns: ['plan_id']
                        isOneToOne: false
                        referencedRelation: 'plans'
                        referencedColumns: ['id']
                    },
                ]
            }
            brand_identities: {
                Row: {
                    id: string
                    user_id: string
                    logo_url: string
                    design_tokens: Json
                    brand_name: string | null
                    sector: string | null
                    target_audience: string | null
                    brand_values: string | null
                    business_objective: string | null
                    colors: Json | null
                    typography: Json | null
                    geometry: Json | null
                    is_completed: boolean | null
                    services: Json | null
                    faqs: Json | null
                    testimonials: Json | null
                    stats: Json | null
                    team_members: Json | null
                    differentiators: string | null
                    // Political identity (unified brain)
                    campaign_name: string | null
                    candidate_name: string | null
                    party: string | null
                    ideology_spectrum: string | null
                    core_positions: Json | null
                    key_proposals: Json | null
                    target_voters: string | null
                    coalition_allies: Json | null
                    red_lines: Json | null
                    tone_guidelines: string | null
                    communication_style: string | null
                    country: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    logo_url?: string
                    design_tokens?: Json
                    brand_name?: string | null
                    sector?: string | null
                    target_audience?: string | null
                    brand_values?: string | null
                    business_objective?: string | null
                    colors?: Json | null
                    typography?: Json | null
                    geometry?: Json | null
                    is_completed?: boolean | null
                    services?: Json | null
                    faqs?: Json | null
                    testimonials?: Json | null
                    stats?: Json | null
                    team_members?: Json | null
                    differentiators?: string | null
                    campaign_name?: string | null
                    candidate_name?: string | null
                    party?: string | null
                    ideology_spectrum?: string | null
                    core_positions?: Json | null
                    key_proposals?: Json | null
                    target_voters?: string | null
                    coalition_allies?: Json | null
                    red_lines?: Json | null
                    tone_guidelines?: string | null
                    communication_style?: string | null
                    country?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    logo_url?: string
                    design_tokens?: Json
                    brand_name?: string | null
                    sector?: string | null
                    target_audience?: string | null
                    brand_values?: string | null
                    business_objective?: string | null
                    colors?: Json | null
                    typography?: Json | null
                    geometry?: Json | null
                    is_completed?: boolean | null
                    services?: Json | null
                    faqs?: Json | null
                    testimonials?: Json | null
                    stats?: Json | null
                    team_members?: Json | null
                    differentiators?: string | null
                    campaign_name?: string | null
                    candidate_name?: string | null
                    party?: string | null
                    ideology_spectrum?: string | null
                    core_positions?: Json | null
                    key_proposals?: Json | null
                    target_voters?: string | null
                    coalition_allies?: Json | null
                    red_lines?: Json | null
                    tone_guidelines?: string | null
                    communication_style?: string | null
                    country?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'brand_identities_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: true
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            projects: {
                Row: {
                    id: string
                    slug: string
                    name: string
                    structure_type: string
                    visual_model: string
                    content_data: Json
                    html_output: string | null
                    user_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    slug: string
                    name?: string
                    structure_type?: string
                    visual_model?: string
                    content_data?: Json
                    html_output?: string | null
                    user_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    slug?: string
                    name?: string
                    structure_type?: string
                    visual_model?: string
                    content_data?: Json
                    html_output?: string | null
                    user_id?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'projects_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            leads: {
                Row: {
                    id: string
                    name: string
                    email: string
                    phone: string
                    message: string
                    source: string
                    project_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name?: string
                    email: string
                    phone?: string
                    message?: string
                    source?: string
                    project_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    phone?: string
                    message?: string
                    source?: string
                    project_id?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'leads_project_id_fkey'
                        columns: ['project_id']
                        isOneToOne: false
                        referencedRelation: 'projects'
                        referencedColumns: ['id']
                    },
                ]
            }
            licenses: {
                Row: {
                    id: string
                    key: string
                    status: string
                    user_id: string | null
                    domain: string
                    expires_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    status?: string
                    user_id?: string | null
                    domain?: string
                    expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    status?: string
                    user_id?: string | null
                    domain?: string
                    expires_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'licenses_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
            strategy_histories: {
                Row: {
                    id: string
                    user_id: string
                    brief_data: Json
                    strategy: Json
                    meta: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    brief_data?: Json
                    strategy?: Json
                    meta?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    brief_data?: Json
                    strategy?: Json
                    meta?: Json
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: 'strategy_histories_user_id_fkey'
                        columns: ['user_id']
                        isOneToOne: false
                        referencedRelation: 'profiles'
                        referencedColumns: ['id']
                    },
                ]
            }
        }
        Views: { [_ in never]: never }
        Functions: { [_ in never]: never }
        Enums: { [_ in never]: never }
        CompositeTypes: { [_ in never]: never }
    }
}

// === Convenience types ===
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Plan = Database['public']['Tables']['plans']['Row']
export type Membership = Database['public']['Tables']['memberships']['Row']
export type BrandIdentity = Database['public']['Tables']['brand_identities']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type Lead = Database['public']['Tables']['leads']['Row']
export type License = Database['public']['Tables']['licenses']['Row']
export type StrategyHistory = Database['public']['Tables']['strategy_histories']['Row']

export type UserRole = 'user' | 'admin' | 'superadmin'
export type ProjectStructureType = string // Dynamic: any template ID from the catalog
export type ProjectVisualModel = 'dark' | 'light'
export type LicenseStatus = 'active' | 'revoked' | 'expired'
export type MembershipStatus = 'active' | 'cancelled' | 'expired'

export interface DesignTokens {
    colors: {
        primary: string
        secondary: string
        accent: string
        background: string
        text?: string
    }
    typography: {
        headingFont: string
        bodyFont: string
    }
    borderRadius: string
    cardStyle?: 'flat' | 'glass' | 'bordered' | 'elevated'
    backgroundPreset?: string
}
