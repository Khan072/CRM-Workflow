const Lead = require('../models/Lead');

/**
 * GET /api/analytics/summary — Aggregated lead analytics.
 */
async function getSummary(req, res, next) {
  try {
    const [byStage, byPriority, byChannel, total] = await Promise.all([
      Lead.aggregate([
        { $group: { _id: '$stage', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Lead.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Lead.aggregate([
        { $group: { _id: '$channel', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Lead.countDocuments(),
    ]);

    // Compute average lead score
    const scoreAgg = await Lead.aggregate([
      { $group: { _id: null, avgScore: { $avg: '$leadScore' } } },
    ]);
    const avgScore = scoreAgg.length > 0 ? Math.round(scoreAgg[0].avgScore) : 0;

    // Fill in missing stages/priorities/channels with 0
    const allStages = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];
    const allPriorities = ['low', 'medium', 'high'];
    const allChannels = ['whatsapp', 'instagram'];

    const stageMap = Object.fromEntries(byStage.map((s) => [s._id, s.count]));
    const priorityMap = Object.fromEntries(byPriority.map((p) => [p._id, p.count]));
    const channelMap = Object.fromEntries(byChannel.map((c) => [c._id, c.count]));

    res.json({
      success: true,
      data: {
        total,
        avgScore,
        byStage: allStages.map((s) => ({ stage: s, count: stageMap[s] || 0 })),
        byPriority: allPriorities.map((p) => ({ priority: p, count: priorityMap[p] || 0 })),
        byChannel: allChannels.map((c) => ({ channel: c, count: channelMap[c] || 0 })),
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getSummary };
