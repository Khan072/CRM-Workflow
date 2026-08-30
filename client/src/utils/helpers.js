/**
 * Utility helpers for formatting and display.
 */

export function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function timeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function formatDate(dateString) {
  return new Date(dateString).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

export const STAGE_ORDER = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export const STAGE_LABELS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
};

export const INTENT_LABELS = {
  product_inquiry: 'Product Inquiry',
  pricing_inquiry: 'Pricing Inquiry',
  purchase_request: 'Purchase Request',
  support: 'Support',
  follow_up: 'Follow-up',
  greeting: 'Greeting',
  general_inquiry: 'General Inquiry',
  unknown: 'Unknown',
};

export const SCORE_FACTOR_LABELS = {
  hasProduct: 'Product Mentioned',
  hasQuantity: 'Quantity Specified',
  hasTimeline: 'Timeline/Urgency',
  intentSignal: 'Purchase Intent',
  hasContactInfo: 'Contact Info',
  messageRichness: 'Message Detail',
  channelQuality: 'Channel Quality',
};

export const SCORE_FACTOR_MAX = {
  hasProduct: 20,
  hasQuantity: 15,
  hasTimeline: 15,
  intentSignal: 20,
  hasContactInfo: 10,
  messageRichness: 10,
  channelQuality: 10,
};
