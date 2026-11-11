/**
 * Tests for lead scoring service — the most critical business logic.
 */

const { calculateScore, scoreToPriority, scoreToStage } = require('../services/leadScoringService');

describe('Lead Scoring Service', () => {
  describe('calculateScore', () => {
    test('scores a high-quality lead with product, quantity, urgency, and contact', () => {
      const analysis = {
        intent: 'purchase_request',
        products: ['Custom T-Shirts'],
        quantity: '500',
        urgency: 'high',
      };
      const { score, breakdown } = calculateScore(analysis, 'I need 500 custom T-shirts for my event next month, please share the price.', 'whatsapp', true);
      
      expect(score).toBeGreaterThanOrEqual(70);
      expect(breakdown.hasProduct).toBe(20);
      expect(breakdown.hasQuantity).toBe(15);
      expect(breakdown.hasTimeline).toBe(15);
      expect(breakdown.intentSignal).toBe(20);
      expect(breakdown.hasContactInfo).toBe(10);
    });

    test('scores a greeting-only message as low', () => {
      const analysis = {
        intent: 'greeting',
        products: [],
        quantity: '',
        urgency: 'low',
      };
      const { score } = calculateScore(analysis, 'Hi', 'instagram', false);
      
      expect(score).toBeLessThanOrEqual(15);
    });

    test('scores a support message lower than a purchase inquiry', () => {
      const support = {
        intent: 'support',
        products: ['Custom Mugs'],
        quantity: '200',
        urgency: 'high',
      };
      const purchase = {
        intent: 'purchase_request',
        products: ['Custom Mugs'],
        quantity: '200',
        urgency: 'high',
      };
      const message = 'I need 200 mugs with issues fixed.';

      const { score: supportScore } = calculateScore(support, message, 'whatsapp', true);
      const { score: purchaseScore } = calculateScore(purchase, message, 'whatsapp', true);
      
      expect(purchaseScore).toBeGreaterThan(supportScore);
    });

    test('WhatsApp channel scores higher than Instagram', () => {
      const analysis = {
        intent: 'product_inquiry',
        products: ['Bags'],
        quantity: '',
        urgency: 'low',
      };
      const message = 'I am interested in your bags.';

      const { breakdown: waBreakdown } = calculateScore(analysis, message, 'whatsapp', false);
      const { breakdown: igBreakdown } = calculateScore(analysis, message, 'instagram', false);
      
      expect(waBreakdown.channelQuality).toBeGreaterThan(igBreakdown.channelQuality);
    });

    test('Website and Facebook channels have appropriate quality scores', () => {
      const analysis = {
        intent: 'product_inquiry',
        products: ['Bags'],
        quantity: '',
        urgency: 'low',
      };
      const message = 'I am interested in your bags.';

      const { breakdown: webBreakdown } = calculateScore(analysis, message, 'website', false);
      const { breakdown: fbBreakdown } = calculateScore(analysis, message, 'facebook', false);
      const { breakdown: igBreakdown } = calculateScore(analysis, message, 'instagram', false);
      
      expect(webBreakdown.channelQuality).toBe(9);
      expect(fbBreakdown.channelQuality).toBe(7);
      expect(igBreakdown.channelQuality).toBe(7);
      expect(webBreakdown.channelQuality).toBeGreaterThan(fbBreakdown.channelQuality);
    });

    test('medium urgency scores less than high urgency', () => {
      const high = { intent: 'purchase_request', products: ['T-Shirts'], quantity: '100', urgency: 'high' };
      const medium = { intent: 'purchase_request', products: ['T-Shirts'], quantity: '100', urgency: 'medium' };
      const msg = 'I need 100 T-shirts.';

      const { breakdown: highBreakdown } = calculateScore(high, msg, 'whatsapp', false);
      const { breakdown: medBreakdown } = calculateScore(medium, msg, 'whatsapp', false);
      
      expect(highBreakdown.hasTimeline).toBeGreaterThan(medBreakdown.hasTimeline);
    });
  });

  describe('scoreToPriority', () => {
    test('maps score 0-30 to low', () => {
      expect(scoreToPriority(0)).toBe('low');
      expect(scoreToPriority(15)).toBe('low');
      expect(scoreToPriority(30)).toBe('low');
    });

    test('maps score 31-60 to medium', () => {
      expect(scoreToPriority(31)).toBe('medium');
      expect(scoreToPriority(45)).toBe('medium');
      expect(scoreToPriority(60)).toBe('medium');
    });

    test('maps score 61-100 to high', () => {
      expect(scoreToPriority(61)).toBe('high');
      expect(scoreToPriority(80)).toBe('high');
      expect(scoreToPriority(100)).toBe('high');
    });
  });

  describe('scoreToStage', () => {
    test('greeting intent is always "new"', () => {
      expect(scoreToStage(0, 'greeting')).toBe('new');
      expect(scoreToStage(100, 'greeting')).toBe('new');
    });

    test('support intent is always "new"', () => {
      expect(scoreToStage(80, 'support')).toBe('new');
    });

    test('purchase intent with high score maps to "proposal"', () => {
      expect(scoreToStage(60, 'purchase_request')).toBe('proposal');
    });

    test('product inquiry with moderate score maps to "contacted"', () => {
      expect(scoreToStage(35, 'product_inquiry')).toBe('contacted');
    });

    test('high score non-purchase maps to "qualified"', () => {
      expect(scoreToStage(65, 'pricing_inquiry')).toBe('qualified');
    });
  });
});
