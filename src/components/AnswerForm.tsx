import React, { useState } from 'react';
import { Send, CheckCircle2, AlertCircle } from 'lucide-react';

interface AnswerFormProps {
  hasAnswered: boolean;
  onSubmit: (text: string) => Promise<void> | void;
}

export function AnswerForm({ hasAnswered, onSubmit }: AnswerFormProps) {
  const [answerText, setAnswerText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = answerText.trim();
    if (!clean) {
      setStatusMsg({ text: 'Please write your response first.', isError: true });
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMsg(null);
      await onSubmit(clean);
      setAnswerText('');
      setStatusMsg({ text: 'Answer posted to the live community feed!', isError: false });
    } catch (err: any) {
      setStatusMsg({ text: err?.message || 'Could not post answer', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-black tracking-wider text-neutral-300 uppercase flex items-center gap-1.5">
          <span>✍️ YOUR ANSWER</span>
        </h3>
        <span className="text-[11px] text-neutral-500 font-mono">
          {answerText.length}/500
        </span>
      </div>

      {hasAnswered ? (
        <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center">
          <p className="text-emerald-400 font-bold text-sm mb-1 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> You have submitted your answer to this challenge!
          </p>
          <p className="text-xs text-neutral-500">
            Check the live feed below to watch community reactions and climb the leaderboard.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            rows={3}
            maxLength={500}
            disabled={hasAnswered || isSubmitting}
            placeholder="Drop your most unhinged, confident, or brilliant Sigma response here..."
            value={answerText}
            onChange={(e) => setAnswerText(e.target.value)}
            className="w-full bg-neutral-950 text-white border border-neutral-800 rounded-xl p-3.5 text-sm focus:border-neutral-500 outline-none resize-none transition"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-500">
              ⚡ 1 answer per member • Community votes grant score
            </span>

            <button
              type="submit"
              disabled={!answerText.trim() || isSubmitting}
              className="px-5 py-2.5 bg-white hover:bg-neutral-200 text-black font-extrabold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" /> POST ANSWER
            </button>
          </div>

          {statusMsg && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border ${
                statusMsg.isError
                  ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
              }`}
            >
              {statusMsg.isError ? (
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
