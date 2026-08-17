'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import AuthGate from '@/components/AuthGate'

const PROGRAM_START = '2026-08-17'

type Track = 'Learn' | 'Practice' | 'Earn'
type View = 'dashboard' | 'weeks' | 'sprint' | 'plan'

type RawWeek = {
  title: string
  phase: number
  question: string
  frameworks: string[]
  readings: string[]
  case: string
  output: string
  learn: string[]
  practice: string[]
  earn: string[]
}

type Task = {
  id: string
  track: Track
  text: string
  dueOffset: number
  due: Date
  week?: number
  weekTitle?: string
}

type Week = RawWeek & {
  number: number
  start: Date
  end: Date
  tasks: Task[]
}

type ProgressState = {
  completed: Record<string, boolean>
  notes: Record<number, string>
  startDate: string
}

type StrategyAppProps = {
  user: User
  onSignOut: () => Promise<void>
}

type DashboardProps = {
  currentWeek: Week
  selectedWeek: number
  setSelectedWeek: Dispatch<SetStateAction<number>>
  state: ProgressState
  toggleTask: (id: string) => void
  weekDone: number
  overdue: Task[]
  completion: number
  setView: Dispatch<SetStateAction<View>>
  updateNotes: (week: number, value: string) => void
  exportProgress: () => void
  resetProgress: () => void
}

type TrackCardProps = {
  track: Track
  tasks: Task[]
  state: ProgressState
  toggleTask: (id: string) => void
}

type TaskRowProps = {
  task: Task
  checked: boolean
  onChange: () => void
  inverse?: boolean
  showWeek?: boolean
}

type WeeksViewProps = {
  weeks: Week[]
  state: ProgressState
  toggleTask: (id: string) => void
  selectedWeek: number
  setSelectedWeek: Dispatch<SetStateAction<number>>
  search: string
  setSearch: Dispatch<SetStateAction<string>>
  updateNotes: (week: number, value: string) => void
}

type WeekDetailProps = {
  week: Week
  state: ProgressState
  toggleTask: (id: string) => void
  selected: boolean
  onSelect: () => void
  updateNotes: (week: number, value: string) => void
}

type PlanViewProps = {
  text: string
}

const STORAGE_KEY = 'lex-hue-strategy-os-v1'

const phaseMeta = [
  { name: 'Strategic Foundation', weeks: '1–4' },
  { name: 'Brand Strategy', weeks: '5–8' },
  { name: 'Customer Psychology', weeks: '9–11' },
  { name: 'Marketing Science', weeks: '12–15' },
  { name: 'Brand Experience', weeks: '16–18' },
  { name: 'Commercial Strategy', weeks: '19–21' },
  { name: 'Senior Strategist', weeks: '22–24' },
]

const caseTemplate = [
  'Business problem — what was actually wrong?',
  'Market situation — what was changing?',
  'Customer — who mattered?',
  'Insight — what did the strategists discover?',
  'Strategic choice — what did they decide?',
  'Positioning — what territory did they occupy?',
  'Brand idea — what central meaning organized everything?',
  'Distinction — what recognizable assets were built or protected?',
  'Activation — how was the strategy expressed?',
  'Commercial result — did it work?',
]

const rawWeeks: RawWeek[] = [
  {
    title: 'What Strategy Actually Is', phase: 0,
    question: 'What is strategy, and how is it different from goals, tactics, branding and operational improvement?',
    frameworks: ['Rumelt Strategy Kernel', 'Porter trade-offs + activity-system fit', 'Playing to Win', 'Marketing Myopia'],
    readings: ['Richard Rumelt — Good Strategy/Bad Strategy', 'Michael Porter — What Is Strategy?', 'Roger Martin + A.G. Lafley — Playing to Win', 'Theodore Levitt — Marketing Myopia'],
    case: 'Mabel & Stone — diagnose the business before prescribing a luxury website.',
    output: 'L&H strategic diagnosis',
    learn: ['Define strategy vs aspiration, tactic, operating principle and execution.', 'Study Diagnosis → Guiding Policy → Coherent Actions.', 'Study where to play / how to win / capabilities / systems.', 'Create Strategy Notebook entries: Theory, Evidence, Critique, Application.'],
    practice: ['Complete the Mabel & Stone diagnosis.', 'Write 5 founder questions before recommending a rebrand.', 'Identify the risk of merely making Mabel & Stone look more expensive.', 'Apply the same diagnosis question to Lex & Hue.', 'Mini-diagnose one existing business.'],
    earn: ['Define initial L&H ideal-client hypotheses.', 'Start a prospect list; target businesses showing clear rebrand trigger events.', 'Identify 10 of the first 30 qualified prospects.', 'Draft the working Brand Evolution Audit promise.'],
  },
  {
    title: 'Customer & Market Research', phase: 0,
    question: 'How do you discover what is true instead of relying on what a client assumes?',
    frameworks: ['Jobs to Be Done', 'Forces of Progress', 'Laddering / Means-End Chains', 'Semi-structured interviews', 'Review mining'],
    readings: ['Clayton Christensen / Bob Moesta — Jobs to Be Done', 'Reynolds & Gutman — Means-End Chains + laddering', 'Research customer journeys, social listening and survey design'],
    case: 'Interview established business owners about the moment their brand stopped representing the business.',
    output: '5 business-owner interviews',
    learn: ['Learn qualitative vs quantitative research.', 'Study the difference between what people say and what people do.', 'Build an interview guide around change, tension, attempted solutions and perceived value.'],
    practice: ['Conduct 5 non-sales business-owner interviews.', 'Mine reviews for 2 established businesses.', 'Synthesize recurring trigger events, fears and desired outcomes.', 'Mini-diagnose one existing business.'],
    earn: ['Add 10 more qualified prospects.', 'Use interview language to improve the Brand Evolution Audit offer.', 'Begin 3–5 research-led conversations without pitching.'],
  },
  {
    title: 'Positioning', phase: 0,
    question: 'Where should a business compete, for whom, and against what alternatives?',
    frameworks: ['Ries & Trout', 'Keller POP/POD + frame of reference', 'April Dunford positioning sequence', 'Creative-firm specialization'],
    readings: ['April Dunford — Obviously Awesome', 'Ries & Trout — Positioning: The Battle for Your Mind', 'Keller / Sternthal / Tybout — positioning, parity and difference', 'Blair Enns + David C. Baker on creative-firm positioning'],
    case: 'Position Lex & Hue relative to realistic alternatives—not just other brand studios.',
    output: 'L&H positioning document',
    learn: ['Map competitive alternatives → unique attributes → value → best-fit customers → category → trends.', 'Distinguish category credibility from differentiation.', 'Study why specialization must create genuine expertise.'],
    practice: ['Build L&H competitive-alternative map.', 'Write 3 positioning hypotheses and pressure-test each.', 'Define who L&H is not for.', 'Mini-diagnose one existing business.'],
    earn: ['Finish first 30-prospect list.', 'Begin personalized insight outreach.', 'Create a one-sentence explanation of the Brand Evolution Audit.'],
  },
  {
    title: 'Competitive Strategy', phase: 0,
    question: 'What structural forces, conventions and trade-offs shape where a business can win?',
    frameworks: ['Porter Five Forces', 'Strategic groups', 'Value chain', 'Category conventions', 'Blue Ocean Strategy', '7 Powers'],
    readings: ['Michael Porter — Competitive Strategy', 'Hamilton Helmer — 7 Powers', 'Kim & Mauborgne — Blue Ocean Strategy'],
    case: 'Map the Milwaukee competitive landscape relevant to L&H.',
    output: 'Milwaukee competitive landscape',
    learn: ['Evaluate rivalry, substitutes, buyers, suppliers and entrants.', 'Identify category conventions worth following vs breaking.', 'Connect competitive choices to operational trade-offs.'],
    practice: ['Build a strategic-group map for L&H.', 'Audit 5 Milwaukee/regional competitors.', 'Document opportunities, crowded claims and open territory.', 'Mini-diagnose one existing business.'],
    earn: ['Send first personalized outreach messages.', 'Track responses, conversations and objections.', 'Refine ideal-client criteria using market evidence.'],
  },
  {
    title: 'Brand Equity', phase: 1,
    question: 'What has a brand already earned in memory, meaning and behavior—and what must not be destroyed?',
    frameworks: ['Keller CBBE', 'Brand Resonance', 'Aaker Brand Equity', 'Keller Brand Report Card'],
    readings: ['Kevin Lane Keller — Strategic Brand Management', 'David Aaker — Managing Brand Equity', 'Keller — The Brand Report Card'],
    case: 'Tropicana 2009 — what happens when recognizable equity is discarded.',
    output: 'Brand Equity Audit',
    learn: ['Study awareness, associations, perceived quality, loyalty and brand assets.', 'Learn identity → meaning → response → relationship.', 'Turn the Brand Report Card into a diagnostic lens.'],
    practice: ['Audit Lex & Hue brand equity honestly.', 'Run a KEEP / CHANGE / CREATE inventory on one established brand.', 'Analyze Tropicana using the 10-question case template.', 'Mini-diagnose one existing business.'],
    earn: ['Finalize the Brand Evolution Audit diagnostic categories.', 'Create audit deliverable outline.', 'Continue targeted outreach and book conversations.'],
  },
  {
    title: 'Brand Identity Systems', phase: 1,
    question: 'How does strategy become a coherent identity system rather than a collection of aesthetics?',
    frameworks: ['Kapferer Brand Identity Prism', 'Aaker Brand Identity System', 'Identity systems', 'Brand codes'],
    readings: ['Jean-Noël Kapferer — Brand Identity Prism', 'Marty Neumeier — The Brand Gap', 'Marty Neumeier — Zag'],
    case: 'Airbnb — brand platform + identity system.',
    output: 'L&H Brand Platform',
    learn: ['Study physique, personality, culture, relationship, reflection and self-image.', 'Separate strategic identity choices from aesthetic preference.', 'Connect verbal, visual and experiential codes.'],
    practice: ['Build the L&H Brand Identity Prism.', 'Translate positioning into identity principles.', 'Analyze Airbnb with the case template.', 'Mini-diagnose one existing business.'],
    earn: ['Create the Audit sales-page structure.', 'Prepare a discovery-call question set.', 'Ask qualified prospects for discovery conversations.'],
  },
  {
    title: 'Brand Meaning & Cultural Strategy', phase: 1,
    question: 'How do brands create identity value by participating in culture rather than merely describing product benefits?',
    frameworks: ['Douglas Holt cultural branding', 'Cultural tensions', 'Myths', 'Semiotics', 'Status + taste signaling', 'Archetypes as interpretive tools'],
    readings: ['Douglas Holt — How Brands Become Icons', 'Margaret Mark & Carol Pearson — The Hero and the Outlaw', 'Introductory semiotics + visual culture study'],
    case: 'Dove Real Beauty or Nike Just Do It — analyze cultural meaning and tension.',
    output: 'Cultural opportunity analysis',
    learn: ['Study cultural tensions, myths and symbolic meaning.', 'Learn to use archetypes without turning them into personality quizzes.', 'Identify codes, subcultures, status signals and taste signals.'],
    practice: ['Map cultural tensions relevant to one L&H target category.', 'Analyze Dove or Nike using the case template.', 'Write how “atmosphere” can function strategically for L&H.', 'Mini-diagnose one existing business.'],
    earn: ['Publish one authority piece demonstrating judgment.', 'Use a real local business as the subject without generic branding advice.', 'Continue discovery conversations.'],
  },
  {
    title: 'Distinctiveness & Memory', phase: 1,
    question: 'How do brands become easy to recognize, retrieve from memory and buy?',
    frameworks: ['Ehrenberg-Bass', 'Mental availability', 'Physical availability', 'Category Entry Points', 'Distinctive Asset Grid'],
    readings: ['Byron Sharp — How Brands Grow', 'Jenni Romaniuk — Building Distinctive Brand Assets'],
    case: 'Mailchimp or Oatly — identity systems that behave as memory structures.',
    output: 'Distinctive Asset Audit',
    learn: ['Understand penetration vs loyalty claims.', 'Study mental availability, physical availability and category entry points.', 'Evaluate fame and uniqueness of visual/verbal assets.'],
    practice: ['Run a distinctive-assets audit on L&H.', 'Analyze Mailchimp or Oatly.', 'Compare differentiation vs distinctiveness arguments.', 'Mini-diagnose one existing business.'],
    earn: ['Target: sell the first $950 Brand Evolution Audit.', 'Use the audit as paid diagnosis, not inexpensive branding.', 'Track offer → conversation → paid audit conversion.'],
  },
  {
    title: 'Behavioral Science I — Decision Making', phase: 2,
    question: 'What predictable biases shape how customers notice, interpret and choose?',
    frameworks: ['Prospect theory', 'Loss aversion', 'Anchoring', 'Availability heuristic', 'Framing'],
    readings: ['Daniel Kahneman + Amos Tversky — core behavioral economics concepts', 'Rory Sutherland — Alchemy'],
    case: 'Choose a real service-business buying journey and identify invisible decision friction.',
    output: 'Behavioral teardown — part 1',
    learn: ['Study prospect theory, framing and anchoring.', 'Separate rational explanation from actual decision behavior.'],
    practice: ['Teardown website → offer → pricing → inquiry for one business.', 'Document friction, uncertainty, risk and cognitive load.', 'Mini-diagnose one existing business.'],
    earn: ['Apply behavioral findings to the L&H inquiry experience.', 'Improve the framing and anchoring of the Brand Evolution Audit.'],
  },
  {
    title: 'Behavioral Science II — Influence', phase: 2,
    question: 'How can a brand reduce perceived risk and make the right action easier without manipulation?',
    frameworks: ['Cialdini: reciprocity, commitment, social proof, authority, scarcity, liking, unity', 'Signaling', 'Choice architecture'],
    readings: ['Robert Cialdini — Influence', 'Rory Sutherland — Alchemy'],
    case: 'Evaluate a premium service purchase for proof, authority, signaling and risk reduction.',
    output: 'Behavioral teardown — part 2',
    learn: ['Study ethical influence and evidence design.', 'Learn how signaling and social proof differ from empty persuasion tricks.'],
    practice: ['Redesign the decision environment from Week 9.', 'Create a proof plan for L&H before it has a large case-study library.', 'Mini-diagnose one existing business.'],
    earn: ['Improve proposal and discovery proof points.', 'Ask for one testimonial, referral or credibility asset where appropriate.'],
  },
  {
    title: 'Behavioral Science III — Pricing & Offers', phase: 2,
    question: 'How do pricing architecture, comparisons and perceived risk change willingness to buy?',
    frameworks: ['Anchoring', 'Reference prices', 'Loss aversion', 'Three-option architecture', 'Value framing'],
    readings: ['Revisit Kahneman/Tversky, Cialdini and Sutherland through pricing and offers'],
    case: 'Compare three service businesses with different offer and pricing architecture.',
    output: 'Redesigned L&H decision environment',
    learn: ['Study how price is interpreted in context.', 'Identify where discounts weaken vs strengthen positioning.'],
    practice: ['Design three-option architecture for a future L&H transformation proposal.', 'Pressure-test the $950 audit framing.', 'Mini-diagnose one existing business.'],
    earn: ['Follow up open audit conversations.', 'Review pipeline metrics and diagnose bottlenecks.'],
  },
  {
    title: 'Marketing Science I — How Brands Grow', phase: 3,
    question: 'How does growth actually happen across penetration, loyalty, availability and buyer memory?',
    frameworks: ['Penetration vs loyalty', 'Double jeopardy', 'Mental availability', 'Physical availability'],
    readings: ['Byron Sharp — How Brands Grow', 'Ehrenberg-Bass evidence-based marketing resources'],
    case: 'Choose one category and map how brands make themselves easier to remember and buy.',
    output: 'Growth-model memo',
    learn: ['Understand the core Ehrenberg-Bass growth claims.', 'Identify what differs for small/local service firms.'],
    practice: ['Apply the theory to an L&H client scenario.', 'Critique where the framework may not fully transfer.', 'Mini-diagnose one existing business.'],
    earn: ['Create one authority post translating marketing science for established businesses.', 'Keep prospecting ahead of content volume.'],
  },
  {
    title: 'Marketing Science II — Brand Building vs Activation', phase: 3,
    question: 'How should a business balance immediate sales activity with long-term memory and demand creation?',
    frameworks: ['Binet & Field', 'Brand building', 'Sales activation', 'Reach', 'Frequency', 'Share of voice', 'Excess share of voice'],
    readings: ['Les Binet & Peter Field — The Long and the Short of It'],
    case: 'Snickers — You’re Not You When You’re Hungry.',
    output: 'Brand/activation allocation recommendation',
    learn: ['Study long-term vs short-term effects.', 'Understand why 60:40 is a contextual finding, not a universal commandment.'],
    practice: ['Analyze Snickers.', 'Build a brand/activation split for a hypothetical client.', 'Mini-diagnose one existing business.'],
    earn: ['Audit L&H’s own business-development mix: direct selling vs brand building.', 'Protect selling time from becoming “content procrastination.”'],
  },
  {
    title: 'Marketing Science III — Demand & Category Entry Points', phase: 3,
    question: 'When should a buyer think of this brand, and how do we systematically build those memory links?',
    frameworks: ['Category Entry Points', 'Customer acquisition', 'Funnels as imperfect models', 'Demand generation'],
    readings: ['Jenni Romaniuk / Ehrenberg-Bass material on Category Entry Points', 'Kotler for traditional marketing architecture'],
    case: 'Old Spice — category repositioning and demand creation.',
    output: 'CEP + demand map',
    learn: ['Map buying situations rather than demographics alone.', 'Compare funnel thinking with broader demand models.'],
    practice: ['Create L&H Category Entry Points.', 'Map change-trigger events to messages and outreach.', 'Mini-diagnose one existing business.'],
    earn: ['Turn trigger events into prospecting filters.', 'Build a small reusable personalized-insight outreach system.'],
  },
  {
    title: 'Marketing Science IV — Build the Plan', phase: 3,
    question: 'Can you turn diagnosis into an integrated 12-month marketing strategy with priorities and measurement?',
    frameworks: ['Reach', 'Frequency', 'Fame', 'Share of voice', 'Brand + activation', 'Acquisition', 'Measurement'],
    readings: ['Review Sharp, Romaniuk, Binet & Field, Kotler'],
    case: 'Liquid Death — category conventions, distinctiveness and distribution logic.',
    output: '12-month marketing strategy for a hypothetical L&H client',
    learn: ['Integrate the competing marketing schools.', 'Choose metrics appropriate to objectives instead of measuring everything.'],
    practice: ['Build the 12-month strategy.', 'Defend every channel and budget choice.', 'Analyze Liquid Death.', 'Mini-diagnose one existing business.'],
    earn: ['Package the thinking as evidence of strategic breadth.', 'Review first 60 days of revenue sprint and adjust funnel targets.'],
  },
  {
    title: 'Brand Experience I — Customer Journey', phase: 4,
    question: 'Where does the customer encounter the brand, and where do expectations break?',
    frameworks: ['Customer journey mapping', 'Touchpoint mapping', 'Service design', 'Double Diamond'],
    readings: ['Design Council — Double Diamond', 'Service-design + customer-journey foundations'],
    case: 'Map a real customer journey from awareness through post-purchase.',
    output: 'Customer journey + failure points',
    learn: ['Distinguish frontstage, backstage and supporting systems.', 'Map expectation, moment, emotion, friction and evidence.'],
    practice: ['Create a complete journey map.', 'Identify 5 experience gaps the visual identity alone cannot fix.', 'Mini-diagnose one existing business.'],
    earn: ['Add customer-experience diagnosis to the Brand Evolution Audit.', 'Identify implementation opportunities beyond identity.'],
  },
  {
    title: 'Brand Experience II — Servicescapes & Atmosphere', phase: 4,
    question: 'How do environment, sensory cues and atmosphere shape perceived brand meaning?',
    frameworks: ['Bitner Servicescapes', 'Pine & Gilmore Experience Economy', 'Sensory branding', 'Environmental branding'],
    readings: ['Pine & Gilmore — The Experience Economy', 'Bitner — Servicescapes'],
    case: 'Choose a hospitality, retail or wellness brand and analyze the physical/digital atmosphere.',
    output: 'Atmosphere strategy',
    learn: ['Study ambient conditions, spatial layout, signs/symbols and social environment.', 'Connect experience design to memory and positioning.'],
    practice: ['Create an atmosphere map for L&H or a target client.', 'Define which sensory/visual cues reinforce strategy.', 'Mini-diagnose one existing business.'],
    earn: ['Clarify L&H’s “atmosphere” point of view as a commercial capability.', 'Identify 3 possible referral partners in interiors, photography or copy.'],
  },
  {
    title: 'Brand Experience III — Total Experience Redesign', phase: 4,
    question: 'Can you redesign how a company presents, communicates and feels across all important encounters?',
    frameworks: ['UX strategy', 'Digital touchpoints', 'Service design', 'Sensory + retail/environmental branding'],
    readings: ['Review experience-economy, servicescape, UX and journey frameworks'],
    case: 'Redesign one company’s entire brand experience—not its logo.',
    output: 'Full brand-experience redesign',
    learn: ['Integrate physical, digital, service and communication touchpoints.'],
    practice: ['Complete the experience redesign.', 'Prioritize recommendations by impact, feasibility and strategic fit.', 'Mini-diagnose one existing business.'],
    earn: ['Translate experience work into Reinvent / Relaunch scope possibilities.', 'Build partner list: photographers, copywriters, developers, commercial interior designers, consultants, chambers.'],
  },
  {
    title: 'Commercial Strategy I — Sell Expertise', phase: 5,
    question: 'How do you sell diagnosis and expertise without behaving like an order-taking vendor?',
    frameworks: ['Blair Enns expert positioning', 'Diagnosis before prescription', 'Qualification', 'Money conversation'],
    readings: ['Blair Enns — The Win Without Pitching Manifesto', 'David C. Baker — expertise + positioning'],
    case: 'Role-play: “I’m just looking for a logo.”',
    output: 'L&H qualification + discovery system',
    learn: ['Study specialization, selectivity and not solving unpaid problems.', 'Learn to address money early without apology.'],
    practice: ['Build qualification criteria.', 'Run the “just a logo” simulation.', 'Write what you refuse to do for free.', 'Mini-diagnose one existing business.'],
    earn: ['Use the qualification system on live prospects.', 'Review average engagement value and pipeline quality.'],
  },
  {
    title: 'Commercial Strategy II — Discovery & Value', phase: 5,
    question: 'Can you uncover business stakes deeply enough to connect strategic work to value?',
    frameworks: ['SPIN Selling', 'Four Conversations', 'Value-based pricing', 'Need-payoff'],
    readings: ['Neil Rackham — SPIN Selling', 'Blair Enns — The Four Conversations', 'Blair Enns — Pricing Creativity'],
    case: 'Role-play: “My nephew can make a website for $500.”',
    output: 'Discovery-call script + value model',
    learn: ['Study Situation → Problem → Implication → Need-payoff.', 'Connect consequences and opportunity to pricing logic.'],
    practice: ['Run the $500-nephew simulation.', 'Create 10 implication questions.', 'Practice summarizing value before proposing scope.', 'Mini-diagnose one existing business.'],
    earn: ['Run real discovery calls using the system.', 'Track discovery → paid audit conversion.'],
  },
  {
    title: 'Commercial Strategy III — Proposals, Negotiation & Scope', phase: 5,
    question: 'How do you structure choices, protect scope and negotiate without collapsing your positioning?',
    frameworks: ['Three-option proposals', 'Anchoring', 'Objection handling', 'Negotiation', 'Scope control'],
    readings: ['Revisit Pricing Creativity + Four Conversations', 'Study proposal architecture and scope management'],
    case: 'Role-play: “We don’t have a budget” and “Can you send concepts before we hire you?”',
    output: 'L&H proposal architecture',
    learn: ['Learn option design and scope boundaries.', 'Separate concession from value exchange.'],
    practice: ['Run both difficult-client simulations.', 'Build 3-option proposal structure.', 'Write scope-change rules.', 'Mini-diagnose one existing business.'],
    earn: ['Use proposal architecture for the next qualified opportunity.', 'Review 90-day sprint results and build the next-quarter target.'],
  },
  {
    title: 'Senior Strategist I — Diagnose', phase: 6,
    question: 'Can you make sense of a messy business situation before jumping to solutions?',
    frameworks: ['Integrated diagnosis across strategy, research, position, brand, marketing and experience'],
    readings: ['No major new theory — review weak areas from your Strategy Notebook'],
    case: 'Capstone fictional business: customer interviews, financials, competitors, brand, site, leadership and market data.',
    output: 'Capstone diagnosis',
    learn: ['Review your framework critiques.', 'Choose only the frameworks that fit the situation.'],
    practice: ['Diagnose the capstone business.', 'State assumptions, evidence and missing information.', 'Mini-diagnose one existing business.'],
    earn: ['Document how your L&H methodology has evolved from the first 21 weeks.', 'Identify gaps in proof/case studies.'],
  },
  {
    title: 'Senior Strategist II — Strategic Recommendation', phase: 6,
    question: 'Can you make coherent choices and explain what the client should do—and not do?',
    frameworks: ['DIAGNOSE → DEFINE → DISTILL → DESIGN → DEPLOY → MEASURE'],
    readings: ['Review Rumelt, Porter, Dunford, Keller, Sharp/Romaniuk, Holt, Binet/Field, Enns'],
    case: 'Continue capstone.',
    output: 'Complete strategic recommendation',
    learn: ['Integrate competing schools without becoming dogmatic.'],
    practice: ['Define position, audience, promise, meaning and difference.', 'Specify visual codes, distinctive assets, experience and launch.', 'Build measurement logic.', 'Mini-diagnose one existing business.'],
    earn: ['Turn the strongest real or simulated work into case-study material.', 'Refine L&H methodology language based on what repeatedly worked.'],
  },
  {
    title: 'Senior Strategist III — Present, Defend, Codify', phase: 6,
    question: 'Can you defend your strategic choices under pressure and turn the process into reusable L&H intellectual property?',
    frameworks: ['Strategic defense', 'Evidence + critique', 'Methodology codification', 'Measurement'],
    readings: ['No new theory — final synthesis'],
    case: 'Present the capstone as if to a skeptical client or strategy director.',
    output: 'Polished L&H strategy case study + methodology v1',
    learn: ['Review the full Strategy Notebook.', 'Identify what you believe, what you reject and where you remain uncertain.'],
    practice: ['Present and defend the capstone.', 'Revise after challenge.', 'Codify L&H methodology v1.', 'Complete the 24th miniature brand diagnosis.'],
    earn: ['Publish/prepare the polished strategy case study.', 'Set next-quarter sales targets.', 'Plan the path from $950 audit → rebrand → website/experience → relaunch → stewardship.'],
  },
]

const sprintStages = [
  {
    days: 'Days 1–14', title: 'Build the machine',
    target: 'Create the complete commercial system before chasing volume.',
    actions: ['L&H positioning', 'Ideal-client criteria', 'Brand Evolution Audit', 'Audit methodology', 'Deliverables', 'Pricing', 'Sales page', 'Discovery process', 'Proposal', 'Lead tracker', 'Prospecting system'],
  },
  {
    days: 'Days 15–30', title: 'Get visible',
    target: 'Research and approach 30–50 carefully selected businesses.',
    actions: ['Prioritize trigger events: new location, expansion, leadership change, anniversary, new service line, old site, inconsistent identity, premium service/cheap presentation, merger, new market/audience, renovation', 'Research before contacting', 'Send personalized insight, not generic “I can help you grow” outreach', 'Track who replies and why'],
  },
  {
    days: 'Days 31–60', title: 'Convert',
    target: 'Operating funnel: 50 qualified prospects → 15 conversations → 5 discovery calls → 2 paid audits → 1 larger engagement.',
    actions: ['Review funnel weekly', 'Diagnose drop-off rather than declaring “marketing isn’t working”', 'Sell paid diagnosis before implementation', 'Use audit findings to open a transformation engagement'],
  },
  {
    days: 'Days 61–90', title: 'Build proof',
    target: 'Turn first clients into proof and improve the offer.',
    actions: ['Case studies', 'Testimonials', 'Before/after evidence', 'Content', 'Referrals', 'Portfolio work', 'Process refinement', 'Raise price as proof accumulates'],
  },
]

const weeklyRhythm = [
  ['Monday', '90 min', 'Theory / readings'],
  ['Tuesday', '90 min', 'Case analysis'],
  ['Wednesday', '90 min', 'Framework practice'],
  ['Thursday', '2 hrs', 'Prospecting'],
  ['Friday', '90 min', 'L&H business development'],
  ['Weekend', '2 hrs', 'Project / assignment'],
]

function addDays(dateString: string, days: number): Date {
  const date = new Date(`${dateString}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date
}

function formatDate(
  date: Date,
  options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' },
): string {
  return new Intl.DateTimeFormat('en-US', options).format(date)
}

const weeks = rawWeeks.map((week, index) => {
  const start = addDays(PROGRAM_START, index * 7)
  const end = addDays(PROGRAM_START, index * 7 + 6)
  const tasks = [
    ...week.learn.map((text, i) => ({ id: `w${index + 1}-learn-${i}`, track: 'Learn' as Track, text, dueOffset: i === 0 ? 0 : Math.min(i, 2) })),
    ...week.practice.map((text, i) => ({ id: `w${index + 1}-practice-${i}`, track: 'Practice' as Track, text, dueOffset: Math.min(2 + i, 6) })),
    ...week.earn.map((text, i) => ({ id: `w${index + 1}-earn-${i}`, track: 'Earn' as Track, text, dueOffset: Math.min(3 + i, 6) })),
  ].map(task => ({ ...task, due: addDays(PROGRAM_START, index * 7 + task.dueOffset) }))
  return { ...week, number: index + 1, start, end, tasks }
})

function loadState(): ProgressState {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return { completed: stored.completed || {}, notes: stored.notes || {}, startDate: stored.startDate || PROGRAM_START }
  } catch {
    return { completed: {}, notes: {}, startDate: PROGRAM_START }
  }
}

function StrategyApp({ user, onSignOut }: StrategyAppProps) {
  const [view, setView] = useState<View>('dashboard')
  const [state, setState] = useState<ProgressState>(loadState)
  const [cloudReady, setCloudReady] = useState(false)
  const [syncStatus, setSyncStatus] = useState('Loading cloud progress…')
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date()
    const diff = Math.floor((now.getTime() - new Date(`${PROGRAM_START}T00:00:00`).getTime()) / 86400000)
    return Math.max(1, Math.min(24, Math.floor(diff / 7) + 1))
  })
  const [planText, setPlanText] = useState('Loading master plan…')
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>(typeof Notification === 'undefined' ? 'unsupported' : Notification.permission)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadCloudProgress() {
      setSyncStatus('Loading cloud progress…')
      const { data, error } = await supabase
        .from('strategy_progress')
        .select('state')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cancelled) return

      if (error) {
        console.error(error)
        setSyncStatus('Cloud unavailable · using this device')
        setCloudReady(true)
        return
      }

      if (data?.state) {
        const cloudState = data.state as Partial<ProgressState>
        setState({
          completed: cloudState.completed || {},
          notes: cloudState.notes || {},
          startDate: cloudState.startDate || PROGRAM_START,
        })
      } else {
        const local = loadState()
        setState(local)
        const { error: seedError } = await supabase.from('strategy_progress').upsert({
          user_id: user.id,
          state: local,
          updated_at: new Date().toISOString(),
        })
        if (seedError) console.error(seedError)
      }

      setCloudReady(true)
      setSyncStatus('Cloud synced')
    }

    loadCloudProgress()
    return () => { cancelled = true }
  }, [user.id])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  
    if (!cloudReady) return
  
    const timer = setTimeout(async () => {
      setSyncStatus('Saving…')
  
      const { error } = await supabase
        .from('strategy_progress')
        .upsert({
          user_id: user.id,
          state,
          updated_at: new Date().toISOString(),
        })
  
      if (error) {
        console.error(error)
        setSyncStatus('Save failed · local copy kept')
      } else {
        setSyncStatus('Cloud synced')
      }
    }, 650)
  
    return () => clearTimeout(timer)
  }, [state, cloudReady, user.id])
  useEffect(() => {
    fetch('/master-plan.md').then(r => r.text()).then(setPlanText).catch(() => setPlanText('The master-plan file could not be loaded.'))
  }, [])

  const allTasks = useMemo(() => weeks.flatMap(w => w.tasks.map(t => ({ ...t, week: w.number, weekTitle: w.title }))), [])
  const completedCount = allTasks.filter(t => state.completed[t.id]).length
  const completion = Math.round((completedCount / allTasks.length) * 100)
  const now = new Date()
  now.setHours(23, 59, 59, 999)

  const overdue = allTasks.filter(t => !state.completed[t.id] && t.due < now && t.week <= selectedWeek)
  const currentWeek = weeks[selectedWeek - 1]
  const currentTasks = currentWeek.tasks
  const weekDone = currentTasks.filter(t => state.completed[t.id]).length

  useEffect(() => {
    if (notificationPermission !== 'granted') return
    const notify = () => {
      const dueToday = allTasks.filter(t => {
        const today = new Date()
        return !state.completed[t.id] && t.due.toDateString() === today.toDateString()
      })
      if (dueToday.length) {
        new Notification('Lex & Hue Strategy OS', { body: `${dueToday.length} task${dueToday.length === 1 ? '' : 's'} due today. Keep the Learn → Practice → Earn loop moving.` })
      }
    }
    notify()
    const timer = setInterval(notify, 60 * 60 * 1000)
    return () => clearInterval(timer)
  }, [notificationPermission, state.completed, allTasks])

  function toggleTask(id: string) {
    setState(s => ({ ...s, completed: { ...s.completed, [id]: !s.completed[id] } }))
  }

  function updateNotes(week: number, value: string) {
    setState(s => ({ ...s, notes: { ...s.notes, [week]: value } }))
  }

  async function enableAlerts() {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setNotificationPermission(permission)
  }

  function exportProgress() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lex-hue-strategy-progress.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  function resetProgress() {
    if (!confirm('Reset all checked tasks and notes? This cannot be undone unless you exported a backup.')) return
    setState({ completed: {}, notes: {}, startDate: PROGRAM_START })
  }

  const nav: Array<[View, string]> = [
    ['dashboard', 'Command Center'],
    ['weeks', '24 Weeks'],
    ['sprint', '90-Day Revenue Sprint'],
    ['plan', 'Master Plan'],
  ]

  return (
    <div className="min-h-screen bg-[#f3eee4] text-[#171512]">
      <header className="sticky top-0 z-40 border-b border-black/20 bg-[#f3eee4]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-4 md:px-10">
          <button onClick={() => setView('dashboard')} className="text-left">
            <div className="serif text-2xl font-semibold leading-none md:text-3xl">Lex & Hue</div>
            <div className="mt-1 text-xs text-black/55">Strategy OS · 24-week intensive</div>
          </button>
          <nav className="scrollbar-none hidden gap-1 overflow-x-auto md:flex">
            {nav.map(([id, label]) => (
              <button key={id} onClick={() => setView(id)} className={`rounded-full px-4 py-2 text-sm transition ${view === id ? 'bg-[#171512] text-[#f8f1e6]' : 'hover:bg-black/5'}`}>{label}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-semibold">{completion}% complete</div>
              <div className="text-xs text-black/45">{completedCount} / {allTasks.length} actions</div>
            </div>
            <div className="hidden text-right lg:block">
              <div className="text-xs font-semibold">{syncStatus}</div>
              <div className="text-[11px] text-black/45">{user.email}</div>
            </div>
            <button onClick={enableAlerts} className="rounded-full border border-black/25 px-3 py-2 text-xs hover:bg-white/40">
              {notificationPermission === 'granted' ? 'Alerts on' : 'Enable alerts'}
            </button>
            <button onClick={onSignOut} className="hidden rounded-full border border-black/20 px-3 py-2 text-xs hover:bg-white/40 sm:block">Sign out</button>
          </div>
        </div>
        <div className="md:hidden scrollbar-none flex gap-1 overflow-x-auto px-4 pb-3">
          {nav.map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} className={`whitespace-nowrap rounded-full px-3 py-2 text-xs ${view === id ? 'bg-[#171512] text-[#f8f1e6]' : 'border border-black/15'}`}>{label}</button>
          ))}
        </div>
      </header>

      {view === 'dashboard' && <Dashboard
        currentWeek={currentWeek}
        selectedWeek={selectedWeek}
        setSelectedWeek={setSelectedWeek}
        state={state}
        toggleTask={toggleTask}
        weekDone={weekDone}
        overdue={overdue}
        completion={completion}
        setView={setView}
        updateNotes={updateNotes}
        exportProgress={exportProgress}
        resetProgress={resetProgress}
      />}
      {view === 'weeks' && <WeeksView weeks={weeks} state={state} toggleTask={toggleTask} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} search={search} setSearch={setSearch} updateNotes={updateNotes} />}
      {view === 'sprint' && <SprintView />}
      {view === 'plan' && <PlanView text={planText} />}
    </div>
  )
}

function Dashboard({ currentWeek, selectedWeek, setSelectedWeek, state, toggleTask, weekDone, overdue, completion, setView, updateNotes, exportProgress, resetProgress }: DashboardProps) {
  const byTrack: Array<[Track, Task[]]> = (['Learn', 'Practice', 'Earn'] as Track[]).map(track => [track, currentWeek.tasks.filter(t => t.track === track)])
  return (
    <main>
      <section className="border-b border-black/20 bg-[#171512] text-[#f4ede1]">
        <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[1.4fr_.6fr]">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-white/55">
              <span>Week {selectedWeek} of 24</span><span>•</span><span>{formatDate(currentWeek.start)}–{formatDate(currentWeek.end)}</span><span>•</span><span>{phaseMeta[currentWeek.phase].name}</span>
            </div>
            <h1 className="serif max-w-5xl text-5xl font-medium leading-[.93] md:text-7xl lg:text-8xl">{currentWeek.title}</h1>
            <p className="mt-7 max-w-3xl text-base leading-7 text-white/70 md:text-lg">{currentWeek.question}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <button onClick={() => setView('weeks')} className="rounded-full bg-[#ec5a25] px-5 py-3 text-sm font-semibold text-white">Open this week</button>
              <select value={selectedWeek} onChange={e => setSelectedWeek(Number(e.target.value))} className="rounded-full border border-white/25 bg-transparent px-4 py-3 text-sm text-white outline-none">
                {weeks.map(w => <option className="text-black" key={w.number} value={w.number}>Week {w.number} — {w.title}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="border-t border-white/20 pt-6">
              <div className="flex items-end justify-between gap-4">
                <div><div className="serif text-5xl">{weekDone}/{currentWeek.tasks.length}</div><div className="mt-1 text-sm text-white/55">actions complete this week</div></div>
                <div className="serif text-4xl italic text-[#ec5a25]">{completion}%</div>
              </div>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-[#ec5a25]" style={{ width: `${(weekDone / currentWeek.tasks.length) * 100}%` }} /></div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1600px] px-5 py-8 md:px-10 md:py-12">
        {overdue.length > 0 && (
          <div className="mb-8 flex flex-col gap-3 border border-[#ec5a25]/50 bg-[#ec5a25]/10 p-5 md:flex-row md:items-center md:justify-between">
            <div><div className="font-semibold">{overdue.length} unfinished action{overdue.length === 1 ? '' : 's'} need attention.</div><div className="mt-1 text-sm text-black/60">This system does not hide work because the calendar moved on.</div></div>
            <button onClick={() => setView('weeks')} className="self-start rounded-full bg-[#171512] px-4 py-2 text-sm text-white">Review backlog</button>
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          {byTrack.map(([track, tasks]) => <TrackCard key={track} track={track} tasks={tasks} state={state} toggleTask={toggleTask} />)}
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_.7fr]">
          <div className="border-t border-black/30 pt-5">
            <div className="flex items-start justify-between gap-6"><div><h2 className="serif text-4xl">This week’s strategic output</h2><p className="mt-2 text-sm text-black/55">The thing you should have in your hands by Sunday.</p></div><div className="serif text-3xl italic text-[#ec5a25]">W{selectedWeek}</div></div>
            <div className="mt-6 bg-[#dfd6c7] p-6 md:p-8"><div className="serif text-3xl">{currentWeek.output}</div><div className="mt-5 text-sm leading-6 text-black/65"><strong>Case / simulation:</strong> {currentWeek.case}</div></div>
            <div className="mt-6"><h3 className="font-semibold">Frameworks to own</h3><div className="mt-3 flex flex-wrap gap-2">{currentWeek.frameworks.map(f => <span key={f} className="rounded-full border border-black/20 bg-white/25 px-3 py-2 text-sm">{f}</span>)}</div></div>
          </div>

          <div className="border-t border-black/30 pt-5">
            <h2 className="serif text-4xl">Strategy notebook</h2>
            <p className="mt-2 text-sm leading-6 text-black/55">Theory. Evidence. Critique. Application. Use this space for the week’s synthesis—not raw highlights.</p>
            <textarea value={state.notes[selectedWeek] || ''} onChange={e => updateNotes(selectedWeek, e.target.value)} placeholder="What do you believe now? What evidence supports it? Where does the framework break? When would you use it?" className="mt-5 min-h-64 w-full resize-y border border-black/25 bg-[#f8f3ea] p-5 leading-6 outline-none focus:border-black" />
          </div>
        </section>

        <section className="mt-14 border-y border-black/20 py-8">
          <div className="grid gap-8 md:grid-cols-[.7fr_1.3fr]">
            <div><h2 className="serif text-4xl">Weekly operating rhythm</h2><p className="mt-3 max-w-md text-sm leading-6 text-black/55">Roughly 10 hours/week. Extra time goes into business development, not more reading.</p></div>
            <div className="grid gap-px bg-black/15 sm:grid-cols-2">{weeklyRhythm.map(([day, time, work]) => <div key={day} className="bg-[#f3eee4] p-4"><div className="flex justify-between gap-4"><strong>{day}</strong><span className="text-black/45">{time}</span></div><div className="mt-2 text-sm text-black/65">{work}</div></div>)}</div>
          </div>
        </section>

        <section className="mt-10 flex flex-wrap items-center justify-between gap-4 text-sm text-black/55">
          <div>Progress is saved automatically in this browser.</div>
          <div className="flex gap-3"><button onClick={exportProgress} className="underline underline-offset-4">Export backup</button><button onClick={resetProgress} className="underline underline-offset-4">Reset progress</button></div>
        </section>
      </div>
    </main>
  )
}

function TrackCard({ track, tasks, state, toggleTask }: TrackCardProps) {
  const descriptions = {
    Learn: 'Theory, frameworks, evidence and competing schools.',
    Practice: 'Real-company analysis, case work and strategic reps.',
    Earn: 'L&H offer, authority, prospecting, pipeline and sales.',
  }
  const accent = track === 'Earn' ? 'bg-[#ec5a25] text-white' : track === 'Practice' ? 'bg-[#c9bda8]' : 'bg-[#e4dccf]'
  return (
    <div className={`${accent} min-h-[360px] p-6 md:p-7`}>
      <div className="flex items-start justify-between gap-4"><div><h2 className="serif text-4xl">{track}</h2><p className={`mt-2 text-sm leading-6 ${track === 'Earn' ? 'text-white/70' : 'text-black/55'}`}>{descriptions[track]}</p></div><div className="serif text-2xl">{tasks.filter(t => state.completed[t.id]).length}/{tasks.length}</div></div>
      <div className={`mt-6 divide-y ${track === 'Earn' ? 'divide-white/25' : 'divide-black/15'}`}>{tasks.map(task => <TaskRow key={task.id} task={task} checked={!!state.completed[task.id]} onChange={() => toggleTask(task.id)} inverse={track === 'Earn'} />)}</div>
    </div>
  )
}

function TaskRow({ task, checked, onChange, inverse = false, showWeek = false }: TaskRowProps) {
  return (
    <label className="flex cursor-pointer gap-3 py-3.5">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="min-w-0 flex-1"><span className={`block text-sm leading-5 ${checked ? 'line-through opacity-45' : ''}`}>{task.text}</span><span className={`mt-1 block text-[11px] ${inverse ? 'text-white/55' : 'text-black/40'}`}>{showWeek ? `Week ${task.week} · ` : ''}Due {formatDate(task.due, { weekday: 'short', month: 'short', day: 'numeric' })}</span></span>
    </label>
  )
}

function WeeksView({ weeks, state, toggleTask, selectedWeek, setSelectedWeek, search, setSearch, updateNotes }: WeeksViewProps) {
  const filtered = weeks.filter(w => `${w.title} ${w.question} ${w.frameworks.join(' ')} ${w.readings.join(' ')}`.toLowerCase().includes(search.toLowerCase()))
  return (
    <main className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[.45fr_1.55fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <h1 className="serif text-5xl md:text-6xl">The 24 weeks</h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-black/55">Every week moves through Learn → Practice → Earn. Checking tasks updates the Command Center automatically.</p>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search frameworks, books, subjects…" className="mt-6 w-full border-b border-black/30 bg-transparent py-3 outline-none placeholder:text-black/35" />
          <div className="mt-7 hidden max-h-[58vh] overflow-auto border-t border-black/15 lg:block">{filtered.map(w => <button key={w.number} onClick={() => { setSelectedWeek(w.number); document.getElementById(`week-${w.number}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }} className={`flex w-full items-center gap-4 border-b border-black/15 py-3 text-left ${selectedWeek === w.number ? 'font-semibold' : 'text-black/60'}`}><span className="serif w-8 text-xl">{w.number}</span><span className="text-sm">{w.title}</span></button>)}</div>
        </aside>
        <div className="space-y-10">
          {filtered.map(w => <WeekDetail key={w.number} week={w} state={state} toggleTask={toggleTask} selected={selectedWeek === w.number} onSelect={() => setSelectedWeek(w.number)} updateNotes={updateNotes} />)}
        </div>
      </div>
    </main>
  )
}

function WeekDetail({ week, state, toggleTask, selected, onSelect, updateNotes }: WeekDetailProps) {
  const done = week.tasks.filter(t => state.completed[t.id]).length
  return (
    <article id={`week-${week.number}`} onClick={onSelect} className={`scroll-mt-28 border-t p-0 pt-5 transition ${selected ? 'border-[#ec5a25]' : 'border-black/30'}`}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div><div className="text-sm text-black/45">Week {week.number} · {formatDate(week.start)}–{formatDate(week.end)} · {phaseMeta[week.phase].name}</div><h2 className="serif mt-2 text-4xl md:text-5xl">{week.title}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">{week.question}</p></div>
        <div className="shrink-0 text-right"><div className="serif text-3xl">{done}/{week.tasks.length}</div><div className="text-xs text-black/40">actions complete</div></div>
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-3">
        {(['Learn', 'Practice', 'Earn'] as Track[]).map(track => <div key={track} className={`${track === 'Earn' ? 'bg-[#ec5a25] text-white' : 'border border-black/20'} p-5`}><h3 className="serif text-3xl">{track}</h3><div className={`mt-3 divide-y ${track === 'Earn' ? 'divide-white/25' : 'divide-black/10'}`}>{week.tasks.filter(t => t.track === track).map(t => <TaskRow key={t.id} task={t} checked={!!state.completed[t.id]} onChange={() => toggleTask(t.id)} inverse={track === 'Earn'} />)}</div></div>)}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="bg-[#ded4c4] p-5"><h3 className="font-semibold">Read / study</h3><ul className="mt-3 space-y-2 text-sm leading-5 text-black/65">{week.readings.map(r => <li key={r}>— {r}</li>)}</ul><h3 className="mt-6 font-semibold">Strategic output</h3><p className="mt-2 serif text-2xl">{week.output}</p></div>
        <div className="border border-black/20 p-5"><h3 className="font-semibold">Case / simulation</h3><p className="mt-2 text-sm leading-6 text-black/65">{week.case}</p><h3 className="mt-6 font-semibold">Frameworks</h3><div className="mt-3 flex flex-wrap gap-2">{week.frameworks.map(f => <span key={f} className="rounded-full bg-black/5 px-3 py-1.5 text-xs">{f}</span>)}</div></div>
      </div>
      <details className="mt-5 border border-black/20 bg-white/20 p-5"><summary className="cursor-pointer font-semibold">Strategy notebook</summary><textarea value={state.notes[week.number] || ''} onChange={e => updateNotes(week.number, e.target.value)} onClick={e => e.stopPropagation()} placeholder="Theory / Evidence / Critique / Application" className="mt-4 min-h-48 w-full border border-black/20 bg-[#f8f3ea] p-4 outline-none" /></details>
    </article>
  )
}

function SprintView() {
  const start = new Date(`${PROGRAM_START}T00:00:00`)
  const today = new Date()
  const day = Math.max(1, Math.floor((today.getTime() - start.getTime()) / 86400000) + 1)
  return (
    <main>
      <section className="bg-[#ec5a25] text-white">
        <div className="mx-auto max-w-[1600px] px-5 py-14 md:px-10 md:py-20"><div className="max-w-5xl"><div className="text-sm text-white/65">Parallel commercial track · Day {day}</div><h1 className="serif mt-3 text-6xl leading-[.95] md:text-8xl">90-Day L&H Revenue Sprint</h1><p className="mt-6 max-w-3xl text-lg leading-8 text-white/75">The academic program never gets to become a hiding place. Revenue activity starts in Week 1, and the Brand Evolution Audit is the paid entry point.</p></div></div>
      </section>
      <div className="mx-auto max-w-[1600px] px-5 py-10 md:px-10 md:py-14">
        <div className="grid gap-px bg-black/20 lg:grid-cols-4">{sprintStages.map((stage, i) => <div key={stage.days} className="bg-[#f3eee4] p-6"><div className="serif text-2xl italic text-[#ec5a25]">0{i + 1}</div><div className="mt-8 text-sm text-black/45">{stage.days}</div><h2 className="serif mt-1 text-3xl">{stage.title}</h2><p className="mt-4 text-sm leading-6 text-black/60">{stage.target}</p><div className="mt-6 border-t border-black/15 pt-4">{stage.actions.map(a => <div key={a} className="border-b border-black/10 py-3 text-sm leading-5">{a}</div>)}</div></div>)}</div>

        <section className="mt-14 grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div><h2 className="serif text-5xl">The entry offer</h2><p className="mt-4 text-sm leading-6 text-black/55">Not an inexpensive version of branding. Paid diagnosis that can lead into implementation.</p></div>
          <div className="bg-[#171512] p-7 text-[#f4ede1] md:p-10"><div className="flex flex-col justify-between gap-5 md:flex-row"><div><h3 className="serif text-4xl">Brand Evolution Audit</h3><p className="mt-2 text-white/55">Introductory target price</p></div><div className="serif text-5xl italic text-[#ec5a25]">$950</div></div><div className="mt-8 grid gap-x-8 gap-y-3 border-t border-white/20 pt-6 sm:grid-cols-2">{['Business evolution','Customer / audience','Market position','Competitors','Messaging','Visual identity','Distinctive assets','Website / digital presence','Customer touchpoints','Brand consistency','Growth opportunities','Priority recommendations'].map(x => <div key={x} className="text-sm text-white/75">{x}</div>)}</div><div className="mt-8 border-t border-white/20 pt-6"><div className="serif text-3xl">Brand Evolution Roadmap</div><div className="mt-4 grid gap-3 sm:grid-cols-4">{[['KEEP','Equity worth protecting'],['CHANGE','What weakens the brand'],['CREATE','What the next stage requires'],['PRIORITIZE','Now, next, later']].map(([a,b]) => <div key={a} className="border border-white/20 p-4"><strong className="text-[#ec5a25]">{a}</strong><div className="mt-2 text-xs leading-5 text-white/55">{b}</div></div>)}</div></div></div>
        </section>

        <section className="mt-14 border-t border-black/30 pt-6"><h2 className="serif text-5xl">Initial operating funnel</h2><div className="mt-7 grid gap-px bg-black/20 sm:grid-cols-5">{[['50','qualified prospects'],['15','conversations'],['5','discovery calls'],['2','paid audits'],['1','larger engagement']].map(([n,l]) => <div key={l} className="bg-[#dfd6c7] p-6 text-center"><div className="serif text-5xl">{n}</div><div className="mt-2 text-xs text-black/55">{l}</div></div>)}</div><p className="mt-4 text-xs text-black/45">These are operating targets, not promises or universal conversion benchmarks.</p></section>
      </div>
    </main>
  )
}

function PlanView({ text }: PlanViewProps) {
  return (
    <main className="mx-auto max-w-[1500px] px-5 py-10 md:px-10 md:py-14">
      <div className="grid gap-8 lg:grid-cols-[.45fr_1.55fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start"><h1 className="serif text-5xl md:text-6xl">Master plan</h1><p className="mt-4 max-w-sm text-sm leading-6 text-black/55">The complete source plan is preserved here verbatim so nothing from the original curriculum disappears when it is converted into tasks.</p><div className="mt-8 border-t border-black/20 pt-5"><h2 className="font-semibold">Case-study lens</h2><div className="mt-3 space-y-2">{caseTemplate.map((x,i) => <div key={x} className="text-xs leading-5 text-black/55"><span className="mr-2 serif text-lg text-black">{i+1}</span>{x}</div>)}</div></div></aside>
        <pre className="overflow-x-auto whitespace-pre-wrap border border-black/20 bg-[#f8f3ea] p-5 font-mono text-[12px] leading-6 text-black/70 md:p-8">{text}</pre>
      </div>
    </main>
  )
}

function StrategyOS() {
  return <AuthGate>{({ user, signOut }) => <StrategyApp user={user} onSignOut={signOut} />}</AuthGate>
}

export default StrategyOS