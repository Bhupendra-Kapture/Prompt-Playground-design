/**
 * data/constants.js — All static / dummy data for the prototype.
 * Edit this file to change categories, guidelines, history, AI responses, etc.
 */
window.APP_DATA = {

  /* ── Categories ─────────────────────────────────────────── */
  categories: [
    { id: 'banking',    name: 'Banking & Finance',   icon: '🏦', color: '#3b82f6', desc: 'You are a banking assistant that helps customers with account queries, transactions, loans, and financial guidance. You always verify identity before sharing account details.' },
    { id: 'sales',      name: 'Sales Enquiry',        icon: '📲', color: '#22c55e', desc: 'You are a sales bot that helps prospects understand products, pricing, and availability. You qualify leads, answer objections, and guide users toward a purchase decision.' },
    { id: 'support',    name: 'Customer Support',     icon: '🎧', color: '#8b5cf6', desc: 'You are a customer support agent that resolves complaints, troubleshoots issues, and escalates to a human when needed. You always empathize first before offering solutions.' },
    { id: 'leads',      name: 'Lead Generation',      icon: '🧑‍💼', color: '#f97316', desc: 'You are a lead capture bot that collects visitor information, qualifies their interest, and schedules callbacks or demos. You keep conversations short and goal-focused.' },
    { id: 'ecommerce',  name: 'E-Commerce',           icon: '🛒', color: '#ef4444', desc: 'You are an e-commerce assistant that helps users find products, track orders, process returns, and apply discount codes. You always confirm order details before taking action.' },
    { id: 'travel',     name: 'Travel & Hospitality', icon: '✈️', color: '#06b6d4', desc: 'You are a travel concierge that assists with flight bookings, hotel reservations, itinerary planning, and travel advisories. You personalise recommendations based on user preferences.' },
    { id: 'health',     name: 'Healthcare',           icon: '🏥', color: '#ec4899', desc: 'You are a healthcare assistant that books appointments, provides general wellness information, and reminds patients of medications. You never diagnose and always recommend consulting a doctor.' },
    { id: 'education',  name: 'Education',            icon: '🎓', color: '#6366f1', desc: 'You are an education bot that helps students with course queries, admissions, exam schedules, and study resources. You encourage learning and provide clear, structured answers.' },
    { id: 'realestate', name: 'Real Estate',          icon: '🏠', color: '#22c55e', desc: 'You are a real estate assistant that helps buyers, sellers, and renters find properties, schedule site visits, and understand pricing trends. You always clarify legal or financial queries with a disclaimer.' },
    { id: 'auto',       name: 'Automotive',           icon: '🚗', color: '#64748b', desc: 'You are an automotive bot that assists with vehicle enquiries, test drive bookings, service appointments, and spare parts availability. You speak knowledgeably about models and specifications.' },
    { id: 'food',       name: 'Food & Restaurant',    icon: '🍽️', color: '#f97316', desc: 'You are a restaurant bot that takes orders, answers menu questions, handles table reservations, and communicates estimated delivery times. You always confirm allergies or dietary restrictions.' },
    { id: 'hr',         name: 'HR & Recruitment',     icon: '💼', color: '#8b5cf6', desc: 'You are an HR assistant that screens candidates, answers job-related queries, schedules interviews, and communicates company policies. You maintain a professional and encouraging tone throughout.' },
  ],

  /* ── Guidelines ─────────────────────────────────────────── */
  guidelines: [
    { id: 'customer',    name: 'Customer Interaction',  desc: 'Addressing, thanking, escalation rules',    badge: null,       active: false },
    { id: 'response',    name: 'Response Style',         desc: 'Short, clear responses (\u226420 words)',   badge: null,       active: false },
    { id: 'closing',     name: 'Closing',                desc: 'End call politely with approved message',  badge: null,       active: true  },
    { id: 'security',    name: 'Security & Guardrails',  desc: 'Prevent prompt injection, stay on-topic',  badge: 'CRITICAL', active: false },
    { id: 'tone',        name: 'Tone & Language',        desc: 'Formal, friendly, or casual voice rules',  badge: null,       active: false },
    { id: 'format',      name: 'Response Format',        desc: 'Bullet points, plain text, max length',    badge: null,       active: false },
  ],

  /* ── History entries ────────────────────────────────────── */
  history: [
    {
      group: 'TODAY',
      items: [
        {
          id: 'h1',
          title: 'AI Optimized · 10:05:37 AM',
          type: 'OPTIMIZED',
          timestamp: 'Jul 30, 2026, 10:05 AM',
          daysLeft: '3d left',
          isPermanent: false,
          original: 'Answer the user queries',
          enhanced: '#1. ROLE & OBJECTIVE **Name:** (bot_name)...',
        },
        {
          id: 'h2',
          title: 'AI Optimized · 10:04:23 AM',
          type: 'OPTIMIZED',
          timestamp: 'Jul 30, 2026, 10:04 AM',
          daysLeft: '3d left',
          isPermanent: false,
          original: 'Answer the user queries',
          enhanced: '#1. ROLE & OBJECTIVE **Name:** (bot_name)...',
        },
        {
          id: 'h3',
          title: 'Manually Saved · 9:42:00 AM',
          type: 'SAVED',
          timestamp: 'Jul 30, 2026, 9:42 AM',
          daysLeft: 'Permanent',
          isPermanent: true,
          original: 'You are a finance assistant.',
          enhanced: '#1. ROLE & OBJECTIVE You are a certified finance assistant...',
        },
      ],
    },
    {
      group: 'YESTERDAY',
      items: [
        {
          id: 'h4',
          title: 'AI Refined · 3:15:22 PM',
          type: 'REFINED',
          timestamp: 'Jul 29, 2026, 3:15 PM',
          daysLeft: '2d left',
          isPermanent: false,
          original: 'Help users with queries',
          enhanced: '#1. ROLE & OBJECTIVE **Name:** (bot_name)...',
        },
      ],
    },
  ],

  /* ── Refine tab: canned AI responses ────────────────────── */
  refineResponses: [
    {
      triggers: ['formal', 'professional', 'corporate'],
      reply: 'Adjusted the tone to be formal and professional. The greeting, response patterns, and closing statements now reflect a corporate communication style.\n\n✓ Applied to prompt.',
      promptNote: 'Tone → Formal & Professional',
    },
    {
      triggers: ['casual', 'friendly', 'warm', 'conversational'],
      reply: 'Done! The language is now warmer and conversational. Responses will feel more human and approachable.\n\n✓ Applied to prompt.',
      promptNote: 'Tone → Friendly & Casual',
    },
    {
      triggers: ['shorter', 'concise', 'brief', 'compact', 'trim'],
      reply: "Condensed the prompt by ~25%, removing redundant phrases and merging overlapping instructions while keeping all core behaviour intact.\n\n✓ Applied to prompt.",
      promptNote: 'Condensed (−25%)',
    },
    {
      triggers: ['add', 'include', 'append'],
      reply: 'The requested content has been added at the appropriate position to maintain logical flow.\n\n✓ Applied to prompt.',
      promptNote: 'Content Added',
    },
    {
      triggers: ['remove', 'delete', 'strip'],
      reply: 'Removed! The specified section has been taken out and surrounding instructions adjusted for coherence.\n\n✓ Applied to prompt.',
      promptNote: 'Section Removed',
    },
    {
      triggers: ['structured', 'clear', 'organize', 'heading'],
      reply: "Restructured the prompt with cleaner section headings and a logical step-by-step flow. Much easier to read.\n\n✓ Applied to prompt.",
      promptNote: 'Restructured for Clarity',
    },
    {
      triggers: ['example', 'sample', 'demonstrate'],
      reply: 'Added concrete examples to the relevant sections so the bot can better understand expected behaviour.\n\n✓ Applied to prompt.',
      promptNote: 'Examples Added',
    },
  ],
};
