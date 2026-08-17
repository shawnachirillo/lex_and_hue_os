'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import AuthGate from '@/components/AuthGate'

const PROGRAM_START = '2026-08-17'

type Track = 'Learn' | 'Practice' | 'Earn'
type View = 'dashboard' | 'weeks' | 'sprint' | 'plan'

type ReadingAssignment = {
  source: string
  assignment: string
  studyFor: string
}

type RawWeek = {
  title: string
  phase: number
  question: string
  frameworks: string[]
  readings: string[]
  requiredReadings: ReadingAssignment[]
  mastery: string[]
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
  responses: Record<string, string>
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
  openTask: (task: Task) => void
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
  openTask: (task: Task) => void
}

type TaskRowProps = {
  task: Task
  checked: boolean
  onChange: () => void
  onOpen?: () => void
  inverse?: boolean
  showWeek?: boolean
}

type WeeksViewProps = {
  weeks: Week[]
  state: ProgressState
  toggleTask: (id: string) => void
  openTask: (task: Task) => void
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
  openTask: (task: Task) => void
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
    requiredReadings: [
      {
        source: "Richard Rumelt \u2014 Good Strategy/Bad Strategy",
        assignment: "Read the Introduction and Chapters 1\u20135: Good Strategy Is Unexpected, Discovering Power, Bad Strategy, Why So Much Bad Strategy?, and The Kernel of Good Strategy.",
        studyFor: "Distinguish strategy from goals, slogans, ambition, and operational improvement. Be able to explain Diagnosis \u2192 Guiding Policy \u2192 Coherent Actions.",
      },
      {
        source: "Michael Porter \u2014 What Is Strategy?",
        assignment: "Read the full Harvard Business Review article.",
        studyFor: "Operational effectiveness vs. strategy; unique and valuable positioning; trade-offs; activity-system fit; why strategic choice requires saying no.",
      },
      {
        source: "Roger Martin + A.G. Lafley \u2014 Playing to Win",
        assignment: "Read the opening strategy-choice chapters introducing the five-part Strategy Choice Cascade.",
        studyFor: "Winning aspiration \u2192 Where to Play \u2192 How to Win \u2192 Capabilities \u2192 Management Systems. Compare this choice system with Rumelt's kernel.",
      },
      {
        source: "Theodore Levitt \u2014 Marketing Myopia",
        assignment: "Read the full article.",
        studyFor: "How defining a business by its product rather than the customer's underlying need can create strategic blindness.",
      }
    ],
    mastery: [
      "Explain why a goal is not a strategy.",
      "Write a clear diagnosis, guiding policy, and coherent actions.",
      "Identify real strategic trade-offs and where-to-play/how-to-win choices.",
      "Define Lex & Hue by the customer problem it solves, not merely by its services."
    ],
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
    requiredReadings: [
      {
        source: "Clayton Christensen \u2014 Competing Against Luck",
        assignment: "Read the Introduction and the early chapters that introduce Jobs to Be Done and the circumstances that cause customers to 'hire' a solution.",
        studyFor: "Separate demographics from progress customers are trying to make. Identify functional, social, and emotional dimensions of a job.",
      },
      {
        source: "Bob Moesta \u2014 Demand-Side Sales 101",
        assignment: "Read the chapters introducing the Forces of Progress and customer 'switch' interviews.",
        studyFor: "Push of the situation, pull of a new solution, anxiety of change, and habit of the present. Learn how to interview for causality rather than opinions.",
      },
      {
        source: "Thomas Reynolds & Jonathan Gutman \u2014 Laddering Theory, Method, Analysis, and Interpretation",
        assignment: "Study the core sections explaining attributes \u2192 consequences \u2192 values and the laddering interview technique.",
        studyFor: "Learn how to move from surface preferences to deeper meanings and decision criteria.",
      }
    ],
    mastery: [
      "Design a semi-structured interview that uncovers behavior rather than opinions.",
      "Use Forces of Progress to explain why a customer changes.",
      "Ladder from surface attributes to deeper consequences and values.",
      "Synthesize qualitative evidence into usable strategic insight."
    ],
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
    requiredReadings: [
      {
        source: "April Dunford \u2014 Obviously Awesome",
        assignment: "Read the chapters that walk through competitive alternatives, unique attributes, value, best-fit customers, market category, and relevant trends.",
        studyFor: "Build positioning from the customer's actual alternatives rather than from internal brand adjectives.",
      },
      {
        source: "Al Ries & Jack Trout \u2014 Positioning",
        assignment: "Read the opening chapters introducing the battle for the mind and the importance of category and frame of reference.",
        studyFor: "Understand positioning as a relative choice in the customer's mind, not simply a tagline.",
      },
      {
        source: "Kevin Lane Keller \u2014 Strategic Brand Management",
        assignment: "Study the sections on frame of reference, points of parity, and points of difference.",
        studyFor: "Know when a brand must first establish category credibility before emphasizing difference.",
      }
    ],
    mastery: [
      "Name the real alternatives a customer would use if Lex & Hue did not exist.",
      "Write a positioning hypothesis grounded in attributes, value, customer fit, and category.",
      "Distinguish points of parity from points of difference.",
      "Explain who the brand is deliberately not for."
    ],
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
    requiredReadings: [
      {
        source: "Michael Porter \u2014 The Five Competitive Forces That Shape Strategy",
        assignment: "Read the full Harvard Business Review article.",
        studyFor: "Industry rivalry, supplier power, buyer power, substitutes, and new entrants. Connect industry structure to strategic positioning.",
      },
      {
        source: "Hamilton Helmer \u2014 7 Powers",
        assignment: "Read the Introduction plus the overview chapter defining the seven durable sources of power.",
        studyFor: "Distinguish temporary advantage from structural power and identify which forms are plausible for a small service business.",
      },
      {
        source: "W. Chan Kim & Ren\u00e9e Mauborgne \u2014 Blue Ocean Strategy",
        assignment: "Read the chapters introducing value innovation, the strategy canvas, and eliminate-reduce-raise-create.",
        studyFor: "Use category conventions as raw material for strategic choice without assuming every business should create a 'blue ocean'.",
      }
    ],
    mastery: [
      "Map the five forces shaping a market.",
      "Identify category conventions that create sameness or opportunity.",
      "Distinguish differentiation from durable strategic power.",
      "Defend which competitive trade-offs Lex & Hue should make."
    ],
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
    requiredReadings: [
      {
        source: "Kevin Lane Keller \u2014 Strategic Brand Management",
        assignment: "Read the sections introducing Customer-Based Brand Equity and the Brand Resonance model.",
        studyFor: "Salience \u2192 performance/imagery \u2192 judgments/feelings \u2192 resonance. Understand brand equity as memory and response, not merely aesthetics.",
      },
      {
        source: "David Aaker \u2014 Managing Brand Equity",
        assignment: "Read the chapters defining brand awareness, associations, perceived quality, loyalty, and proprietary brand assets.",
        studyFor: "Identify what an established business has already earned and what a rebrand could accidentally destroy.",
      },
      {
        source: "Kevin Lane Keller \u2014 The Brand Report Card",
        assignment: "Read the full article.",
        studyFor: "Use Keller's diagnostic criteria to evaluate whether a brand is coherent, relevant, properly positioned, and actively managed.",
      }
    ],
    mastery: [
      "Audit awareness, associations, quality, loyalty, and distinctive assets.",
      "Separate valuable inherited equity from baggage.",
      "Explain how a rebrand can destroy memory structures.",
      "Create a KEEP / CHANGE / CREATE inventory grounded in evidence."
    ],
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
    requiredReadings: [
      {
        source: "Jean-No\u00ebl Kapferer \u2014 The New Strategic Brand Management",
        assignment: "Read the section explaining the Brand Identity Prism.",
        studyFor: "Physique, personality, culture, relationship, reflection, and self-image. Separate identity from image and aesthetic preference.",
      },
      {
        source: "Marty Neumeier \u2014 The Brand Gap",
        assignment: "Read the core chapters on differentiation, collaboration, innovation, validation, and cultivation.",
        studyFor: "Understand the bridge between business strategy and creative expression.",
      },
      {
        source: "Marty Neumeier \u2014 Zag",
        assignment: "Read the chapters on radical differentiation and the 'onlyness' test.",
        studyFor: "Use differentiation as a hypothesis to pressure-test, not as permission to invent arbitrary novelty.",
      }
    ],
    mastery: [
      "Build a Brand Identity Prism.",
      "Translate positioning into verbal, visual, and experiential identity principles.",
      "Separate strategic identity from aesthetic taste.",
      "Explain how identity codes should behave consistently across touchpoints."
    ],
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
    requiredReadings: [
      {
        source: "Douglas Holt \u2014 How Brands Become Icons",
        assignment: "Read the Introduction and chapters introducing cultural branding, identity myths, and cultural contradictions.",
        studyFor: "Understand how brands can create identity value by resolving or dramatizing cultural tensions.",
      },
      {
        source: "Margaret Mark & Carol Pearson \u2014 The Hero and the Outlaw",
        assignment: "Read the Introduction and the sections explaining archetypes as meaning systems.",
        studyFor: "Use archetypes as interpretive tools for cultural meaning, not personality quizzes or decorative labels.",
      },
      {
        source: "Introductory semiotics study",
        assignment: "Study signifier/signified, denotation/connotation, codes, myths, and how visual symbols acquire cultural meaning.",
        studyFor: "Learn to read typography, imagery, color, materials, language, and behavior as systems of signs.",
      }
    ],
    mastery: [
      "Identify a meaningful cultural tension rather than a generic trend.",
      "Use semiotics to interpret visual and verbal codes.",
      "Explain how a brand can create identity value through cultural meaning.",
      "Use archetypes cautiously as interpretive tools."
    ],
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
    requiredReadings: [
      {
        source: "Byron Sharp \u2014 How Brands Grow",
        assignment: "Read the chapters introducing penetration-led growth, double jeopardy, mental availability, and physical availability.",
        studyFor: "Understand the evidence behind broad-reach growth claims and the limits of loyalty-first thinking.",
      },
      {
        source: "Jenni Romaniuk \u2014 Building Distinctive Brand Assets",
        assignment: "Read the opening chapters and the sections on fame, uniqueness, and measuring distinctive assets.",
        studyFor: "Evaluate whether an asset is both widely recognized and uniquely linked to the brand.",
      },
      {
        source: "Jenni Romaniuk \u2014 Better Brand Health",
        assignment: "Study the sections on Category Entry Points and mental availability.",
        studyFor: "Connect distinctive assets to the buying situations in which a brand needs to come to mind.",
      }
    ],
    mastery: [
      "Explain penetration, mental availability, and physical availability.",
      "Audit an asset for fame and uniqueness.",
      "Map Category Entry Points relevant to a brand.",
      "Distinguish meaningful differentiation from distinctive memory-building assets."
    ],
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
    requiredReadings: [
      {
        source: "Daniel Kahneman \u2014 Thinking, Fast and Slow",
        assignment: "Read the sections on System 1/System 2, heuristics, anchoring, availability, and framing.",
        studyFor: "Recognize when decisions are shaped by fast judgment, reference points, salience, and presentation rather than deliberative analysis.",
      },
      {
        source: "Daniel Kahneman & Amos Tversky \u2014 Prospect Theory",
        assignment: "Study the core argument and graphs explaining reference dependence, loss aversion, and diminishing sensitivity.",
        studyFor: "Understand why equivalent gains and losses do not feel equivalent and how framing changes perceived value.",
      },
      {
        source: "Rory Sutherland \u2014 Alchemy",
        assignment: "Read the opening chapters arguing for psychological and seemingly irrational sources of value.",
        studyFor: "Learn to search for behavioral explanations when a purely rational business explanation is incomplete.",
      }
    ],
    mastery: [
      "Identify anchoring, framing, availability, and loss aversion in a buying journey.",
      "Separate rational explanation from likely decision behavior.",
      "Use behavioral evidence without overclaiming causality.",
      "Redesign one point of friction using behavioral principles."
    ],
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
    requiredReadings: [
      {
        source: "Robert Cialdini \u2014 Influence",
        assignment: "Read the chapters covering reciprocity, commitment/consistency, social proof, authority, scarcity, liking, and unity.",
        studyFor: "Distinguish ethical evidence and decision support from manipulative pressure.",
      },
      {
        source: "Rory Sutherland \u2014 Alchemy",
        assignment: "Read the chapters on signaling, context, and psychological value.",
        studyFor: "Understand why the meaning surrounding an offer can change perceived value without changing the underlying service.",
      },
      {
        source: "Choice architecture primer",
        assignment: "Study defaults, friction, salience, option structure, and cognitive load.",
        studyFor: "Design environments that make the right action easier without removing meaningful choice.",
      }
    ],
    mastery: [
      "Distinguish social proof, authority, signaling, and scarcity.",
      "Design ethical evidence that reduces perceived risk.",
      "Use choice architecture to reduce cognitive load.",
      "Explain when persuasion becomes manipulation."
    ],
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
    requiredReadings: [
      {
        source: "Daniel Kahneman \u2014 Thinking, Fast and Slow",
        assignment: "Revisit the sections on anchoring, reference points, loss aversion, and framing.",
        studyFor: "Apply behavioral economics specifically to pricing, packages, discounts, and perceived risk.",
      },
      {
        source: "Blair Enns \u2014 Pricing Creativity",
        assignment: "Read the sections introducing value-based pricing, options, and pricing the client rather than the hours.",
        studyFor: "Separate price from labor inputs and use option architecture to clarify value and choice.",
      },
      {
        source: "Rory Sutherland \u2014 Alchemy",
        assignment: "Revisit examples where context and framing alter willingness to pay.",
        studyFor: "Identify non-product variables that can change the perceived value of the Brand Evolution Audit.",
      }
    ],
    mastery: [
      "Explain how reference prices and anchors affect willingness to pay.",
      "Build a three-option pricing architecture.",
      "Distinguish discounting from value framing.",
      "Identify how risk, context, and comparison alter perceived price."
    ],
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
    requiredReadings: [
      {
        source: "Byron Sharp \u2014 How Brands Grow",
        assignment: "Read or revisit the chapters on penetration, double jeopardy, mental availability, and physical availability.",
        studyFor: "Explain why growth usually requires reaching more category buyers rather than merely deepening loyalty.",
      },
      {
        source: "Ehrenberg-Bass Institute \u2014 evidence summaries on buyer behavior",
        assignment: "Study current institute summaries on duplication of purchase, double jeopardy, and mental/physical availability.",
        studyFor: "Learn the empirical claims well enough to distinguish evidence from marketing folklore.",
      },
      {
        source: "Philip Kotler \u2014 Marketing Management",
        assignment: "Review the sections on market demand, segmentation, targeting, positioning, and the marketing mix.",
        studyFor: "Contrast classical marketing architecture with the Ehrenberg-Bass school.",
      }
    ],
    mastery: [
      "Explain double jeopardy and penetration-led growth.",
      "Distinguish mental from physical availability.",
      "Critique where large-category evidence may or may not transfer to a small service firm.",
      "Choose growth actions consistent with the evidence."
    ],
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
    requiredReadings: [
      {
        source: "Les Binet & Peter Field \u2014 The Long and the Short of It",
        assignment: "Read the core chapters comparing long-term brand building with short-term sales activation.",
        studyFor: "Understand different time horizons, emotional vs. rational effects, reach, and why the famous 60:40 finding is contextual rather than universal.",
      },
      {
        source: "Les Binet & Peter Field \u2014 effectiveness follow-up research",
        assignment: "Study summaries on reach, fame, share of voice, and the relationship between brand effects and activation.",
        studyFor: "Connect communication objectives to the metrics and time horizons that can actually reveal success.",
      },
      {
        source: "Byron Sharp \u2014 How Brands Grow",
        assignment: "Revisit broad reach and mental availability.",
        studyFor: "Compare Binet/Field's effectiveness framework with Ehrenberg-Bass growth principles.",
      }
    ],
    mastery: [
      "Explain the different jobs of brand building and sales activation.",
      "Choose metrics appropriate to long- vs. short-term effects.",
      "Explain why 60:40 is not a universal prescription.",
      "Defend an L&H business-development mix using evidence."
    ],
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
    requiredReadings: [
      {
        source: "Jenni Romaniuk \u2014 Better Brand Health",
        assignment: "Read the sections on Category Entry Points and measuring mental availability.",
        studyFor: "Map the situations, needs, contexts, and triggers that should cue a brand in memory.",
      },
      {
        source: "Ehrenberg-Bass Institute \u2014 Category Entry Point resources",
        assignment: "Study practical CEP examples and how brands build memory links across buying situations.",
        studyFor: "Turn abstract awareness goals into concrete buying-context memory objectives.",
      },
      {
        source: "Philip Kotler \u2014 Marketing Management",
        assignment: "Review buyer journey, demand generation, and channel concepts.",
        studyFor: "Use funnel models as planning aids while recognizing that real buyer journeys are nonlinear.",
      }
    ],
    mastery: [
      "Create useful Category Entry Points.",
      "Connect trigger events to memory structures and outreach.",
      "Explain the limits of linear funnel models.",
      "Turn demand situations into practical prospecting filters."
    ],
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
    requiredReadings: [
      {
        source: "Les Binet & Peter Field \u2014 The Long and the Short of It",
        assignment: "Revisit the sections most relevant to objective-setting, brand/activation balance, reach, and measurement.",
        studyFor: "Use effectiveness evidence to defend a 12-month allocation rather than defaulting to channel trends.",
      },
      {
        source: "Byron Sharp + Jenni Romaniuk",
        assignment: "Revisit mental availability, physical availability, distinctive assets, and Category Entry Points.",
        studyFor: "Integrate growth science into a coherent plan instead of treating each framework as an isolated idea.",
      },
      {
        source: "Philip Kotler \u2014 Marketing Management",
        assignment: "Review planning, segmentation/targeting/positioning, channel strategy, budgeting, and control.",
        studyFor: "Translate diagnosis into a structured marketing plan with priorities, owners, measures, and trade-offs.",
      }
    ],
    mastery: [
      "Build a coherent 12-month marketing strategy.",
      "Defend channel and budget choices using objectives and evidence.",
      "Integrate Sharp/Romaniuk, Binet/Field, and classical planning without contradiction.",
      "Choose a small set of meaningful measures."
    ],
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
    requiredReadings: [
      {
        source: "Design Council \u2014 Double Diamond",
        assignment: "Study the Discover, Define, Develop, and Deliver model and the distinction between divergent and convergent work.",
        studyFor: "Use the model as a process scaffold rather than a rigid sequence.",
      },
      {
        source: "Service design foundations",
        assignment: "Study customer journey maps, service blueprints, frontstage/backstage activity, evidence, and failure points.",
        studyFor: "See the customer experience as a system supported by operational processes.",
      },
      {
        source: "Marc Stickdorn et al. \u2014 This Is Service Design Doing",
        assignment: "Read the introductory sections on journey mapping, service blueprints, and research-led service design.",
        studyFor: "Connect qualitative research to concrete experience redesign.",
      }
    ],
    mastery: [
      "Map a complete customer journey.",
      "Distinguish frontstage, backstage, and supporting systems.",
      "Identify experience failure points that identity design cannot solve.",
      "Turn research into prioritized service improvements."
    ],
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
    requiredReadings: [
      {
        source: "B. Joseph Pine II & James H. Gilmore \u2014 The Experience Economy",
        assignment: "Read the opening chapters introducing experiences as a distinct form of economic value and the principles of staging experiences.",
        studyFor: "Understand how memorable experiences differ from simply delivering competent service.",
      },
      {
        source: "Mary Jo Bitner \u2014 Servicescapes",
        assignment: "Read the full article on the impact of physical surroundings on customers and employees.",
        studyFor: "Ambient conditions, spatial layout/functionality, signs/symbols/artifacts, and social responses.",
      },
      {
        source: "Sensory branding foundations",
        assignment: "Study how sight, sound, smell, touch, and taste can reinforce memory, expectation, and positioning.",
        studyFor: "Use sensory cues strategically rather than decoratively.",
      }
    ],
    mastery: [
      "Analyze a servicescape across ambient conditions, layout, symbols, and social cues.",
      "Connect sensory cues to memory and positioning.",
      "Distinguish atmosphere strategy from decoration.",
      "Create an experience concept grounded in intended meaning."
    ],
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
    requiredReadings: [
      {
        source: "Jesse James Garrett \u2014 The Elements of User Experience",
        assignment: "Read the chapters explaining strategy, scope, structure, skeleton, and surface.",
        studyFor: "Connect business goals and user needs to interface and content decisions.",
      },
      {
        source: "Service-design + UX strategy review",
        assignment: "Revisit customer journey mapping, service blueprints, Double Diamond, and servicescapes.",
        studyFor: "Integrate digital, physical, service, and communication touchpoints into one experience system.",
      },
      {
        source: "Pine & Gilmore \u2014 The Experience Economy",
        assignment: "Revisit the sections on staging, cues, and memorability.",
        studyFor: "Evaluate whether each touchpoint reinforces or contradicts the intended brand experience.",
      }
    ],
    mastery: [
      "Integrate digital, physical, service, and communication touchpoints.",
      "Trace UX choices back to business goals and user needs.",
      "Prioritize experience changes by strategic impact and feasibility.",
      "Design a coherent total brand experience rather than isolated deliverables."
    ],
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
    requiredReadings: [
      {
        source: "Blair Enns \u2014 The Win Without Pitching Manifesto",
        assignment: "Read the full manifesto.",
        studyFor: "Specialization, expert positioning, diagnosis before prescription, selectivity, money conversations, and refusing to solve problems before being paid.",
      },
      {
        source: "David C. Baker \u2014 The Business of Expertise",
        assignment: "Read the chapters on positioning, expertise, and narrowing the market.",
        studyFor: "Understand why expertise requires repeated exposure to similar problems rather than merely claiming premium positioning.",
      },
      {
        source: "Blair Enns \u2014 The Four Conversations",
        assignment: "Read the opening framework and the sections on the value and qualification conversations.",
        studyFor: "Separate selling expertise from order-taking and learn when to disqualify an opportunity.",
      }
    ],
    mastery: [
      "Qualify opportunities before prescribing solutions.",
      "Explain expertise without behaving like an order-taking vendor.",
      "Address money and fit early.",
      "Know what strategic work you will not do for free."
    ],
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
    requiredReadings: [
      {
        source: "Neil Rackham \u2014 SPIN Selling",
        assignment: "Read the chapters introducing Situation, Problem, Implication, and Need-payoff questions.",
        studyFor: "Move discovery from fact collection toward consequences, stakes, and the value of change.",
      },
      {
        source: "Blair Enns \u2014 The Four Conversations",
        assignment: "Read the sections on value and closing conversations.",
        studyFor: "Learn to connect business outcomes and risk to scope and price before presenting a proposal.",
      },
      {
        source: "Blair Enns \u2014 Pricing Creativity",
        assignment: "Read the value-pricing and option-architecture sections.",
        studyFor: "Translate discovered value into pricing logic without reverting to hourly cost-plus thinking.",
      }
    ],
    mastery: [
      "Run a SPIN-style discovery conversation.",
      "Move from symptoms to business implications and value.",
      "Summarize stakes before proposing scope.",
      "Connect value to pricing logic."
    ],
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
    requiredReadings: [
      {
        source: "Blair Enns \u2014 Pricing Creativity",
        assignment: "Read the sections on options, anchoring, concessions, and protecting price.",
        studyFor: "Use proposal architecture to create meaningful choices instead of one take-it-or-leave-it scope.",
      },
      {
        source: "Blair Enns \u2014 The Four Conversations",
        assignment: "Read the sections on closing and handling resistance.",
        studyFor: "Treat objections as information about value, risk, authority, or timing rather than as invitations to immediately discount.",
      },
      {
        source: "Negotiation foundations",
        assignment: "Study BATNA, interests vs. positions, reciprocal concessions, and scope-change controls.",
        studyFor: "Protect commercial boundaries while preserving a collaborative client relationship.",
      }
    ],
    mastery: [
      "Build three meaningful proposal options.",
      "Handle objections without reflexively discounting.",
      "Protect scope with explicit change rules.",
      "Negotiate through value exchange rather than unilateral concession."
    ],
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
    requiredReadings: [
      {
        source: "Richard Rumelt \u2014 Good Strategy/Bad Strategy",
        assignment: "Revisit Bad Strategy and The Kernel of Good Strategy.",
        studyFor: "Diagnose the central challenge before selecting frameworks or proposing creative solutions.",
      },
      {
        source: "April Dunford \u2014 Obviously Awesome",
        assignment: "Revisit competitive alternatives, value, best-fit customers, and market category.",
        studyFor: "Use positioning only where the evidence supports it; do not force every problem into a positioning problem.",
      },
      {
        source: "Your Strategy Notebook \u2014 Weeks 1\u201321",
        assignment: "Review your strongest critiques, failed assumptions, and repeated patterns.",
        studyFor: "Identify which frameworks you actually trust, when they apply, and where they conflict.",
      }
    ],
    mastery: [
      "Diagnose a messy business situation without jumping to solutions.",
      "State evidence, assumptions, and missing information separately.",
      "Choose frameworks because they fit the problem, not because they are familiar.",
      "Identify the crux of the capstone challenge."
    ],
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
    requiredReadings: [
      {
        source: "Michael Porter \u2014 What Is Strategy?",
        assignment: "Revisit trade-offs, fit, and unique activity systems.",
        studyFor: "Ensure the recommendation represents coherent choices rather than a collection of good ideas.",
      },
      {
        source: "Roger Martin + A.G. Lafley \u2014 Playing to Win",
        assignment: "Revisit the Strategy Choice Cascade.",
        studyFor: "Check that where-to-play and how-to-win choices are supported by capabilities and management systems.",
      },
      {
        source: "Keller + Sharp/Romaniuk + Holt + Binet/Field",
        assignment: "Review only the sections relevant to the capstone diagnosis: equity, distinctiveness, culture, growth, and effectiveness.",
        studyFor: "Integrate competing schools selectively. Explain why each chosen lens is useful and why excluded lenses are less relevant.",
      }
    ],
    mastery: [
      "Make coherent strategic choices across position, audience, promise, identity, experience, and growth.",
      "Explain what the client should not do.",
      "Show how recommendations reinforce one another.",
      "Build measurement logic tied to strategic objectives."
    ],
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
    requiredReadings: [
      {
        source: "Your complete Strategy Notebook",
        assignment: "Review Weeks 1\u201323 and identify the ideas you now accept, reject, or hold conditionally.",
        studyFor: "Turn accumulated notes into an explicit strategic point of view rather than a library of quotations.",
      },
      {
        source: "Capstone evidence pack",
        assignment: "Re-read all customer, market, competitor, brand, experience, and commercial evidence used in the capstone.",
        studyFor: "Make every recommendation traceable to evidence, a strategic choice, or a clearly labeled assumption.",
      },
      {
        source: "Selected methodology review",
        assignment: "Revisit Rumelt, Porter, Dunford, Keller, Sharp/Romaniuk, Holt, Binet/Field, and Enns only where needed to defend the final recommendation.",
        studyFor: "Demonstrate framework fluency by using the minimum necessary theory\u2014not by name-dropping every model.",
      }
    ],
    mastery: [
      "Defend recommendations under skeptical questioning.",
      "Trace claims to evidence and assumptions.",
      "Revise strategy after challenge without abandoning sound choices.",
      "Codify a clear Lex & Hue methodology and strategic point of view."
    ],
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
  if (typeof window === 'undefined') {
    return {
      completed: {},
      notes: {},
      responses: {},
      startDate: PROGRAM_START,
    }
  }

  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')

    return {
      completed: stored.completed || {},
      notes: stored.notes || {},
      responses: stored.responses || {},
      startDate: stored.startDate || PROGRAM_START,
    }
  } catch {
    return {
      completed: {},
      notes: {},
      responses: {},
      startDate: PROGRAM_START,
    }
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
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [copyStatus, setCopyStatus] = useState('')

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
          responses: cloudState.responses || {},
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

  function updateResponse(taskId: string, value: string) {
    setState(s => ({ ...s, responses: { ...s.responses, [taskId]: value } }))
  }

  async function copyForReview(task: Task) {
    const week = weeks.find(w => w.number === task.week) || weeks[selectedWeek - 1]
    const response = state.responses[task.id] || ''

    const reviewPrompt = `You are reviewing my work as a rigorous graduate-level brand strategy instructor.

WEEK ${week.number}: ${week.title}
TRACK: ${task.track}

ASSIGNMENT:
${task.text}

WEEK'S CORE QUESTION:
${week.question}

FRAMEWORKS:
${week.frameworks.map(f => `- ${f}`).join('\n')}

REQUIRED READINGS:
${week.requiredReadings.map(r => `- ${r.source}\n  Read: ${r.assignment}\n  Study for: ${r.studyFor}`).join('\n')}

EXPECTED MASTERY:
${week.mastery.map(item => `- ${item}`).join('\n')}

MY RESPONSE:
${response || '[No response written yet]'}

Please review this work critically, not encouragingly by default. Evaluate:
1. Strategic reasoning and depth
2. Evidence vs. unsupported assumptions
3. Correct use of the relevant frameworks
4. What I missed or oversimplified
5. Commercial implications
6. Clarity and quality of recommendation

Then give me:
- Overall assessment
- What is strong
- What needs work
- Specific gaps or errors
- 2–4 challenging questions I should answer
- Required revisions before I consider this complete`

    await navigator.clipboard.writeText(reviewPrompt)
    setCopyStatus('Copied for review')
    window.setTimeout(() => setCopyStatus(''), 1800)
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
    setState({ completed: {}, notes: {}, responses: {}, startDate: PROGRAM_START })
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
        openTask={setSelectedTask}
        weekDone={weekDone}
        overdue={overdue}
        completion={completion}
        setView={setView}
        updateNotes={updateNotes}
        exportProgress={exportProgress}
        resetProgress={resetProgress}
      />}
      {view === 'weeks' && <WeeksView weeks={weeks} state={state} toggleTask={toggleTask} openTask={setSelectedTask} selectedWeek={selectedWeek} setSelectedWeek={setSelectedWeek} search={search} setSearch={setSearch} updateNotes={updateNotes} />}
      {view === 'sprint' && <SprintView />}
      {view === 'plan' && <PlanView text={planText} />}

      {selectedTask && (
        <AssignmentWorkspace
          task={selectedTask}
          week={weeks.find(w => w.number === selectedTask.week) || currentWeek}
          response={state.responses[selectedTask.id] || ''}
          onResponseChange={(value) => updateResponse(selectedTask.id, value)}
          onClose={() => setSelectedTask(null)}
          onCopy={() => copyForReview(selectedTask)}
          copyStatus={copyStatus}
          checked={!!state.completed[selectedTask.id]}
          onToggleComplete={() => toggleTask(selectedTask.id)}
        />
      )}
    </div>
  )
}

function Dashboard({ currentWeek, selectedWeek, setSelectedWeek, state, toggleTask, openTask, weekDone, overdue, completion, setView, updateNotes, exportProgress, resetProgress }: DashboardProps) {
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
          {byTrack.map(([track, tasks]) => <TrackCard key={track} track={track} tasks={tasks} state={state} toggleTask={toggleTask} openTask={openTask} />)}
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

function TrackCard({ track, tasks, state, toggleTask, openTask }: TrackCardProps) {
  const descriptions = {
    Learn: 'Theory, frameworks, evidence and competing schools.',
    Practice: 'Real-company analysis, case work and strategic reps.',
    Earn: 'L&H offer, authority, prospecting, pipeline and sales.',
  }
  const accent = track === 'Earn' ? 'bg-[#ec5a25] text-white' : track === 'Practice' ? 'bg-[#c9bda8]' : 'bg-[#e4dccf]'
  return (
    <div className={`${accent} min-h-[360px] p-6 md:p-7`}>
      <div className="flex items-start justify-between gap-4"><div><h2 className="serif text-4xl">{track}</h2><p className={`mt-2 text-sm leading-6 ${track === 'Earn' ? 'text-white/70' : 'text-black/55'}`}>{descriptions[track]}</p></div><div className="serif text-2xl">{tasks.filter(t => state.completed[t.id]).length}/{tasks.length}</div></div>
      <div className={`mt-6 divide-y ${track === 'Earn' ? 'divide-white/25' : 'divide-black/15'}`}>{tasks.map(task => <TaskRow key={task.id} task={task} checked={!!state.completed[task.id]} onChange={() => toggleTask(task.id)} onOpen={() => openTask(task)} inverse={track === 'Earn'} />)}</div>
    </div>
  )
}

function TaskRow({ task, checked, onChange, onOpen, inverse = false, showWeek = false }: TaskRowProps) {
  return (
    <div className="flex gap-3 py-3.5">
      <label className="mt-0.5 cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} />
      </label>
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={onOpen}
          className={`block w-full text-left text-sm leading-5 underline-offset-4 ${onOpen ? 'hover:underline' : ''} ${checked ? 'line-through opacity-45' : ''}`}
        >
          {task.text}
        </button>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <span className={`block text-[11px] ${inverse ? 'text-white/55' : 'text-black/40'}`}>
            {showWeek ? `Week ${task.week} · ` : ''}Due {formatDate(task.due, { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          {onOpen && (
            <button
              type="button"
              onClick={onOpen}
              className={`text-[11px] font-semibold underline underline-offset-4 ${inverse ? 'text-white/75' : 'text-black/55'}`}
            >
              Open assignment
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function WeeksView({ weeks, state, toggleTask, openTask, selectedWeek, setSelectedWeek, search, setSearch, updateNotes }: WeeksViewProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const filtered = weeks.filter(w =>
    `${w.title} ${w.question} ${w.frameworks.join(' ')} ${w.readings.join(' ')}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  )

  const selectedWeekData = weeks[selectedWeek - 1]

  function chooseWeek(weekNumber: number) {
    setSelectedWeek(weekNumber)
    setSidebarOpen(false)

    window.setTimeout(() => {
      document
        .getElementById(`week-${weekNumber}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 50)
  }

  return (
    <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-5 sm:py-8 md:px-10 md:py-12">
      {/* WEEK SELECTOR BAR — ALL SCREEN SIZES */}
      <div className="mb-8">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="flex min-h-16 w-full items-center justify-between gap-4 border-y border-black/20 py-3 text-left"
        >
          <div className="min-w-0">
            <div className="text-[11px] text-black/45 sm:text-xs">
              Week {selectedWeek} of 24 · {phaseMeta[selectedWeekData.phase].name}
            </div>
            <div className="serif mt-1 truncate text-2xl sm:text-3xl">
              {selectedWeekData.title}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-xs text-black/45 sm:block">
              Browse 24 weeks
            </span>
            <span
              aria-hidden="true"
              className="grid h-11 w-11 place-items-center rounded-full border border-black/20 text-2xl leading-none"
            >
              ≡
            </span>
          </div>
        </button>
      </div>

      {/* WEEK SIDEBAR DRAWER — ALL SCREEN SIZES */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-[90]">
          <button
            type="button"
            aria-label="Close week menu"
            onClick={() => setSidebarOpen(false)}
            className="absolute inset-0 bg-black/45"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[88%] max-w-md flex-col bg-[#f3eee4] shadow-2xl">
            <div className="flex items-center justify-between border-b border-black/20 px-5 py-4 sm:px-6">
              <div>
                <div className="serif text-3xl sm:text-4xl">The 24 weeks</div>
                <div className="mt-1 text-xs text-black/45">
                  Select a week
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="grid h-11 w-11 place-items-center rounded-full border border-black/20 text-lg"
              >
                ×
              </button>
            </div>

            <div className="px-5 pt-4 sm:px-6">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search frameworks, books, subjects…"
                className="w-full border-b border-black/30 bg-transparent py-3 text-base outline-none placeholder:text-black/35"
              />
            </div>

            <div className="mt-3 flex-1 overflow-y-auto border-t border-black/10 px-5 pb-8 sm:px-6">
              {filtered.map(w => (
                <button
                  key={w.number}
                  type="button"
                  onClick={() => chooseWeek(w.number)}
                  className={`flex w-full items-center gap-4 border-b border-black/15 py-4 text-left ${
                    selectedWeek === w.number
                      ? 'text-black'
                      : 'text-black/55'
                  }`}
                >
                  <span
                    className={`serif w-8 shrink-0 text-2xl ${
                      selectedWeek === w.number
                        ? 'text-[#ec5a25]'
                        : ''
                    }`}
                  >
                    {w.number}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block text-sm leading-5 ${
                        selectedWeek === w.number
                          ? 'font-semibold'
                          : ''
                      }`}
                    >
                      {w.title}
                    </span>
                    <span className="mt-1 block text-[11px] text-black/35">
                      {phaseMeta[w.phase].name}
                    </span>
                  </span>

                  {selectedWeek === w.number && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#ec5a25]" />
                  )}
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}

      {/* SELECTED WEEK ONLY — ALL SCREEN SIZES */}
      <div className="mx-auto max-w-[1500px]">
        <WeekDetail
          week={selectedWeekData}
          state={state}
          toggleTask={toggleTask}
          openTask={openTask}
          selected
          onSelect={() => setSelectedWeek(selectedWeekData.number)}
          updateNotes={updateNotes}
        />
      </div>
    </main>
  )
}

function WeekDetail({ week, state, toggleTask, openTask, selected, onSelect, updateNotes }: WeekDetailProps) {
  const done = week.tasks.filter(t => state.completed[t.id]).length
  return (
    <article id={`week-${week.number}`} onClick={onSelect} className={`scroll-mt-28 border-t p-0 pt-5 transition ${selected ? 'border-[#ec5a25]' : 'border-black/30'}`}>
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div><div className="text-sm text-black/45">Week {week.number} · {formatDate(week.start)}–{formatDate(week.end)} · {phaseMeta[week.phase].name}</div><h2 className="serif mt-2 text-4xl md:text-5xl">{week.title}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-black/60">{week.question}</p></div>
        <div className="shrink-0 text-right"><div className="serif text-3xl">{done}/{week.tasks.length}</div><div className="text-xs text-black/40">actions complete</div></div>
      </div>
      <div className="mt-7 grid gap-5 xl:grid-cols-3">
        {(['Learn', 'Practice', 'Earn'] as Track[]).map(track => (
          <div
            key={track}
            className={`${
              track === 'Earn'
                ? 'bg-[#ec5a25] text-white'
                : track === 'Practice'
                  ? 'bg-[#cfc5ad] text-[#171512]'
                  : 'border border-black/20'
            } p-5`}
          >
            <h3 className="serif text-3xl">{track}</h3>

            <div
              className={`mt-3 divide-y ${
                track === 'Earn' ? 'divide-white/25' : 'divide-black/10'
              }`}
            >
              {week.tasks
                .filter(t => t.track === track)
                .map(t => (
                  <TaskRow
                    key={t.id}
                    task={t}
                    checked={!!state.completed[t.id]}
                    onChange={() => toggleTask(t.id)}
                    onOpen={() =>
                      openTask({
                        ...t,
                        week: week.number,
                        weekTitle: week.title,
                      })
                    }
                    inverse={track === 'Earn'}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div className="bg-[#ded4c4] p-5">
          <h3 className="font-semibold">Required reading</h3>
          <div className="mt-4 space-y-5">
            {week.requiredReadings.map(reading => (
              <div key={reading.source} className="border-t border-black/15 pt-4 first:border-t-0 first:pt-0">
                <div className="font-semibold leading-5">{reading.source}</div>
                <div className="mt-2 text-sm leading-6 text-black/70">
                  <strong>Read:</strong> {reading.assignment}
                </div>
                <div className="mt-2 text-sm leading-6 text-black/60">
                  <strong>Study for:</strong> {reading.studyFor}
                </div>
              </div>
            ))}
          </div>

          <h3 className="mt-7 font-semibold">By the end of this week, you should be able to…</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-black/65">
            {week.mastery.map(item => <li key={item}>— {item}</li>)}
          </ul>

          <h3 className="mt-7 font-semibold">Strategic output</h3>
          <p className="mt-2 serif text-2xl">{week.output}</p>
        </div>
        <div className="border border-black/20 p-5"><h3 className="font-semibold">Case / simulation</h3><p className="mt-2 text-sm leading-6 text-black/65">{week.case}</p><h3 className="mt-6 font-semibold">Frameworks</h3><div className="mt-3 flex flex-wrap gap-2">{week.frameworks.map(f => <span key={f} className="rounded-full bg-black/5 px-3 py-1.5 text-xs">{f}</span>)}</div></div>
      </div>
      <details className="mt-5 border border-black/20 bg-white/20 p-5"><summary className="cursor-pointer font-semibold">Strategy notebook</summary><textarea value={state.notes[week.number] || ''} onChange={e => updateNotes(week.number, e.target.value)} onClick={e => e.stopPropagation()} placeholder="Theory / Evidence / Critique / Application" className="mt-4 min-h-48 w-full border border-black/20 bg-[#f8f3ea] p-4 outline-none" /></details>
    </article>
  )
}

type AssignmentWorkspaceProps = {
  task: Task
  week: Week
  response: string
  onResponseChange: (value: string) => void
  onClose: () => void
  onCopy: () => void
  copyStatus: string
  checked: boolean
  onToggleComplete: () => void
}

function AssignmentWorkspace({
  task,
  week,
  response,
  onResponseChange,
  onClose,
  onCopy,
  copyStatus,
  checked,
  onToggleComplete,
}: AssignmentWorkspaceProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-black/55 p-0 sm:p-5" onClick={onClose}>
      <div
        className="ml-auto flex h-full w-full max-w-3xl flex-col overflow-hidden bg-[#f3eee4] text-[#171512] shadow-2xl sm:h-[calc(100vh-2.5rem)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-5 border-b border-black/20 px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <div className="text-xs text-black/45">
              Week {week.number} · {task.track}
            </div>
            <h2 className="serif mt-1 text-3xl leading-none sm:text-4xl">
              Assignment workspace
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 shrink-0 rounded-full border border-black/20 px-4 text-sm"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 sm:px-7">
          <section className="border-t border-black/30 pt-4">
            <div className="text-xs text-black/45">Assignment</div>
            <p className="mt-2 text-base font-semibold leading-6">{task.text}</p>
          </section>

          <section className="mt-7 border-t border-black/20 pt-4">
            <div className="text-xs text-black/45">Week’s core question</div>
            <p className="mt-2 text-sm leading-6 text-black/65">{week.question}</p>
          </section>

          <section className="mt-7">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="serif text-3xl">Your work</h3>
                <p className="mt-1 text-sm text-black/50">
                  Saved automatically with your Strategy OS progress.
                </p>
              </div>
              <span className="text-xs text-black/35">{response.length} characters</span>
            </div>

            <textarea
              value={response}
              onChange={(event) => onResponseChange(event.target.value)}
              placeholder="Work through the assignment here. Write the actual analysis, reasoning, evidence, and recommendation—not just notes to yourself."
              className="mt-4 min-h-[42vh] w-full resize-y border border-black/25 bg-[#f8f3ea] p-4 text-base leading-7 outline-none focus:border-black sm:p-5"
            />
          </section>

          <section className="mt-7 grid gap-5 border-t border-black/20 pt-5 md:grid-cols-2">
            <div>
              <h3 className="font-semibold">Frameworks for this week</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {week.frameworks.map((framework) => (
                  <span
                    key={framework}
                    className="rounded-full border border-black/15 px-3 py-1.5 text-xs"
                  >
                    {framework}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold">Required reading</h3>
              <div className="mt-3 space-y-4">
                {week.requiredReadings.map((reading) => (
                  <div key={reading.source} className="border-t border-black/10 pt-3 first:border-t-0 first:pt-0">
                    <div className="text-xs font-semibold leading-5">{reading.source}</div>
                    <div className="mt-1 text-xs leading-5 text-black/60">
                      <strong>Read:</strong> {reading.assignment}
                    </div>
                    <div className="mt-1 text-xs leading-5 text-black/50">
                      <strong>Study for:</strong> {reading.studyFor}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="border-t border-black/20 bg-[#eee6da] px-5 py-4 sm:px-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" checked={checked} onChange={onToggleComplete} />
              <span>{checked ? 'Marked complete' : 'Mark assignment complete'}</span>
            </label>

            <button
              type="button"
              onClick={onCopy}
              disabled={!response.trim()}
              className="min-h-12 bg-[#171512] px-5 py-3 text-sm font-semibold text-[#f8f1e6] disabled:cursor-not-allowed disabled:opacity-35"
            >
              {copyStatus || 'Copy for AI Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
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