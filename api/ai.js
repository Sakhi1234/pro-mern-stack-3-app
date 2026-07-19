function extractJsonObject(text) {
  if (!text || typeof text !== 'string') return null;
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

function trimText(text, limit) {
  const value = typeof text === 'string' ? text.trim() : '';
  if (!value) return '';
  if (value.length <= limit) return value;
  return `${value.slice(0, Math.max(0, limit - 1)).trimEnd()}…`;
}

function normalizeSummary(rawSummary) {
  return {
    summary: trimText(rawSummary?.summary, 500) || '',
    highlights: Array.isArray(rawSummary?.highlights)
      ? rawSummary.highlights.map((item) => trimText(item, 140)).filter(Boolean).slice(0, 5)
      : [],
    nextSteps: Array.isArray(rawSummary?.nextSteps)
      ? rawSummary.nextSteps.map((item) => trimText(item, 140)).filter(Boolean).slice(0, 5)
      : [],
  };
}

function buildIssueContext(issue) {
  const comments = Array.isArray(issue?.comments) ? issue.comments : [];
  const recentComments = comments.slice(-12).map((comment) => ({
    author: comment.authorName || comment.authorEmail || 'Anonymous',
    text: trimText(comment.text, 400),
    created: comment.created || null,
  }));

  return {
    title: trimText(issue?.title, 120) || 'Untitled issue',
    status: issue?.status || 'New',
    owner: trimText(issue?.owner, 80) || 'Unassigned',
    effort: Number.isFinite(issue?.effort) ? issue.effort : null,
    due: issue?.due || null,
    description: trimText(issue?.description, 1200),
    commentCount: comments.length,
    comments: recentComments,
  };
}

function buildFallbackSummary(issue) {
  const context = buildIssueContext(issue);
  const summaryParts = [
    `"${context.title}" is currently ${context.status.toLowerCase()}.`,
    context.owner !== 'Unassigned' ? `It is assigned to ${context.owner}.` : 'It is not assigned yet.',
    context.effort != null ? `The estimated effort is ${context.effort}.` : null,
    context.due ? `The due date is ${new Date(context.due).toLocaleDateString('en-US')}.` : null,
    context.description
      ? `The description says: ${trimText(context.description, 220)}.`
      : 'No description has been added yet.',
    context.commentCount
      ? `${context.commentCount} comment${context.commentCount === 1 ? '' : 's'} are attached.`
      : 'No comments have been added yet.',
  ].filter(Boolean);

  const highlights = [];
  if (context.description) highlights.push(trimText(context.description, 140));
  if (context.comments.length) {
    highlights.push(`Latest comment by ${context.comments[context.comments.length - 1].author}`);
  }

  const nextSteps = [];
  if (context.status !== 'Closed') nextSteps.push('Confirm the next action owner and timeline.');
  if (!context.comments.length) nextSteps.push('Add a comment to capture the latest progress or blocker.');

  return normalizeSummary({
    summary: summaryParts.join(' '),
    highlights,
    nextSteps,
  });
}

async function summarizeIssueWithComments(issue) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
  const context = buildIssueContext(issue);

  if (!apiKey) {
    return {
      aiSummary: buildFallbackSummary(issue),
      aiMeta: { source: 'fallback', model: null },
    };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        {
          role: 'system',
          content: 'You summarize issue tracker items and their comments into concise structured JSON.',
        },
        {
          role: 'user',
          content: [
            'Return only JSON with keys: summary, highlights, nextSteps.',
            'Rules:',
            '- summary: one concise paragraph, 2 to 4 sentences max',
            '- highlights: array of up to 5 short bullets capturing important facts, blockers, decisions, or themes',
            '- nextSteps: array of up to 5 short bullets with practical follow-up actions',
            '- keep the wording neutral and focused on the issue plus comments',
            '',
            'Issue context:',
            JSON.stringify(context, null, 2),
          ].join('\n'),
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq request failed: ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content || '';
  const parsed = extractJsonObject(content);

  return {
    aiSummary: normalizeSummary(parsed || buildFallbackSummary(issue)),
    aiMeta: { source: 'groq', model },
  };
}

module.exports = {
  summarizeIssueWithComments,
};
