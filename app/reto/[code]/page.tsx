import ChallengeClient from './ChallengeClient';

export default function ChallengePage({ params }: { params: { code: string } }) {
  return <ChallengeClient code={params.code.toUpperCase()} />;
}
