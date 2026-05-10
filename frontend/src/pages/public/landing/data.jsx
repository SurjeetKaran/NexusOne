import React from "react";
import {
  AcademicCapIcon,
  BookOpenIcon,
  BriefcaseIcon,
  CommandLineIcon,
  CpuChipIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  MegaphoneIcon,
  PencilSquareIcon,
  ShoppingBagIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

export const SECTIONS = [
  "home",
  "how",
  "trial",
  "users",
  "modules",
  "features",
  "pricing",
  "faq",
];

export const NAV_ITEMS = [
  { id: "home",    label: "Home" },
  { id: "how",     label: "How it works" },
  { id: "trial",   label: "Free Trial" },
  { id: "modules", label: "Modes" },
  { id: "pricing", label: "Pricing" },
  { id: "faq",     label: "FAQ" },
];

export const HOW_IT_WORKS = [
  {
    title: "Pick your mode",
    text: "Choose Study mode to understand something, Content mode to write something, or Career mode to plan a career move or business idea. The AI adjusts its tone, structure, and style automatically.",
    detail: "Study = teacher-style. Content = copywriter-style. Career = coach and advisor style.",
  },
  {
    title: "Ask your question once",
    text: "Type your question in plain language and hit send. NexusAI sends it to multiple AI model personalities at the same time and shows you all the answers side by side.",
    detail: "No copy-pasting, no switching tabs. All answers appear together in one view.",
  },
  {
    title: "Use the best answer, come back later",
    text: "Pick the answer you like most. Come back to your chat history anytime within your plan's time window.",
    detail: "Free users get today's history. Pro gets 10 days. Super gets 30 days.",
  },
];

export const TRIAL_STEPS = [
  {
    step: "01",
    title: "Sign up — takes 30 seconds",
    text: "Create your account with email, Google, or GitHub. No forms to fill, no payment details, no waiting. Your account is ready the moment you sign up.",
    detail: "Your 2-day free trial starts automatically the moment your account is created.",
  },
  {
    step: "02",
    title: "Full access from the first second",
    text: "The trial doesn't hold anything back. You get Study mode, Content mode, Career mode, all AI model personalities, document uploads — everything the platform has.",
    detail: "10 new chats per day, 50 messages per conversation, all model personalities available.",
  },
  {
    step: "03",
    title: "Try Study mode — learn anything",
    text: "Pick Study mode and ask about any topic. The AI explains it clearly with definitions, examples, and step-by-step breakdowns — like having a tutor available 24/7.",
    detail: "Great for students, professionals learning something new, or anyone who wants to understand a topic quickly.",
  },
  {
    step: "04",
    title: "Try Content mode — write anything",
    text: "Switch to Content mode and ask it to write a post, an email, a caption, or a product description. The AI writes in an engaging, readable style that's ready to use.",
    detail: "Works for social media, blogs, emails, ad copy, YouTube scripts, and more.",
  },
  {
    step: "05",
    title: "Try Career mode — plan your next move",
    text: "Switch to Career mode and ask about career paths, job search strategy, startup ideas, or business planning. The AI acts like a coach — giving you honest, structured, step-by-step guidance.",
    detail: "Great for students figuring out their path, professionals considering a change, or anyone planning a business.",
  },
  {
    step: "06",
    title: "Compare multiple AI answers",
    text: "Select more than one model personality and send your question. You'll see all the answers side by side — different styles, different approaches, same question.",
    detail: "Pick the one that fits best. Or mix ideas from multiple answers. The choice is yours.",
  },
  {
    step: "07",
    title: "After 2 days — Free plan, nothing lost",
    text: "When the trial ends, your account moves to the Free plan automatically. You don't need to do anything. Your conversations stay accessible within the Free plan's history window.",
    detail: "Want to keep the full experience? Upgrade to Pro or Super anytime from your dashboard.",
  },
];

export const USER_TYPES = [
  {
    title: "Students",
    icon: <AcademicCapIcon className="w-7 h-7 text-electric-400" />,
    points: [
      "Get simple explanations of hard topics",
      "Step-by-step breakdowns of any concept",
      "Quick summaries before exams",
    ],
    desc: "Study mode explains things the way a good teacher would — clear, structured, with examples. Great for topics you're stuck on or need to revise fast.",
  },
  {
    title: "Digital Creators & Writers",
    icon: <MegaphoneIcon className="w-7 h-7 text-electric-400" />,
    points: [
      "Write posts, captions, and hooks in seconds",
      "Match the tone of your brand or platform",
      "Turn one idea into multiple content formats",
    ],
    desc: "Content mode writes like a copywriter — engaging, punchy, and ready to post. Works for social media, blogs, YouTube scripts, and more.",
  },
  {
    title: "Email & Business Writers",
    icon: <EnvelopeIcon className="w-7 h-7 text-electric-400" />,
    points: [
      "Draft professional emails fast",
      "Write proposals, reports, and summaries",
      "Compare different tones and styles side by side",
    ],
    desc: "Ask once, get multiple versions. Compare how different AI personalities write the same email or document and pick the one that fits your voice.",
  },
  {
    title: "Small Business Owners",
    icon: <ShoppingBagIcon className="w-7 h-7 text-electric-400" />,
    points: [
      "Write product descriptions and ad copy",
      "Create FAQs, landing page text, and pitches",
      "Get answers to business questions quickly",
    ],
    desc: "No marketing team? No problem. Use Content mode to write everything your business needs — from social posts to customer emails to website copy.",
  },
];

export const MULTIMODAL = [
  {
    title: "Upload a document and ask questions about it",
    icon: <DocumentTextIcon className="w-6 h-6 text-electric-400" />,
    text: "Upload a PDF, paste your notes, or drop in any text document. Then ask questions about it. The AI reads what you uploaded and gives you answers based on what's actually in it — not generic guesses.",
  },
  {
    title: "Use your documents as context for writing",
    icon: <PencilSquareIcon className="w-6 h-6 text-electric-400" />,
    text: "Upload a brief, a report, or a reference doc and ask the AI to write something based on it. Great for turning raw notes into polished content, emails, or summaries.",
  },
  {
    title: "Study from your own materials",
    icon: <BookOpenIcon className="w-6 h-6 text-electric-400" />,
    text: "Upload your lecture notes, textbook chapters, or study guides. Ask the AI to explain, summarise, or quiz you on what's inside. Study from your actual material, not generic examples.",
  },
  {
    title: "Always available, even when something goes wrong",
    icon: <CpuChipIcon className="w-6 h-6 text-electric-400" />,
    text: "The platform handles reliability automatically. Daily limits reset every night, and the system keeps running smoothly so you always get answers when you need them.",
  },
];

export const MODULES = [
  {
    title: "Study Mode",
    icon: <BookOpenIcon className="w-7 h-7 text-electric-400" />,
    desc: "Explains things the way a good teacher would. Clear, simple, and structured so you actually understand — not just get an answer.",
    bullets: [
      "Plain-English definitions with real examples",
      "Step-by-step breakdowns of any concept",
      "Short summaries you can actually remember",
    ],
    planBadge: null,
  },
  {
    title: "Content Mode",
    icon: <MegaphoneIcon className="w-7 h-7 text-electric-400" />,
    desc: "Writes the way a copywriter would. Engaging, readable, and ready to use — for posts, emails, captions, or anything you publish.",
    bullets: [
      "Attention-grabbing hooks and post copy",
      "Adapts tone to match your brand or platform",
      "Turns long ideas into short, punchy content",
    ],
    planBadge: null,
  },
  {
    title: "Career Mode",
    icon: <BriefcaseIcon className="w-7 h-7 text-amber-400" />,
    desc: "Acts like a career coach and business advisor. Gives you practical, honest, step-by-step guidance — whether you're planning a career move or starting a business.",
    bullets: [
      "Career planning and job search strategy",
      "Startup and business idea validation",
      "Step-by-step roadmaps and action plans",
    ],
    planBadge: null,
  },
];

export const PLATFORM_FEATURES = [
  {
    title: "Multiple AI answers from one question",
    desc: "Type your question once and get answers from multiple AI model personalities at the same time. Compare and pick the best one.",
    icon: <SparklesIcon className="w-5 h-5" />,
  },
  {
    title: "Study, Content and Career modes",
    desc: "Study mode explains things clearly. Content mode writes things engagingly. Career mode gives you practical career and business guidance. Pick the mode that matches what you need.",
    icon: <BookOpenIcon className="w-5 h-5" />,
  },
  {
    title: "Upload documents as context",
    desc: "Upload a PDF or paste notes and ask questions about them. The AI answers based on what's in your document, not generic knowledge.",
    icon: <DocumentTextIcon className="w-5 h-5" />,
  },
  {
    title: "Chat history saved by plan",
    desc: "Free users get today's history. Pro users get 10 days. Super users get 30 days. Always there when you need to go back.",
    icon: <ClockIcon className="w-5 h-5" />,
  },
  {
    title: "Clear daily limits — no surprises",
    desc: "Every plan has clear limits on chats per day, messages per conversation, and how many model personalities you can use at once.",
    icon: <ChartBarIcon className="w-5 h-5" />,
  },
  {
    title: "Sign in your way",
    desc: "Log in with Google, GitHub, or email and password. Forgot your password? Reset it in seconds from your inbox.",
    icon: <ShieldCheckIcon className="w-5 h-5" />,
  },
  {
    title: "Always on, always reliable",
    desc: "Daily limits reset every night automatically. The platform is built to stay available so you can keep working without interruptions.",
    icon: <CpuChipIcon className="w-5 h-5" />,
  },
];

// Static plan metadata — price comes from the DB at runtime
export const PLAN_META = {
  Trial: {
    period: "for 2 days",
    desc: "Full access to everything for 48 hours. No payment. No commitment.",
    perks: [
      "10 new chats every day",
      "50 messages per conversation",
      "Every AI model personality",
      "Study, Content and Career modes",
      "Chat history for today",
    ],
    emphasize: false,
    cta: "Start Free Trial",
    badge: null,
    priceOverride: "Free",
  },
  Free: {
    period: "/ month",
    desc: "Good for light use. Always free, no expiry.",
    perks: [
      "10 new chats every day",
      "10 messages per conversation",
      "1 AI model personality at a time",
      "Study, Content and Career modes",
      "Chat history for today",
    ],
    emphasize: false,
    cta: "Get Started Free",
    badge: null,
  },
  Pro: {
    period: "/ month",
    desc: "For people who use AI every day and need more room to work.",
    perks: [
      "20 new chats every day",
      "50 messages per conversation",
      "Up to 3 AI model personalities at once",
      "Study, Content and Career modes",
      "10 days of chat history",
    ],
    emphasize: true,
    cta: "Upgrade to Pro",
    badge: "Most Popular",
  },
  Super: {
    period: "/ month",
    desc: "For power users who want the most out of the platform.",
    perks: [
      "50 new chats every day",
      "100 messages per conversation",
      "All AI model personalities at once",
      "Study, Content and Career modes",
      "30 days of chat history",
    ],
    emphasize: false,
    cta: "Go Super",
    badge: "Best Value",
  },
};

export const PLAN_ORDER = ["Trial", "Free", "Pro", "Super"];

export const FAQS = [
  {
    q: "What is NexusOne?",
    a: "NexusOne is an AI platform with three modes — Study to understand things, Content to write things, and Career to plan career moves or business ideas. It sends your question to multiple AI model personalities at the same time so you can compare answers and pick the best one.",
  },
  {
    q: "What does NexusAI actually do?",
    a: "NexusAI is the engine inside NexusOne. When you type a question, it sends that question to multiple AI model personalities at once. Each one answers in its own style — analytical, creative, structured, or conversational. You see all the answers side by side and pick the one you like best.",
  },
  {
    q: "What is Career mode?",
    a: "Career mode acts like a career coach and business advisor. It gives you practical, step-by-step guidance on career planning, job search strategy, startup ideas, and business planning. It's available on all plans.",
  },
  {
    q: "Which AI models does NexusOne use?",
    a: "NexusOne gives you access to multiple AI model personalities — including NexusOne, ChatGPT, Gemini, Claude, and DeepSeek styles. Each one has its own tone and approach. You can run your question through one model or several at the same time and compare the answers side by side.",
  },
  {
    q: "What is the difference between the three modes?",
    a: "Study mode explains things clearly — like a teacher. It gives you definitions, examples, and step-by-step breakdowns. Content mode writes things engagingly — like a copywriter. It gives you posts, captions, emails, and copy that's ready to use. Career mode acts like a career coach and business advisor — it gives you practical roadmaps, action plans, and honest guidance for career or business decisions.",
  },
  {
    q: "Can I upload my own documents?",
    a: "Yes. You can upload PDFs or paste text documents and ask questions about them. The AI reads what you uploaded and answers based on what's actually in your document — not generic knowledge.",
  },
  {
    q: "How does the free trial work?",
    a: "When you sign up, you automatically get a 2-day free trial. No payment needed. During those 2 days you get full access — all modes, all model personalities, 10 chats a day, 50 messages per chat. After 2 days, you move to the Free plan automatically. Nothing gets deleted.",
  },
  {
    q: "What happens after the trial ends?",
    a: "Your account moves to the Free plan. You still get 10 chats a day and 10 messages per chat, but you can only use 1 AI model personality at a time. Your chat history stays accessible for today's window.",
  },
  {
    q: "How do I upgrade to Pro or Super?",
    a: "Go to the payment page, make the payment, and submit your transaction reference. An admin checks it and approves your upgrade — usually within a few hours. Your new plan limits apply immediately after approval.",
  },
  {
    q: "Can I share a conversation with someone?",
    a: "Sharing is not currently available.",
  },
];

export const HERO_BADGE_ICON = <CommandLineIcon className="w-4 h-4" />;
