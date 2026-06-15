/**
 * EcoLens — Insights & Recommendation Engine
 * Rule-based engine that analyzes user emissions and generates personalized tips.
 * @module insights
 */

const Insights = (() => {
  'use strict';

  // ============================================
  //  TIP DATABASE
  // ============================================

  /**
   * All available tips with conditions, savings estimates, and metadata.
   * Each tip has:
   *  - id: unique identifier
   *  - category: emission category it targets
   *  - title: short headline
   *  - description: actionable advice
   *  - savingsKg: estimated annual CO₂ savings in kg
   *  - difficulty: 'easy' | 'medium' | 'hard'
   *  - conditions: function(profile, emissionBreakdown) => boolean
   */
  const TIPS_DATABASE = [
    // ---- TRANSPORT ----
    {
      id: 'tip-switch-to-ev',
      category: 'transport',
      title: 'Consider switching to an electric vehicle',
      description: 'Electric vehicles produce 50-70% fewer emissions than petrol cars over their lifetime. Even with grid electricity, EVs are significantly cleaner. Look into government EV incentives in your area.',
      savingsKg: 1800,
      difficulty: 'hard',
      conditions: (p) => ['car-petrol', 'car-diesel'].includes(p.commute),
    },
    {
      id: 'tip-carpool',
      category: 'transport',
      title: 'Start carpooling to work',
      description: 'Sharing your commute with just one other person halves your per-person transport emissions. Try apps like BlaBlaCar or your company\'s carpooling program.',
      savingsKg: 900,
      difficulty: 'medium',
      conditions: (p) => ['car-petrol', 'car-diesel', 'car-hybrid'].includes(p.commute) && p.commuteDistance > 5,
    },
    {
      id: 'tip-public-transport',
      category: 'transport',
      title: 'Switch to public transport for your commute',
      description: 'Buses and trains produce 60-80% fewer emissions per passenger-km compared to single-occupancy cars. Monthly passes often save money too.',
      savingsKg: 1200,
      difficulty: 'medium',
      conditions: (p) => ['car-petrol', 'car-diesel'].includes(p.commute) && p.commuteDistance < 30,
    },
    {
      id: 'tip-bike-commute',
      category: 'transport',
      title: 'Bike or walk for short commutes',
      description: 'If your commute is under 10 km, cycling is faster than driving in most cities while producing zero emissions. It\'s also great for your health.',
      savingsKg: 700,
      difficulty: 'medium',
      conditions: (p) => p.commute !== 'bike' && p.commute !== 'walk' && p.commuteDistance > 0 && p.commuteDistance <= 10,
    },
    {
      id: 'tip-remote-work',
      category: 'transport',
      title: 'Work from home when possible',
      description: 'Even 1-2 days of remote work per week can cut your commute emissions by 20-40%. Talk to your employer about flexible work arrangements.',
      savingsKg: 400,
      difficulty: 'easy',
      conditions: (p) => p.commute !== 'remote' && p.commuteDistance > 5,
    },
    {
      id: 'tip-reduce-flights',
      category: 'flight',
      title: 'Take fewer flights and choose direct routes',
      description: 'A single round-trip transatlantic flight emits about 1.6 tonnes of CO₂e per passenger. Consider trains for shorter journeys and video calls for meetings.',
      savingsKg: 1600,
      difficulty: 'medium',
      conditions: (_, breakdown) => (breakdown.flight || 0) > 200,
    },

    // ---- FOOD ----
    {
      id: 'tip-meatless-days',
      category: 'food',
      title: 'Try 2-3 meatless days per week',
      description: 'Reducing meat consumption by just a few days per week can cut food emissions by 20-30%. Start with "Meatless Mondays" and explore plant-based recipes.',
      savingsKg: 400,
      difficulty: 'easy',
      conditions: (p) => ['mixed', 'high-meat'].includes(p.diet),
    },
    {
      id: 'tip-go-vegetarian',
      category: 'food',
      title: 'Switch to a vegetarian diet',
      description: 'Vegetarian diets produce 50% fewer food emissions than meat-heavy diets. You\'ll also use 75% less land. Dairy and eggs still provide protein variety.',
      savingsKg: 800,
      difficulty: 'medium',
      conditions: (p) => p.diet === 'high-meat',
    },
    {
      id: 'tip-reduce-food-waste',
      category: 'food',
      title: 'Reduce food waste at home',
      description: 'About 30% of food is wasted. Plan meals, store food properly, use leftovers creatively, and compost what you can\'t eat. This saves money too.',
      savingsKg: 250,
      difficulty: 'easy',
      conditions: () => true, // Universal tip
    },
    {
      id: 'tip-seasonal-local',
      category: 'food',
      title: 'Eat seasonal and locally-sourced food',
      description: 'Out-of-season produce often travels thousands of miles by air. Shopping at farmers\' markets and eating seasonally reduces transport emissions significantly.',
      savingsKg: 150,
      difficulty: 'easy',
      conditions: () => true,
    },
    {
      id: 'tip-vegan',
      category: 'food',
      title: 'Explore plant-based alternatives',
      description: 'Plant-based milks, proteins, and meals have 60-80% lower carbon footprint than animal products. Try swapping one meal a day to plant-based.',
      savingsKg: 600,
      difficulty: 'medium',
      conditions: (p) => p.diet !== 'vegan',
    },

    // ---- ENERGY ----
    {
      id: 'tip-switch-renewable',
      category: 'energy',
      title: 'Switch to a renewable energy provider',
      description: 'Many utility companies offer green energy tariffs. Switching to 100% renewable electricity can eliminate most of your home energy emissions.',
      savingsKg: 1500,
      difficulty: 'medium',
      conditions: (p) => ['grid', 'grid-us', 'grid-eu', 'grid-uk', 'grid-india', 'grid-china'].includes(p.energySource),
    },
    {
      id: 'tip-led-lighting',
      category: 'energy',
      title: 'Replace all bulbs with LED lighting',
      description: 'LED bulbs use 75% less energy than incandescent bulbs and last 25 times longer. Replacing 20 bulbs saves about 100 kg CO₂ per year.',
      savingsKg: 100,
      difficulty: 'easy',
      conditions: () => true,
    },
    {
      id: 'tip-thermostat',
      category: 'energy',
      title: 'Lower your thermostat by 1-2°C',
      description: 'Each degree you lower your heating saves about 3% on energy bills and reduces emissions. Wear a sweater indoors and use a programmable thermostat.',
      savingsKg: 300,
      difficulty: 'easy',
      conditions: () => true,
    },
    {
      id: 'tip-smart-power-strips',
      category: 'energy',
      title: 'Use smart power strips to cut standby power',
      description: 'Standby power ("phantom load") accounts for 5-10% of home energy use. Smart power strips cut power when devices aren\'t in use.',
      savingsKg: 200,
      difficulty: 'easy',
      conditions: () => true,
    },
    {
      id: 'tip-insulation',
      category: 'energy',
      title: 'Improve your home insulation',
      description: 'Proper insulation reduces heating and cooling needs by 20-40%. Start with attic insulation and draft-proofing windows — they offer the best ROI.',
      savingsKg: 600,
      difficulty: 'hard',
      conditions: (p) => p.homeSize !== 'small',
    },
    {
      id: 'tip-solar-panels',
      category: 'energy',
      title: 'Install solar panels',
      description: 'Solar panels can eliminate 80-100% of your electricity emissions and pay for themselves in 5-10 years. Check local incentives and financing options.',
      savingsKg: 2000,
      difficulty: 'hard',
      conditions: (p) => p.energySource !== 'solar',
    },

    // ---- SHOPPING ----
    {
      id: 'tip-buy-less',
      category: 'shopping',
      title: 'Practice mindful consumption',
      description: 'Before buying, ask: "Do I need this?" The most sustainable product is the one you don\'t buy. Focus on experiences over things.',
      savingsKg: 300,
      difficulty: 'easy',
      conditions: (_, breakdown) => (breakdown.shopping || 0) > 100,
    },
    {
      id: 'tip-secondhand',
      category: 'shopping',
      title: 'Buy secondhand clothing and electronics',
      description: 'Secondhand items have zero additional manufacturing emissions. Try thrift stores, online marketplaces, and refurbished electronics.',
      savingsKg: 200,
      difficulty: 'easy',
      conditions: () => true,
    },
    {
      id: 'tip-repair',
      category: 'shopping',
      title: 'Repair instead of replacing',
      description: 'Learn basic repair skills or visit repair cafés. Extending a product\'s life by just one year can reduce its carbon footprint by 20-30%.',
      savingsKg: 150,
      difficulty: 'medium',
      conditions: () => true,
    },

    // ---- WASTE ----
    {
      id: 'tip-recycle-more',
      category: 'waste',
      title: 'Improve your recycling rate',
      description: 'Proper recycling reduces landfill emissions and saves raw materials. Learn your local recycling rules — contaminated recycling goes to landfill.',
      savingsKg: 100,
      difficulty: 'easy',
      conditions: () => true,
    },
    {
      id: 'tip-composting',
      category: 'waste',
      title: 'Start composting food scraps',
      description: 'Food waste in landfills produces methane, a greenhouse gas 80x more potent than CO₂. Composting turns waste into valuable soil amendment.',
      savingsKg: 150,
      difficulty: 'medium',
      conditions: () => true,
    },
    {
      id: 'tip-zero-waste',
      category: 'waste',
      title: 'Adopt zero-waste shopping habits',
      description: 'Bring reusable bags, containers, and water bottles. Choose products with less packaging. A zero-waste lifestyle can prevent 1-2 kg of waste per day.',
      savingsKg: 200,
      difficulty: 'medium',
      conditions: () => true,
    },
  ];

  // ============================================
  //  RECOMMENDATION ENGINE
  // ============================================

  /**
   * Generates personalized tips based on user profile and emission data.
   * Tips are:
   *  1. Filtered by conditions matching user profile
   *  2. Exclude dismissed tips
   *  3. Sorted by potential savings (highest first)
   *  4. Prioritized by the user's top emission category
   * @param {number} maxTips - Maximum number of tips to return.
   * @returns {Array<Object>} Sorted array of applicable tips.
   */
  function generateTips(maxTips = 10) {
    const profile = Store.get('profile');
    const dismissed = Store.get('insightsDismissed') || [];

    // Get emission breakdown for the last 30 days
    const thirtyDaysAgo = Utils.daysAgo(30);
    const today = Utils.today();
    const breakdown = Store.getTotalCO2(thirtyDaysAgo, today, true);

    // If no logged data, use baseline estimate
    let emissionBreakdown = breakdown;
    if (Object.keys(breakdown).length === 0 && profile.completed) {
      const baseline = Emissions.estimateBaseline(profile);
      emissionBreakdown = {
        transport: baseline.transport / 12, // monthly equivalent
        food: baseline.food / 12,
        energy: baseline.energy / 12,
        shopping: baseline.shopping / 12,
        waste: baseline.waste / 12,
      };
    }

    // Find the user's top emission category
    const sortedCategories = Object.entries(emissionBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([cat]) => cat);

    // Filter tips by conditions and dismissals
    const applicableTips = TIPS_DATABASE.filter((tip) => {
      if (dismissed.includes(tip.id)) return false;
      try {
        return tip.conditions(profile, emissionBreakdown);
      } catch {
        return false;
      }
    });

    // Score tips: prioritize top emission categories
    const scoredTips = applicableTips.map((tip) => {
      const categoryRank = sortedCategories.indexOf(tip.category);
      const categoryBoost = categoryRank >= 0 ? (sortedCategories.length - categoryRank) * 500 : 0;
      const score = tip.savingsKg + categoryBoost;
      return { ...tip, score };
    });

    // Sort by score (highest first)
    scoredTips.sort((a, b) => b.score - a.score);

    return scoredTips.slice(0, maxTips);
  }

  /**
   * Calculates the total potential savings if all given tips are adopted.
   * @param {Array<Object>} tips
   * @returns {number} Total kg CO₂e savings per year.
   */
  function totalPotentialSavings(tips) {
    return tips.reduce((sum, tip) => sum + tip.savingsKg, 0);
  }

  /**
   * Dismisses a tip so it won't appear again.
   * @param {string} tipId
   */
  function dismissTip(tipId) {
    const dismissed = Store.get('insightsDismissed') || [];
    if (!dismissed.includes(tipId)) {
      dismissed.push(tipId);
      Store.set('insightsDismissed', dismissed);
    }
  }

  /**
   * Gets a summary insight message based on user's emission trends.
   * @returns {Object} { message, type, emoji }
   */
  function getTrendInsight() {
    const thisWeek = Utils.currentWeekRange();
    const lastWeekStart = Utils.daysAgo(14);
    const lastWeekEnd = Utils.daysAgo(7);

    const thisWeekTotal = Store.getTotalCO2(thisWeek.start, thisWeek.end);
    const lastWeekTotal = Store.getTotalCO2(lastWeekStart, lastWeekEnd);

    if (lastWeekTotal === 0 && thisWeekTotal === 0) {
      return {
        message: 'Start logging your activities to see personalized insights!',
        type: 'info',
        emoji: '📊',
      };
    }

    if (lastWeekTotal === 0) {
      return {
        message: `You've logged ${Utils.formatCO2(thisWeekTotal)} this week. Keep tracking to see your progress!`,
        type: 'info',
        emoji: '🌱',
      };
    }

    const change = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;

    if (change < -10) {
      return {
        message: `Great progress! Your emissions are down ${Math.abs(Math.round(change))}% compared to last week.`,
        type: 'success',
        emoji: '🎉',
      };
    }

    if (change > 10) {
      return {
        message: `Your emissions are up ${Math.round(change)}% this week. Check the tips below for ways to reduce.`,
        type: 'warning',
        emoji: '📈',
      };
    }

    return {
      message: 'Your emissions are staying consistent. Try adopting one new tip to make further progress.',
      type: 'info',
      emoji: '📊',
    };
  }

  // ============================================
  //  CHALLENGES DATABASE
  // ============================================

  const CHALLENGES = Object.freeze([
    {
      id: 'challenge-meatless-monday',
      title: 'Meatless Monday',
      description: 'Go meat-free every Monday for 4 weeks. Explore delicious plant-based meals.',
      emoji: '🥗',
      durationDays: 28,
      category: 'food',
      goal: 4,  // 4 meatless Mondays
      savingsKg: 30,
    },
    {
      id: 'challenge-bike-week',
      title: 'Bike to Work Week',
      description: 'Cycle to work (or run errands by bike) for 5 consecutive days.',
      emoji: '🚲',
      durationDays: 7,
      category: 'transport',
      goal: 5,
      savingsKg: 20,
    },
    {
      id: 'challenge-unplug',
      title: 'Unplug Challenge',
      description: 'Turn off all standby appliances for 7 days. No phantom loads!',
      emoji: '🔌',
      durationDays: 7,
      category: 'energy',
      goal: 7,
      savingsKg: 5,
    },
    {
      id: 'challenge-zero-waste-week',
      title: 'Zero Waste Week',
      description: 'Produce zero landfill waste for one full week. Recycle, compost, and reuse everything.',
      emoji: '🗑️',
      durationDays: 7,
      category: 'waste',
      goal: 7,
      savingsKg: 8,
    },
    {
      id: 'challenge-local-food',
      title: 'Eat Local for 2 Weeks',
      description: 'Source all your food locally for 14 days. Visit farmers\' markets and grow your own herbs.',
      emoji: '🌽',
      durationDays: 14,
      category: 'food',
      goal: 14,
      savingsKg: 15,
    },
    {
      id: 'challenge-no-buy',
      title: '30-Day No Buy Challenge',
      description: 'Don\'t buy any non-essential items for 30 days. Focus on using what you already have.',
      emoji: '💰',
      durationDays: 30,
      category: 'shopping',
      goal: 30,
      savingsKg: 40,
    },
    {
      id: 'challenge-cold-shower',
      title: 'Cold Shower Challenge',
      description: 'Take cold (or lukewarm) showers for 7 days to save water heating energy.',
      emoji: '🚿',
      durationDays: 7,
      category: 'energy',
      goal: 7,
      savingsKg: 4,
    },
    {
      id: 'challenge-public-transit',
      title: 'Public Transit Month',
      description: 'Use only public transit, biking, or walking for all trips for 30 days.',
      emoji: '🚌',
      durationDays: 30,
      category: 'transport',
      goal: 30,
      savingsKg: 60,
    },
  ]);

  /**
   * Gets all available challenges with completion status.
   * @returns {Array<Object>}
   */
  function getChallenges() {
    const challengeState = Store.get('challenges');
    const completed = challengeState.completed || [];
    const completedIds = completed.map((c) => c.id);

    return CHALLENGES.map((challenge) => ({
      ...challenge,
      isCompleted: completedIds.includes(challenge.id),
      isActive: challengeState.active === challenge.id,
    }));
  }

  /**
   * Gets the active challenge details.
   * @returns {Object|null}
   */
  function getActiveChallenge() {
    const challengeState = Store.get('challenges');
    if (!challengeState.active) return null;
    return CHALLENGES.find((c) => c.id === challengeState.active) || null;
  }

  // ============================================
  //  ACHIEVEMENTS / BADGES
  // ============================================

  const ACHIEVEMENTS = Object.freeze([
    { id: 'badge-first-log', name: 'First Step', emoji: '👣', description: 'Log your first activity' },
    { id: 'badge-week-streak', name: '7-Day Streak', emoji: '🔥', description: 'Log activities 7 days in a row' },
    { id: 'badge-month-streak', name: '30-Day Streak', emoji: '⭐', description: 'Log activities 30 days in a row' },
    { id: 'badge-first-challenge', name: 'Challenger', emoji: '🏆', description: 'Complete your first challenge' },
    { id: 'badge-eco-warrior', name: 'Eco Warrior', emoji: '🌍', description: 'Reduce weekly emissions by 20%' },
    { id: 'badge-green-commuter', name: 'Green Commuter', emoji: '🚲', description: 'Log 10 zero-emission commutes' },
    { id: 'badge-plant-powered', name: 'Plant Powered', emoji: '🌱', description: 'Log 20 vegan meals' },
    { id: 'badge-energy-saver', name: 'Energy Saver', emoji: '💡', description: 'Use renewable energy for 30 days' },
  ]);

  /**
   * Gets achievements with earned status.
   * @returns {Array<Object>}
   */
  function getAchievements() {
    const activities = Store.get('activities') || [];
    const challenges = Store.get('challenges');

    return ACHIEVEMENTS.map((badge) => {
      let earned = false;

      switch (badge.id) {
        case 'badge-first-log':
          earned = activities.length > 0;
          break;
        case 'badge-week-streak':
          earned = challenges.streak >= 7;
          break;
        case 'badge-month-streak':
          earned = challenges.streak >= 30;
          break;
        case 'badge-first-challenge':
          earned = (challenges.completed || []).length > 0;
          break;
        case 'badge-green-commuter':
          earned = activities.filter((a) => a.category === 'transport' && ['bike', 'walk'].includes(a.type)).length >= 10;
          break;
        case 'badge-plant-powered':
          earned = activities.filter((a) => a.category === 'food' && a.type === 'vegan').length >= 20;
          break;
        default:
          earned = false;
      }

      return { ...badge, earned };
    });
  }

  // Public API
  return Object.freeze({
    generateTips,
    totalPotentialSavings,
    dismissTip,
    getTrendInsight,
    getChallenges,
    getActiveChallenge,
    getAchievements,
    CHALLENGES,
    ACHIEVEMENTS,
  });
})();
