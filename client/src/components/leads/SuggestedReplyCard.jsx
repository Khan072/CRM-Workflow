import { useState } from 'react';
import { Send, Copy, Check, Reply } from 'lucide-react';

export default function SuggestedReplyCard({ suggestedReply, onSend }) {
  const [replyText, setReplyText] = useState(suggestedReply || '');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(replyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = replyText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    await onSend(replyText);
    setSending(false);
  };

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">
          <Reply size={18} className="card-title-icon" />
          Suggested Reply
        </span>
        <span className="badge badge-ai">
          AI Generated
        </span>
      </div>

      <div className="suggested-reply">
        <textarea
          className="suggested-reply-text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          placeholder="AI-generated reply will appear here..."
          id="suggested-reply-textarea"
        />

        <div className="suggested-reply-actions">
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleCopy}
            id="copy-reply-btn"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSend}
            disabled={sending || !replyText.trim()}
            id="send-reply-btn"
          >
            {sending ? (
              <>
                <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={14} />
                Mark as Sent
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
