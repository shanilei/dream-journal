import YourJourneyScreen, { type JourneyStats, type PatternCard } from "@/components/YourJourneyScreen";
import { listDreams } from "@/dreams-store";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

function computeStats(dreams: Awaited<ReturnType<typeof listDreams>>): JourneyStats {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const dreamsThisMonth = dreams.filter((d) => new Date(d.createdAt) >= startOfMonth).length;
  const dreamsLastMonth = dreams.filter((d) => {
    const date = new Date(d.createdAt);
    return date >= startOfLastMonth && date < startOfMonth;
  }).length;
  const dreamsThisWeek = dreams.filter((d) => new Date(d.createdAt) >= oneWeekAgo).length;
  const dreamsLastWeek = dreams.filter((d) => {
    const date = new Date(d.createdAt);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  }).length;

  // Most common symbol
  const symbolMap: Record<string, { count: number; image?: string }> = {};
  dreams.forEach((d) => {
    d.symbols?.forEach((s) => {
      if (!symbolMap[s]) symbolMap[s] = { count: 0, image: d.imageUrl || undefined };
      symbolMap[s].count++;
    });
  });
  const topSymbol = Object.entries(symbolMap).sort((a, b) => b[1].count - a[1].count)[0];

  // Most common mood
  const moodMap: Record<string, { count: number; image?: string }> = {};
  dreams.forEach((d) => {
    if (d.mood) {
      if (!moodMap[d.mood]) moodMap[d.mood] = { count: 0, image: d.imageUrl || undefined };
      moodMap[d.mood].count++;
    }
  });
  const topMood = Object.entries(moodMap).sort((a, b) => b[1].count - a[1].count)[0];

  // Most common keyword
  const keywordMap: Record<string, { count: number; image?: string }> = {};
  dreams.forEach((d) => {
    d.keywords?.forEach((k) => {
      if (!keywordMap[k]) keywordMap[k] = { count: 0, image: d.imageUrl || undefined };
      keywordMap[k].count++;
    });
  });
  const topKeyword = Object.entries(keywordMap).sort((a, b) => b[1].count - a[1].count)[0];

  const patternCards: PatternCard[] = [];
  if (topSymbol) patternCards.push({ label: topSymbol[0], description: "Most common symbol", image: topSymbol[1].image, cardType: "symbol" });
  if (topMood) patternCards.push({ label: topMood[0], description: "Most common emotion", image: topMood[1].image, cardType: "emotion" });
  if (topKeyword) patternCards.push({ label: topKeyword[0], description: "Recurring theme", image: topKeyword[1].image, cardType: "keyword" });

  const positiveCount = dreams.filter((d) => d.mood === "Sweet").length;
  const nightmareCount = dreams.filter((d) => d.mood === "Fear").length;

  const oldest = dreams.length > 0 ? new Date(dreams[dreams.length - 1].createdAt) : now;
  const sinceDate = oldest.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const sinceDateHe = oldest.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  const streak = Math.min(dreamsThisMonth, 30);

  return {
    totalDreams: dreams.length,
    sinceDate,
    sinceDateHe,
    streak,
    streakProgress: Math.min(streak / 30, 1),
    dreamsThisMonth,
    dreamsThisMonthDelta: dreamsThisMonth - dreamsLastMonth,
    dreamsThisWeek,
    dreamsThisWeekDelta: dreamsThisWeek - dreamsLastWeek,
    avgMoodPercent: dreams.length > 0 ? Math.round((positiveCount / dreams.length) * 100) : 0,
    nightmarePercent: dreams.length > 0 ? Math.round((nightmareCount / dreams.length) * 100) : 0,
    patternCards,
  };
}

export default async function UserPage() {
  const user = await requireUser();
  const dreams = await listDreams(user.id).catch(() => []);
  const stats = computeStats(dreams);
  return <YourJourneyScreen stats={stats} />;
}
