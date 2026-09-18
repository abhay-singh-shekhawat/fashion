import { useEffect, useRef, useState } from 'react';
import { useChatStream } from '../hooks/useChatStream';
import PhotoSourceButtons from '../components/PhotoSourceButtons';
import Pill from '../components/Pill';
import ResponsiveSheet from '../components/ResponsiveSheet';
import Reveal from '../components/Reveal';
import { ImageIcon, SendIcon, SparkleIcon } from '../components/Icons';

const PROMPTS = [
  'What should I wear tonight?',
  'Rate my closet for winter',
  'Find me a jacket under $80',
];

export default function Stylist() {
  const { messages, isSending, isTyping, send } = useChatStream();
  const [text, setText] = useState('');
  const [file, setFile] = useState(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isTyping]);

  const submit = async (event) => {
    event?.preventDefault();
    if ((!text.trim() && !file) || isSending) return;
    const outgoing = text;
    const outgoingFile = file;
    setText('');
    setFile(null);
    await send(outgoing, outgoingFile);
  };

  return (
    <div className="flex flex-col">
      {/* pb-44 clears the fixed composer; the desktop figure is smaller because
          the Tabbar is not there taking up room. */}
      <div className="px-4 pt-2 pb-44 md:px-6 lg:px-8 lg:pt-6 lg:pb-32">
        <div className="lg:mx-auto lg:max-w-3xl">
          <div className="space-y-3">
            {!messages.length ? (
              <Reveal className="flex flex-col items-center gap-4 py-12 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-brand-primary/15 text-brand-primary ring-1 ring-brand-primary/25">
                  <SparkleIcon className="h-7 w-7" />
                </span>
                <div>
                  <p className="font-display text-lg font-bold tracking-tight">Your AI stylist</p>
                  <p className="mt-1 max-w-xs text-sm text-white/45 text-pretty">
                    Ask about outfits, get a second opinion, or search for pieces.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => send(prompt)}
                      className="glass press hover-lift px-3.5 py-2 text-xs font-semibold text-white/70"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </Reveal>
            ) : null}

            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex animate-fade-up ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] space-y-2 rounded-3xl px-4 py-3 lg:max-w-[70%] ${
                      isUser
                        ? 'rounded-br-lg bg-brand-primary/20 ring-1 ring-brand-primary/30'
                        : message.error
                          ? 'rounded-bl-lg bg-brand-error/10 ring-1 ring-brand-error/25'
                          : 'rounded-bl-lg bg-white/[0.05] ring-1 ring-white/10 backdrop-blur-md'
                    }`}
                  >
                    {message.image ? (
                      <img
                        src={message.image}
                        alt="attachment"
                        className="max-h-48 w-full rounded-2xl object-cover"
                      />
                    ) : null}
                    {message.content ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-white/85">
                        {message.content}
                      </p>
                    ) : null}
                    {message.streaming && !message.content ? <TypingDots /> : null}
                  </div>
                </div>
              );
            })}

            {isTyping && messages.at(-1)?.content ? (
              <div className="flex justify-start">
                <div className="rounded-3xl rounded-bl-lg bg-white/[0.05] px-4 py-3 ring-1 ring-white/10">
                  <TypingDots />
                </div>
              </div>
            ) : null}

            <div ref={endRef} />
          </div>
        </div>
      </div>

      {/* Composer sits above the fixed Tabbar on phones; from lg it drops to the
          bottom edge and clears the side rail to line up with the content. */}
      <div className="fixed inset-x-0 bottom-safe-24 z-20 border-t border-white/10 bg-ink-950/85 px-3 py-3 backdrop-blur-xl lg:right-0 lg:bottom-0 lg:left-[88px] lg:px-8">
        <div className="lg:mx-auto lg:max-w-3xl">
          {file ? (
            <div className="mb-2 flex items-center gap-2">
              <Pill tone="cyan">
                <ImageIcon className="h-3 w-3" /> {file.name.slice(0, 24)}
              </Pill>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs font-bold text-white/40"
              >
                remove
              </button>
            </div>
          ) : null}

          <form onSubmit={submit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAttachOpen(true)}
              aria-label="Attach a photo"
              className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/60 ring-1 ring-white/10"
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Ask your stylist…"
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/25 focus:border-brand-primary/60"
            />

            <button
              type="submit"
              disabled={(!text.trim() && !file) || isSending}
              aria-label="Send"
              className="press grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-primary text-white disabled:opacity-40"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </form>
        </div>
      </div>

      <ResponsiveSheet
        opened={attachOpen}
        onBackdropClick={() => setAttachOpen(false)}
        className="pb-safe"
      >
        <div className="space-y-3 p-5">
          <p className="font-display text-lg font-bold tracking-tight">Add a photo</p>
          <PhotoSourceButtons
            onPick={(picked) => {
              setFile(picked);
              setAttachOpen(false);
            }}
            onError={() => setAttachOpen(false)}
          />
        </div>
      </ResponsiveSheet>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/50"
          style={{ animationDelay: `${index * 120}ms` }}
        />
      ))}
    </span>
  );
}
