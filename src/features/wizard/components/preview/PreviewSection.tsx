import type { WizardSection } from '../../types'
import type { PreviewContent } from './types'
import { HeroPreview } from './HeroPreview'
import {
    BenefitsPreview,
    FeaturesPreview,
    TeamPreview,
    PricingPreview,
    StatsPreview,
} from './CardSections'
import {
    ServicesPreview,
    PortfolioPreview,
    GalleryPreview,
    LogoWallPreview,
    SkillsPreview,
    SpeakersPreview,
} from './MediaSections'
import {
    FaqPreview,
    ProcessPreview,
    TestimonialsPreview,
    LearningPreview,
    TargetPreview,
    TimelinePreview,
    AgendaPreview,
    BonusStackPreview,
} from './ListSections'
import { LeadCapturePreview, ContactPreview } from './FormSections'
import {
    ComparisonPreview,
    CountdownPreview,
    UrgencyPreview,
    OfferPreview,
    StoryPreview,
    SolutionPreview,
    GuaranteePreview,
    HtmlEmbedPreview,
    SpeakerPreview,
    AboutPreview,
} from './ContentSections'

const SECTION_TYPE_ALIASES: Record<string, string> = {
    proposals: 'features',
    biography: 'about',
    biography_candidate: 'about',
    events: 'agenda',
    donate: 'lead_capture',
    donations: 'lead_capture',
    volunteer: 'lead_capture',
    timeline: 'process_steps',
    mission: 'story',
    values: 'features',
    news: 'featured_post',
    gallery: 'image_gallery',
    achievements: 'stats',
    endorsements: 'testimonials',
    press: 'featured_post',
    social_media: 'contact',
    contact_form: 'contact',
}

export function PreviewSection({
    section,
    isMobile,
}: {
    section: WizardSection
    isMobile: boolean
}) {
    const content = section.content as PreviewContent
    const m = isMobile
    const resolvedType = SECTION_TYPE_ALIASES[section.type] ?? section.type

    switch (resolvedType) {
        case 'hero':
            return <HeroPreview content={content} m={m} />
        case 'benefits':
            return <BenefitsPreview content={content} m={m} />
        case 'features':
            return <FeaturesPreview content={content} m={m} />
        case 'team':
            return <TeamPreview content={content} m={m} />
        case 'pricing':
            return <PricingPreview content={content} m={m} />
        case 'stats':
            return <StatsPreview content={content} m={m} />
        case 'services':
            return <ServicesPreview content={content} m={m} />
        case 'portfolio_showcase':
            return <PortfolioPreview content={content} m={m} />
        case 'image_gallery':
            return <GalleryPreview content={content} m={m} />
        case 'logo_wall':
            return <LogoWallPreview content={content} m={m} title="Partners & Clientes" />
        case 'sponsors':
            return <LogoWallPreview content={content} m={m} title="Sponsors" />
        case 'skills':
            return <SkillsPreview content={content} m={m} />
        case 'speakers':
            return <SpeakersPreview content={content} m={m} />
        case 'faq':
            return <FaqPreview content={content} m={m} />
        case 'process':
        case 'process_steps':
        case 'how_it_works':
            return <ProcessPreview content={content} m={m} />
        case 'testimonials':
            return <TestimonialsPreview content={content} m={m} />
        case 'learning':
            return <LearningPreview content={content} m={m} />
        case 'target':
            return <TargetPreview content={content} m={m} />
        case 'experience':
            return <TimelinePreview content={content} m={m} title="Experiencia" />
        case 'education':
            return <TimelinePreview content={content} m={m} title="Educación" />
        case 'agenda':
            return <AgendaPreview content={content} m={m} />
        case 'bonus_stack':
            return <BonusStackPreview content={content} m={m} />
        case 'lead_capture':
            return <LeadCapturePreview content={content} m={m} />
        case 'contact':
            return <ContactPreview content={content} m={m} />
        case 'comparison':
            return <ComparisonPreview content={content} m={m} />
        case 'countdown':
            return <CountdownPreview content={content} m={m} />
        case 'urgency':
            return <UrgencyPreview content={content} m={m} />
        case 'offer':
            return <OfferPreview content={content} m={m} />
        case 'story':
            return <StoryPreview content={content} m={m} />
        case 'solution':
            return <SolutionPreview content={content} m={m} />
        case 'guarantee':
            return <GuaranteePreview content={content} m={m} />
        case 'html_embed':
            return <HtmlEmbedPreview content={content} m={m} />
        case 'speaker':
            return <SpeakerPreview content={content} m={m} />
        case 'about':
            return <AboutPreview content={content} m={m} />
        default:
            return null
    }
}
