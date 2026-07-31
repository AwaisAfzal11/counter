import { memo } from 'react';

type LearningCard = {
  title: string;
  idea: string;
  usage: string;
  benefit: string;
};

const MENTAL_MODELS: readonly LearningCard[] = [
  {
    title: 'First Principles',
    idea: 'Reduce a problem to facts you can defend, then rebuild from those facts.',
    usage: 'List assumptions, challenge each one, and design from what remains true.',
    benefit: 'Reveals simpler paths that convention and inherited rules tend to hide.',
  },
  {
    title: 'Inversion',
    idea: 'Solve backward by asking what would guarantee failure.',
    usage: 'Name the worst outcome, list its causes, then build safeguards against them.',
    benefit: 'Exposes preventable errors before you spend energy chasing the ideal.',
  },
  {
    title: 'Second-Order Thinking',
    idea: 'Every decision has consequences beyond its immediate result.',
    usage: 'Ask “and then what?” at least twice before committing to a high-impact choice.',
    benefit: 'Reduces short-term wins that quietly create larger long-term costs.',
  },
  {
    title: 'Opportunity Cost',
    idea: 'Choosing one path means giving up the best available alternative.',
    usage: 'Compare a choice with the strongest thing the same time or money could buy.',
    benefit: 'Makes priorities honest and protects scarce attention from low-value work.',
  },
  {
    title: 'Circle of Competence',
    idea: 'Good judgment depends on knowing the boundaries of what you understand.',
    usage: 'Mark what you know, what you assume, and where an expert or experiment is needed.',
    benefit: 'Improves confidence calibration and lowers avoidable, ego-driven mistakes.',
  },
  {
    title: 'Probabilistic Thinking',
    idea: 'Most important outcomes are uncertain, not simply true or false.',
    usage: 'Assign rough odds, identify what would change them, and update with new evidence.',
    benefit: 'Produces flexible decisions without pretending uncertainty has disappeared.',
  },
  {
    title: 'Systems Thinking',
    idea: 'Behavior comes from relationships, feedback loops, delays, and constraints.',
    usage: 'Map inputs, outputs, reinforcing loops, balancing loops, and delayed effects.',
    benefit: 'Helps fix root structures instead of repeatedly treating visible symptoms.',
  },
  {
    title: 'Pareto Principle',
    idea: 'A minority of inputs often produces a majority of useful results.',
    usage: 'Rank activities by actual impact and strengthen the small set doing most of the work.',
    benefit: 'Concentrates effort where it compounds instead of spreading it evenly.',
  },
  {
    title: 'Margin of Safety',
    idea: 'Plans need room for error because estimates and conditions are imperfect.',
    usage: 'Add buffers to deadlines, budgets, capacity, and critical assumptions.',
    benefit: 'Turns ordinary surprises into manageable variation rather than emergencies.',
  },
  {
    title: 'OODA Loop',
    idea: 'Speed comes from repeatedly observing, orienting, deciding, and acting.',
    usage: 'Shorten the feedback loop: take a small action, inspect reality, then adjust.',
    benefit: 'Builds adaptability and prevents plans from drifting far from current conditions.',
  },
  {
    title: 'Map vs. Territory',
    idea: 'Every model is a useful simplification, never reality itself.',
    usage: 'Check dashboards, stories, and forecasts against direct observation and fresh data.',
    benefit: 'Prevents elegant explanations from becoming more trusted than the evidence.',
  },
  {
    title: 'Reversible Decisions',
    idea: 'Not every choice deserves the same amount of analysis.',
    usage: 'Move quickly on two-way-door decisions; slow down for costly, irreversible ones.',
    benefit: 'Preserves rigor where it matters without turning every choice into a bottleneck.',
  },
];

const EMOTIONAL_INTELLIGENCE: readonly LearningCard[] = [
  {
    title: 'Name the Emotion',
    idea: 'Precise labels create distance between a feeling and the action it urges.',
    usage: 'Replace “bad” with a closer word: disappointed, threatened, lonely, or overloaded.',
    benefit: 'Makes regulation easier and reveals what the emotion is trying to protect.',
  },
  {
    title: 'Pause Before Response',
    idea: 'A short pause interrupts the automatic path from trigger to reaction.',
    usage: 'Take one slow breath, relax the jaw, and decide what outcome you want next.',
    benefit: 'Protects relationships and keeps temporary intensity from choosing your words.',
  },
  {
    title: 'Read the Need',
    idea: 'Strong emotions often point toward an unmet need, value, or boundary.',
    usage: 'Ask what matters underneath the feeling: respect, safety, autonomy, rest, or clarity.',
    benefit: 'Moves you from blame toward a request that can actually be answered.',
  },
  {
    title: 'Perspective Taking',
    idea: 'Understanding another view does not require agreeing with it.',
    usage: 'State their likely facts, pressures, and fears in language they would recognize.',
    benefit: 'Reduces defensive conflict and uncovers options hidden by a single viewpoint.',
  },
  {
    title: 'Validate Before Solving',
    idea: 'People hear solutions better after they feel accurately understood.',
    usage: 'Reflect the experience first, then ask whether they want listening or problem-solving.',
    benefit: 'Builds trust and prevents helpful intent from landing as dismissal.',
  },
  {
    title: 'Separate Story from Fact',
    idea: 'The mind adds interpretations to observable events at extraordinary speed.',
    usage: 'Write two columns: what a camera recorded and the meaning you assigned to it.',
    benefit: 'Reduces needless certainty and makes difficult conversations more grounded.',
  },
  {
    title: 'Boundary with Warmth',
    idea: 'A clear no can protect connection better than a resentful yes.',
    usage: 'Acknowledge the person, state the limit directly, and offer what you can do.',
    benefit: 'Preserves energy while reducing ambiguity, guilt, and delayed resentment.',
  },
  {
    title: 'Repair Quickly',
    idea: 'Healthy relationships are defined by repair, not by never having friction.',
    usage: 'Name your impact without excuses, apologize specifically, and change the next action.',
    benefit: 'Restores safety and turns mistakes into evidence that trust can recover.',
  },
  {
    title: 'Emotional Granularity',
    idea: 'A larger emotional vocabulary improves the accuracy of self-understanding.',
    usage: 'Notice intensity, body sensation, urge, and context before choosing a precise label.',
    benefit: 'Supports better coping because different feelings call for different responses.',
  },
  {
    title: 'Empathic Curiosity',
    idea: 'Curiosity keeps uncertainty open when judgment wants to close it.',
    usage: 'Ask one genuine question before explaining, defending, or advising.',
    benefit: 'Surfaces missing context and signals respect during tense moments.',
  },
  {
    title: 'Regulate the Body',
    idea: 'Emotional regulation is physical as well as cognitive.',
    usage: 'Slow the exhale, soften muscle tension, move, hydrate, or step into quieter space.',
    benefit: 'Lowers arousal so reasoning and communication can come back online.',
  },
  {
    title: 'Values-Led Response',
    idea: 'Feelings provide information; values decide behavior.',
    usage: 'Ask which response your calm, future self would respect—even while the feeling remains.',
    benefit: 'Creates consistency between who you intend to be and how you act under pressure.',
  },
];

function rotate<T>(items: readonly T[], offset: number): T[] {
  const start = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(start), ...items.slice(0, start)];
}

function CardCollection({
  label,
  cards,
  hourKey,
}: {
  label: string;
  cards: readonly LearningCard[];
  hourKey: number;
}) {
  return (
    <section aria-label={label}>
      <div className="mb-3 flex items-end justify-between gap-3">
        <h3 className="label">{label}</h3>
        <span className="micro text-bone-dim">{cards.length} field cards</span>
      </div>
      <div className="learning-scroll" tabIndex={0}>
        {rotate(cards, hourKey).map((card, index) => (
          <article className="learning-card" key={card.title}>
            <div className="flex items-start justify-between gap-4">
              <h4 className="text-[17px] font-semibold text-bone">{card.title}</h4>
              <span className="micro shrink-0 text-bone-dim">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-bone-dim">{card.idea}</p>
            <dl className="mt-4 space-y-3">
              <div>
                <dt className="label mb-1.5" style={{ color: 'var(--color-ember)' }}>
                  Use it
                </dt>
                <dd className="m-0 text-[13px] leading-relaxed text-bone">{card.usage}</dd>
              </div>
              <div>
                <dt className="label mb-1.5">Benefit</dt>
                <dd className="m-0 text-[13px] leading-relaxed text-bone">{card.benefit}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export const LearningLibrary = memo(function LearningLibrary({ now }: { now: Date }) {
  const hourKey = Math.floor(now.getTime() / 3_600_000);

  return (
    <section className="learning-library" aria-labelledby="learning-library-title">
      <div className="mb-6">
        <p className="label mb-3" style={{ color: 'var(--color-ember)' }}>
          Hourly Intelligence
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="learning-library-title" className="m-0 text-[26px] font-semibold text-bone">
              The Thinking Library
            </h2>
            <p className="mt-2 max-w-[640px] text-[13px] leading-relaxed text-bone-dim">
              Practical models for clearer decisions and stronger relationships. Card order
              rotates every hour; each collection is independently scrollable.
            </p>
          </div>
          <span className="micro text-bone-dim">Refreshes at the top of the hour</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CardCollection label="Mental Models" cards={MENTAL_MODELS} hourKey={hourKey} />
        <CardCollection
          label="Emotional Intelligence"
          cards={EMOTIONAL_INTELLIGENCE}
          hourKey={hourKey + 5}
        />
      </div>
    </section>
  );
});
