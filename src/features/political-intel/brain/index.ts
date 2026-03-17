export type {
    CampaignBrain,
    BrainVisualIdentity,
    BrainRecentReport,
    BrainSentimentSnapshot,
} from './types'
export { calculateBrainCompleteness } from './types'
export { loadCampaignBrain, buildBrainSystemPrompt, buildBrainCompactContext } from './loader'

// Sinapsis — Sistema de Impulsos Nerviosos
export type {
    BaseImpulse,
    CampaignConsciousness,
    MonitoringImpulse,
    SentimentImpulse,
    ContentImpulse,
    TacticalImpulse,
    SinapsisFeature,
    BrainValidation,
} from './sinapsis'
export {
    buildMonitoringImpulse,
    buildSentimentImpulse,
    buildContentImpulse,
    buildTacticalImpulse,
    buildMonitoringPromptBlock,
    buildSentimentPromptBlock,
    buildContentPromptBlock,
    buildTacticalPromptBlock,
    validateBrainForFeature,
} from './sinapsis'
