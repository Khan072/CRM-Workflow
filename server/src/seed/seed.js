/**
 * Seed script — Populates the database with sample leads.
 * Run: npm run seed (from server directory)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Lead = require('../models/Lead');
const sampleMessages = require('./sampleMessages');
const { analyzeMessage } = require('../services/mockAiService');
const { generateReply } = require('../services/mockAiService');
const { calculateScore, scoreToPriority, scoreToStage } = require('../services/leadScoringService');

async function seed() {
  try {
    await connectDB();
    console.log('Clearing existing leads...');
    await Lead.deleteMany({});

    console.log(`Seeding ${sampleMessages.length} sample leads...`);

    for (const msg of sampleMessages) {
      // Use mock AI for deterministic seeding (no API key needed)
      const analysis = analyzeMessage(msg.messageText);
      analysis.suggestedReply = generateReply(analysis, msg.customerName);

      const { score, breakdown } = calculateScore(analysis, msg.messageText, msg.channel, !!msg.customerContact);
      const priority = scoreToPriority(score);
      const stage = scoreToStage(score, analysis.intent);

      const lead = new Lead({
        customerName: msg.customerName,
        customerContact: msg.customerContact,
        channel: msg.channel,
        stage,
        priority,
        leadScore: score,
        scoreBreakdown: breakdown,
        aiAnalysis: analysis,
        originalMessage: msg.messageText,
        activities: [
          {
            type: 'lead_created',
            content: { channel: msg.channel },
            actor: 'system',
            timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          },
          {
            type: 'message_received',
            content: { text: msg.messageText, channel: msg.channel },
            actor: 'customer',
          },
          {
            type: 'ai_analysis',
            content: { ...analysis, provider: 'mock' },
            actor: 'system',
          },
        ],
      });

      await lead.save();
      console.log(`  ✓ ${msg.customerName} (${msg.description})`);
    }

    console.log('\nSeeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
