import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronRight, ChevronDown, Code2 } from 'lucide-react';

export const LICENSING_BASE = 'https://sourceplus.onrender.com';
export const AUTH_BASE = 'https://sourceplus.onrender.com/auth';

export const CodeBlock: React.FC<{ children: string; language?: string }> = ({ children, language = 'json' }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">{language}</span>
                <button
                    onClick={handleCopy}
                    className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                    title="Copy code"
                >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
            </div>
            <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-slate-700 dark:text-slate-300">
                <code>{children}</code>
            </pre>
        </div>
    );
};

export const Endpoint: React.FC<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    title: string;
    description: string;
    payload?: string;
    response?: string;
    headers?: string;
    queryParams?: string;
    notes?: string[];
    isRtl: boolean;
}> = ({ method, url, title, description, payload, response, headers, queryParams, notes, isRtl }) => {
    const [expanded, setExpanded] = useState(false);

    const methodColors = {
        GET: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border-sky-200 dark:border-sky-800',
        POST: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
        PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        DELETE: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200 dark:border-rose-800',
        PATCH: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    };

    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm transition-all duration-200 hover:shadow-md">
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
                <div className="flex items-center gap-4 overflow-hidden">
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-md text-[10px] font-bold border ${methodColors[method]}`}>
                        {method}
                    </span>
                    <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-200 truncate">
                        {url}
                    </code>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{title}</span>
                    {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className={isRtl ? "rotate-180 text-slate-400" : "text-slate-400"} />}
                </div>
            </button>

            {expanded && (
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 space-y-6 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        {description}
                    </p>

                    {headers && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Terminal size={12} /> Headers
                            </h4>
                            <CodeBlock language="http">{headers}</CodeBlock>
                        </div>
                    )}

                    {queryParams && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Terminal size={12} /> Query Parameters
                            </h4>
                            <CodeBlock language="text">{queryParams}</CodeBlock>
                        </div>
                    )}

                    {payload && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Terminal size={12} /> Request Body
                            </h4>
                            <CodeBlock>{payload}</CodeBlock>
                        </div>
                    )}

                    {response && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <Code2 size={12} /> Response
                            </h4>
                            <CodeBlock>{response}</CodeBlock>
                        </div>
                    )}

                    {notes && notes.length > 0 && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30 rounded-xl">
                            <h4 className="text-xs font-bold text-blue-900 dark:text-blue-100 uppercase tracking-wider mb-2">
                                ملاحظات مهمة
                            </h4>
                            <ul className="space-y-1.5 text-sm text-blue-800 dark:text-blue-200">
                                {notes.map((note, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-0.5">•</span>
                                        <span>{note}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const SectionHeader: React.FC<{ title: string; icon: any; description: string }> = ({ title, icon: Icon, description }) => (
    <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400">
                <Icon size={20} />
            </div>
            {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 ml-11">
            {description}
        </p>
    </div>
);
