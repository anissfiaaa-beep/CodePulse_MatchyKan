import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useChatWithCareerCoach } from "@workspace/api-client-react";
import {
  Bot,
  FileText,
  MessageCircle,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from "lucide-react";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

const welcomeMessage: ChatTurn = {
  role: "assistant",
  content: "Hi, I’m your MatchyKan career coach. Ask me about career options, skills to build, or how to take your next step. You can also attach a CV for more personalised guidance.",
};

const suggestedPrompts = [
  "What strengths stand out in my CV?",
  "Which career paths could fit me?",
  "Can we talk about what I enjoy doing?",
];

function getErrorMessage(error: unknown) {
  const data = (error as { data?: { error?: unknown } } | undefined)?.data;
  return typeof data?.error === "string"
    ? data.error
    : "The AI coach could not respond just now. Please try again.";
}

type CareerChatPageProps = {
  initialOpen?: boolean;
  onClose?: () => void;
};

export default function CareerChatPage({ initialOpen = false, onClose }: CareerChatPageProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [messages, setMessages] = useState<ChatTurn[]>([welcomeMessage]);
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const chat = useChatWithCareerCoach();

  useEffect(() => {
    if (initialOpen) setIsOpen(true);
  }, [initialOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [isOpen, messages, chat.isPending]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") closeChat();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const closeChat = () => {
    setIsOpen(false);
    onClose?.();
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  const handleFile = (selected: File | undefined) => {
    setErrorMessage("");
    if (!selected) {
      setFile(null);
      return;
    }
    if (!/\.(pdf|docx|txt)$/i.test(selected.name) || selected.size > 5 * 1024 * 1024) {
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setErrorMessage("Choose a PDF, DOCX, or TXT file no larger than 5 MB.");
      return;
    }
    setFile(selected);
  };

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (chat.isPending || !message) return;
    if (!consent) {
      setErrorMessage("Please agree before sending your message to the AI coach.");
      return;
    }
    setErrorMessage("");
    const history = messages
      .filter((_, index) => index > 0)
      .slice(-12);
    const data = {
      message,
      history: JSON.stringify(history),
      consent: "true" as const,
      ...(file ? { cv: file } : {}),
    };
    chat.mutate(
      { data },
      {
        onSuccess: ({ reply }) => {
          setMessages((current) => [
            ...current,
            { role: "user", content: message },
            { role: "assistant", content: reply },
          ]);
          setDraft("");
        },
        onError: (error) => setErrorMessage(getErrorMessage(error)),
      },
    );
  };

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const startNewChat = () => {
    if (chat.isPending) return;
    setMessages([welcomeMessage]);
    setDraft("");
    setErrorMessage("");
  };

  return (
    <div className="mk-chat-widget">
      {isOpen && (
        <section id="career-coach-chat-window" className="mk-chat-window" aria-label="AI career coach">
          <div className="mk-chat-panel">
            <header className="mk-chat-header">
              <div className="mk-chat-avatar"><Sparkles size={18} /></div>
              <div>
                <strong>MatchyKan career coach</strong>
                <span>Ready to help you explore</span>
              </div>
              <span className="mk-chat-status"><i /> AI coach</span>
              <button className="mk-chat-header-action" type="button" onClick={startNewChat} disabled={chat.isPending} aria-label="Start a new chat" title="New chat" data-testid="button-new-chat">
                <RotateCcw size={15} />
              </button>
              <button className="mk-chat-header-action" type="button" onClick={closeChat} aria-label="Close career coach" title="Close chat" data-testid="button-close-chat">
                <X size={17} />
              </button>
            </header>

            <div className="mk-chat-transcript" role="log" aria-live="polite" aria-relevant="additions text" data-testid="chat-transcript">
              {messages.map((message, index) => (
                <article className={`mk-chat-message ${message.role}`} key={`${message.role}-${index}`} data-testid={`chat-message-${index}`}>
                  {message.role === "assistant" && <div className="mk-chat-message-avatar"><Bot size={16} /></div>}
                  <div className="mk-chat-bubble">{message.content}</div>
                </article>
              ))}
              {chat.isPending && (
                <div className="mk-chat-message assistant" role="status" data-testid="status-chat-thinking">
                  <div className="mk-chat-message-avatar"><Bot size={16} /></div>
                  <div className="mk-chat-bubble mk-chat-thinking"><i /><i /><i /><span>Thinking through your question…</span></div>
                </div>
              )}
              {messages.length === 1 && (
                <div className="mk-chat-suggestions" aria-label="Suggested questions">
                  {suggestedPrompts.map((prompt) => (
                    <button key={prompt} type="button" className="mk-chat-suggestion" onClick={() => setDraft(prompt)} data-testid={`button-suggest-${suggestedPrompts.indexOf(prompt)}`}>
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="mk-chat-composer-wrap">
              {file && (
                <div className="mk-chat-file-chip" data-testid="text-chat-file">
                  <FileText size={15} />
                  <span>{file.name} <small>· {(file.size / 1024 / 1024).toFixed(2)} MB</small></span>
                  <button type="button" aria-label="Remove attached file" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} data-testid="button-remove-chat-file">
                    <X size={14} />
                  </button>
                </div>
              )}
              <form className="mk-chat-form" onSubmit={sendMessage}>
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={handleComposerKeyDown}
                  maxLength={2000}
                  rows={2}
                  aria-label="Message the career coach"
                  placeholder="Ask about a role, skill, or next step…"
                  data-testid="input-chat-message"
                />
                <div className="mk-chat-composer-actions">
                  <div className="mk-chat-tools">
                    <input
                      ref={fileInputRef}
                      id="career-chat-file"
                      type="file"
                      accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={(event) => handleFile(event.target.files?.[0])}
                      className="mk-chat-hidden-file"
                      data-testid="input-chat-file"
                    />
                    <button className="mk-chat-attach" type="button" onClick={() => fileInputRef.current?.click()} data-testid="button-attach-chat-file">
                      <Paperclip size={15} /> Attach CV
                    </button>
                    <span className="mk-chat-hint">PDF, DOCX, or TXT · up to 5 MB</span>
                  </div>
                  <button className="mk-btn mk-chat-send" type="submit" disabled={chat.isPending || !draft.trim()} data-testid="button-send-chat">
                    {chat.isPending ? <span className="mk-spinner" /> : <Send size={15} />}
                    {chat.isPending ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
              <label className="mk-chat-consent">
                <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} data-testid="checkbox-chat-consent" />
                <span>I agree to send my messages and, if attached, extracted CV text to Runpod’s AI model for a response. MatchyKan does not save the file, CV text, or chat history.</span>
              </label>
              <div className="mk-chat-footnote">AI suggestions are for exploration, not hiring decisions or job guarantees. Press Enter to send; Shift + Enter for a new line.</div>
              {errorMessage && <p className="mk-notice mk-chat-error" role="alert" data-testid="status-chat-error">{errorMessage}</p>}
            </div>
          </div>
        </section>
      )}
      <button
        ref={launcherRef}
        className="mk-chat-launcher"
        type="button"
        aria-label={isOpen ? "Close career coach" : "Open AI career coach"}
        aria-expanded={isOpen}
        aria-controls="career-coach-chat-window"
        onClick={() => isOpen ? closeChat() : setIsOpen(true)}
        data-testid="button-open-chat"
      >
        {isOpen ? <X size={21} /> : <><MessageCircle size={20} /><span>AI Coach</span></>}
      </button>
    </div>
  );
}
