// =============================================
// Strategic Chat Sessions — Types
// =============================================

export interface ChatSession {
    id: string
    title: string
    messageCount: number
    createdAt: string
    updatedAt: string
}

export interface ChatSessionWithMessages extends ChatSession {
    messagesJson: unknown[]
}
