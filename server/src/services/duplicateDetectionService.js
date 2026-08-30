/**
 * Duplicate Detection Service
 *
 * Prevents creating duplicate leads for the same customer.
 * Strategy:
 * 1. Exact match on customerContact (phone/email) — strong signal
 * 2. Name + channel match — weaker signal, flagged for human review
 */

const Lead = require('../models/Lead');

/**
 * Find potential duplicate leads.
 * Returns { exactMatch: Lead|null, possibleMatches: Lead[] }
 */
async function findDuplicates(customerContact, customerName, channel) {
  const result = {
    exactMatch: null,
    possibleMatches: [],
  };

  // 1. Exact contact match (strongest signal)
  if (customerContact && customerContact.trim() !== '') {
    const contactMatch = await Lead.findOne({
      customerContact: customerContact.trim(),
    }).sort({ createdAt: -1 });

    if (contactMatch) {
      result.exactMatch = contactMatch;
      return result; // No need to check further
    }
  }

  // 2. Fuzzy name + channel match
  if (customerName && customerName.trim() !== '') {
    const nameRegex = new RegExp(customerName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const nameMatches = await Lead.find({
      customerName: nameRegex,
      channel: channel,
    })
      .sort({ createdAt: -1 })
      .limit(5);

    result.possibleMatches = nameMatches;
  }

  return result;
}

module.exports = { findDuplicates };
