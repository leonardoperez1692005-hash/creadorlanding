// ─── Section Renderer Registry ────────────────────────────────
//
// Maps section type strings to their renderer functions.
// Used by htmlCompiler's renderSection() dispatcher.

import type { SectionRenderer } from './types'

import { heroRenderer } from './hero'
import { benefitsRenderer } from './benefits'
import { urgencyRenderer } from './urgency'
import { countdownRenderer } from './countdown'
import { offerRenderer } from './offer'
import { leadCaptureRenderer } from './leadCapture'
import { faqRenderer } from './faq'
import { speakerRenderer } from './speaker'
import { storyRenderer } from './story'
import { solutionRenderer } from './solution'
import { learningRenderer } from './learning'
import { targetRenderer } from './target'
import { testimonialsRenderer } from './testimonials'
import { htmlEmbedRenderer } from './htmlEmbed'
import { imageGalleryRenderer } from './imageGallery'
import { pricingRenderer } from './pricing'
import { teamRenderer } from './team'
import { logoWallRenderer } from './logoWall'
import { contactRenderer } from './contact'
import { servicesRenderer } from './services'
import { processStepsRenderer } from './processSteps'
import { skillsRenderer } from './skills'
import { experienceRenderer, educationRenderer } from './timeline'
import { aboutRenderer } from './about'
import { guaranteeRenderer } from './guarantee'
import { comparisonRenderer } from './comparison'
import { bonusStackRenderer } from './bonusStack'
import { portfolioRenderer } from './portfolio'
import { statsRenderer } from './stats'
import { speakersGridRenderer } from './speakersGrid'
import { agendaRenderer } from './agenda'
import { newsletterRenderer } from './newsletter'
import { featuredPostRenderer } from './featuredPost'
import { integrationsRenderer } from './integrations'

const registry: Record<string, SectionRenderer> = {
  // ── Core VSL blocks ──
  hero: heroRenderer,
  benefits: benefitsRenderer,
  urgency: urgencyRenderer,
  countdown: countdownRenderer,
  offer: offerRenderer,
  lead_capture: leadCaptureRenderer,
  faq: faqRenderer,
  speaker: speakerRenderer,
  story: storyRenderer,
  solution: solutionRenderer,
  learning: learningRenderer,
  target: targetRenderer,
  testimonials: testimonialsRenderer,

  // ── Shared blocks ──
  html_embed: htmlEmbedRenderer,
  image_gallery: imageGalleryRenderer,
  pricing: pricingRenderer,
  team: teamRenderer,
  logo_wall: logoWallRenderer,
  contact: contactRenderer,

  // ── Sector blocks ──
  services: servicesRenderer,
  process: processStepsRenderer,
  process_steps: processStepsRenderer,
  how_it_works: processStepsRenderer,
  features: benefitsRenderer,          // alias → benefits layout
  skills: skillsRenderer,
  experience: experienceRenderer,
  education: educationRenderer,
  about: aboutRenderer,
  guarantee: guaranteeRenderer,
  comparison: comparisonRenderer,
  bonus_stack: bonusStackRenderer,
  portfolio_showcase: portfolioRenderer,
  stats: statsRenderer,
  speakers: speakersGridRenderer,
  agenda: agendaRenderer,
  sponsors: logoWallRenderer,          // alias → logo_wall layout

  // ── Previously missing (generated <!-- unknown section -->) ──
  newsletter: newsletterRenderer,
  featured_post: featuredPostRenderer,
  integrations: integrationsRenderer,
}

export function getRenderer(sectionType: string): SectionRenderer | undefined {
  return registry[sectionType]
}
