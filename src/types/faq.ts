// Dutch text plus an optional English translation (null = not translated,
// show the Dutch) - same split as the privacy policy.

export type FlowTone = 'default' | 'good' | 'bad' | 'wait';

export interface FlowStep {
    icon: string | null;
    title: string;
    title_en: string | null;
    detail: string | null;
    detail_en: string | null;
    tone: FlowTone;
    // An app path (/dashboard/rooms) or a web address - see openLink().
    url: string | null;
    // Empty for a plain step; the options of a decision otherwise.
    branches: { label: string; label_en: string | null; steps: FlowStep[] }[];
}

export interface FaqQuestion {
    id: number;
    question: string;
    question_en: string | null;
    // HTML, rendered with sanitizeHtml().
    answer: string;
    answer_en: string | null;
}

export interface FaqCategory {
    id: number;
    title: string;
    title_en: string | null;
    icon: string | null;
    flowchart: FlowStep[] | null;
    questions: FaqQuestion[];
}
