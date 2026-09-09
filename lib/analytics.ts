export interface Insight {
  type: 'warning' | 'positive' | 'alert' | 'tip' | 'insight';
  department?: string;
  title: string;
  description: string;
  metric?: { before: number; after: number };
  createdAt: Date;
}

function getRatingAvg(r: any) {
  if (!r.values || r.values.length === 0) return 0;
  return r.values.reduce((a: number, b: any) => a + b.score, 0) / r.values.length;
}

export function generateInsights(ratings: any[], departments: any[]): Insight[] {
  const insights: Insight[] = [];
  const now = new Date();
  
  // Helper to filter ratings by date range
  const getRatingsInDateRange = (startDate: Date, endDate: Date) => {
    return ratings.filter(r => {
      const d = new Date(r.createdAt);
      return d >= startDate && d <= endDate;
    });
  };

  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Group ratings by department
  const deptsMap = new Map(departments.map(d => [d.code, d.name]));

  departments.forEach(dept => {
    const deptRatings = ratings.filter(r => r.department === dept.code);
    
    // R4: Baho soni kam (oyiga < 5)
    const monthRatings = deptRatings.filter(r => new Date(r.createdAt) >= oneMonthAgo);
    if (monthRatings.length < 5 && monthRatings.length > 0) { // greater than 0 so it's active
      insights.push({
        type: 'tip',
        department: dept.name,
        title: "Baho soni kam",
        description: `${dept.name} bo'limida oxirgi 1 oyda atigi ${monthRatings.length} ta baho tushgan. QR kodni tekshirish tavsiya etiladi.`,
        createdAt: now
      });
    }

    // R1: O'rtacha baho pasayishi (last week vs previous week)
    const lastWeekRatings = deptRatings.filter(r => new Date(r.createdAt) >= oneWeekAgo);
    const prevWeekRatings = deptRatings.filter(r => {
      const d = new Date(r.createdAt);
      return d >= twoWeeksAgo && d < oneWeekAgo;
    });

    if (lastWeekRatings.length > 0 && prevWeekRatings.length > 0) {
      const lwAvg = lastWeekRatings.reduce((a, r) => a + getRatingAvg(r), 0) / lastWeekRatings.length;
      const pwAvg = prevWeekRatings.reduce((a, r) => a + getRatingAvg(r), 0) / prevWeekRatings.length;
      
      if (lwAvg < pwAvg - 0.5) {
        insights.push({
          type: 'warning',
          department: dept.name,
          title: "O'rtacha baho keskin tushdi",
          description: `${dept.name} bo'limida o'rtacha baho oldingi haftaga nisbatan pasaygan.`,
          metric: { before: parseFloat(pwAvg.toFixed(1)), after: parseFloat(lwAvg.toFixed(1)) },
          createdAt: now
        });
      } else if (lwAvg > pwAvg + 0.5 && lwAvg >= 4.0) {
        // R2 variation: O'sish
        insights.push({
          type: 'positive',
          department: dept.name,
          title: "Ijobiy o'sish",
          description: `${dept.name} bo'limida natijalar oldingi haftaga nisbatan yaxshilandi.`,
          metric: { before: parseFloat(pwAvg.toFixed(1)), after: parseFloat(lwAvg.toFixed(1)) },
          createdAt: now
        });
      }
    }
  });

  // R3: 1-2 yulduzli baholar soni oxirgi haftada oshgan
  const lastWeekLowRatings = getRatingsInDateRange(oneWeekAgo, now).filter(r => getRatingAvg(r) > 0 && getRatingAvg(r) <= 2.5);
  if (lastWeekLowRatings.length >= 3) {
    insights.push({
      type: 'alert',
      title: "Salbiy baholar ko'paydi",
      description: `Oxirgi 1 hafta ichida ${lastWeekLowRatings.length} ta salbiy (1-2 yulduzli) baho qabul qilindi. Zudlik bilan tekshiring.`,
      createdAt: now
    });
  }

  // R5: Izohlardan takroriy so'zlar (simple implementation)
  const allComments = ratings.map(r => r.comment).filter(Boolean).join(" ").toLowerCase();
  const keywords = ['qimmat', 'issiq', 'sovuq', 'qo\'pol', 'navbat', 'kutish'];
  
  keywords.forEach(word => {
    const regex = new RegExp(word, 'g');
    const matches = allComments.match(regex);
    if (matches && matches.length >= 3) {
      insights.push({
        type: 'insight',
        title: "Takroriy shikoyat / fikr",
        description: `Mijozlar izohlarida "${word}" so'zi ${matches.length} marta ishlatilgan. Bunga e'tibor qaratish tavsiya etiladi.`,
        createdAt: now
      });
    }
  });

  return insights;
}
