/**
 * EcoLens — Emissions Calculation Engine
 * Scientifically-referenced emission factors and calculation functions.
 * Sources: EPA (2023), DEFRA (2023), IPCC AR6, Our World in Data.
 * @module emissions
 */

const Emissions = (() => {
  'use strict';

  // ============================================
  //  EMISSION FACTORS DATABASE (kg CO₂e per unit)
  // ============================================

  /**
   * Transport emission factors in kg CO₂e per km (per person).
   * Sources: DEFRA 2023 conversion factors, EPA 2023.
   */
  const TRANSPORT = Object.freeze({
    'car-petrol':   0.192,   // Average petrol car, 1 occupant
    'car-diesel':   0.171,   // Average diesel car, 1 occupant
    'car-hybrid':   0.120,   // Hybrid car, 1 occupant
    'car-electric': 0.053,   // BEV (grid average), 1 occupant
    'bus':          0.089,   // Average local bus
    'train':        0.041,   // National rail average
    'metro':        0.033,   // Underground/subway
    'motorcycle':   0.114,   // Average motorcycle
    'bike':         0.0,     // Zero emissions
    'walk':         0.0,     // Zero emissions
    'e-scooter':    0.013,   // Electric scooter (lifecycle)
    'taxi':         0.210,   // Taxi/ride-hail
  });

  /**
   * Flight emission factors in kg CO₂e per km (per passenger).
   * Includes radiative forcing multiplier of ~1.9.
   * Source: DEFRA 2023.
   */
  const FLIGHTS = Object.freeze({
    'short-haul':  0.255,  // < 1500 km, economy
    'medium-haul': 0.195,  // 1500-3700 km, economy
    'long-haul':   0.150,  // > 3700 km, economy
  });

  /**
   * Food emission factors in kg CO₂e per meal.
   * Source: Poore & Nemecek (2018), Our World in Data.
   */
  const FOOD = Object.freeze({
    'vegan':       0.7,    // Plant-based meal
    'vegetarian':  1.4,    // Vegetarian with dairy/eggs
    'mixed':       2.5,    // Average omnivore meal
    'high-meat':   3.8,    // Red meat-heavy meal
    'pescatarian': 1.8,    // Fish-based meal
  });

  /**
   * Energy emission factors in kg CO₂e per kWh.
   * Source: IEA 2023 global averages.
   */
  const ENERGY = Object.freeze({
    'grid':             0.475,  // Global grid average
    'grid-us':          0.390,  // US grid average
    'grid-eu':          0.276,  // EU grid average
    'grid-uk':          0.207,  // UK grid average
    'grid-india':       0.710,  // India grid average
    'grid-china':       0.555,  // China grid average
    'solar':            0.041,  // Solar PV lifecycle
    'wind':             0.011,  // Wind lifecycle
    'mixed-renewable':  0.100,  // Mix of renewables
    'natural-gas':      0.200,  // Natural gas per kWh equivalent
  });

  /**
   * Home energy usage estimates in kWh/day by home size.
   * Source: EIA 2023 residential energy survey.
   */
  const HOME_ENERGY_DAILY = Object.freeze({
    'small':  8,     // Apartment/small home
    'medium': 15,    // Average home
    'large':  25,    // Large home
  });

  /**
   * Shopping emission factors in kg CO₂e per item.
   * Source: Various lifecycle analyses, WRAP, DEFRA.
   */
  const SHOPPING = Object.freeze({
    'clothing':     15.0,   // Per garment (average)
    'electronics':  50.0,   // Per electronic device (average)
    'furniture':    80.0,   // Per furniture item
    'books':        2.5,    // Per book
    'groceries':    3.0,    // Per grocery bag (non-food items)
    'general':      5.0,    // General goods
  });

  /**
   * Waste emission factors in kg CO₂e per kg of waste.
   * Source: EPA WARM model.
   */
  const WASTE = Object.freeze({
    'landfill':   0.590,   // Mixed MSW to landfill
    'recycled':   -0.180,  // Mixed recycling (avoided emissions)
    'composted':  -0.200,  // Organic waste composted
    'incinerated': 0.250,  // Waste-to-energy
  });

  /**
   * National average CO₂e per capita per year (tonnes).
   * Source: Our World in Data 2023.
   */
  const NATIONAL_AVERAGES = Object.freeze({
    'global':     4.7,
    'us':         14.9,
    'uk':         5.2,
    'eu':         6.1,
    'canada':     14.2,
    'australia':  15.0,
    'germany':    8.1,
    'france':     4.5,
    'japan':      8.5,
    'china':      7.7,
    'india':      1.9,
    'brazil':     2.2,
    'russia':     11.4,
  });

  /** Paris Agreement target per capita (tonnes CO₂e/year) */
  const PARIS_TARGET = 2.0;

  // ============================================
  //  CALCULATION FUNCTIONS
  // ============================================

  /**
   * Calculates transport emissions.
   * @param {string} type - Transport type key.
   * @param {number} distanceKm - Distance in kilometers.
   * @returns {number} kg CO₂e
   */
  function calcTransport(type, distanceKm) {
    const factor = TRANSPORT[type];
    if (factor === undefined) {
      console.warn(`[Emissions] Unknown transport type: ${type}`);
      return 0;
    }
    return Math.max(0, factor * distanceKm);
  }

  /**
   * Calculates flight emissions.
   * @param {string} haulType - 'short-haul' | 'medium-haul' | 'long-haul'
   * @param {number} distanceKm
   * @returns {number} kg CO₂e
   */
  function calcFlight(haulType, distanceKm) {
    const factor = FLIGHTS[haulType];
    if (factor === undefined) {
      console.warn(`[Emissions] Unknown flight type: ${haulType}`);
      return 0;
    }
    return Math.max(0, factor * distanceKm);
  }

  /**
   * Calculates food emissions for meals.
   * @param {string} dietType - Diet type key.
   * @param {number} meals - Number of meals.
   * @returns {number} kg CO₂e
   */
  function calcFood(dietType, meals) {
    const factor = FOOD[dietType];
    if (factor === undefined) {
      console.warn(`[Emissions] Unknown diet type: ${dietType}`);
      return 0;
    }
    return Math.max(0, factor * meals);
  }

  /**
   * Calculates energy emissions.
   * @param {string} source - Energy source key.
   * @param {number} kWh - Energy consumption in kWh.
   * @returns {number} kg CO₂e
   */
  function calcEnergy(source, kWh) {
    const factor = ENERGY[source];
    if (factor === undefined) {
      console.warn(`[Emissions] Unknown energy source: ${source}`);
      return ENERGY['grid'] * kWh;
    }
    return Math.max(0, factor * kWh);
  }

  /**
   * Calculates shopping emissions.
   * @param {string} itemType - Shopping category key.
   * @param {number} quantity
   * @returns {number} kg CO₂e
   */
  function calcShopping(itemType, quantity) {
    const factor = SHOPPING[itemType];
    if (factor === undefined) {
      console.warn(`[Emissions] Unknown shopping type: ${itemType}`);
      return SHOPPING['general'] * quantity;
    }
    return Math.max(0, factor * quantity);
  }

  /**
   * Calculates waste emissions.
   * @param {string} disposalType
   * @param {number} weightKg
   * @returns {number} kg CO₂e (can be negative for recycling)
   */
  function calcWaste(disposalType, weightKg) {
    const factor = WASTE[disposalType];
    if (factor === undefined) {
      console.warn(`[Emissions] Unknown waste type: ${disposalType}`);
      return WASTE['landfill'] * weightKg;
    }
    return factor * weightKg;
  }

  /**
   * Master calculation function — dispatches to category-specific calculators.
   * @param {string} category - 'transport' | 'food' | 'energy' | 'shopping' | 'waste'
   * @param {string} type - Specific type within category.
   * @param {number} value - Quantity value.
   * @returns {number} kg CO₂e
   */
  function calculate(category, type, value) {
    switch (category) {
      case 'transport': return calcTransport(type, value);
      case 'flight':    return calcFlight(type, value);
      case 'food':      return calcFood(type, value);
      case 'energy':    return calcEnergy(type, value);
      case 'shopping':  return calcShopping(type, value);
      case 'waste':     return calcWaste(type, value);
      default:
        console.warn(`[Emissions] Unknown category: ${category}`);
        return 0;
    }
  }

  // ============================================
  //  BASELINE ESTIMATION
  // ============================================

  /**
   * Estimates annual baseline CO₂ from user profile.
   * @param {Object} profile - User profile from state.
   * @returns {Object} { total, transport, food, energy, shopping, waste }
   */
  function estimateBaseline(profile) {
    const daysPerYear = 365;
    const workDays = 250; // approximate work days

    // Transport: daily commute
    let transportAnnual = 0;
    if (profile.commute && profile.commuteDistance > 0) {
      const dailyRoundTrip = profile.commuteDistance * 2;
      transportAnnual = calcTransport(profile.commute, dailyRoundTrip) * workDays;
    }

    // Food: 3 meals/day based on diet
    const diet = profile.diet || 'mixed';
    const foodAnnual = calcFood(diet, 3) * daysPerYear;

    // Energy: daily home energy based on size and source
    const homeSize = profile.homeSize || 'medium';
    const energySource = profile.energySource || 'grid';
    const dailyKwh = (HOME_ENERGY_DAILY[homeSize] || 15) * (profile.householdSize ? 1 / Math.sqrt(profile.householdSize) : 1);
    const energyAnnual = calcEnergy(energySource, dailyKwh) * daysPerYear;

    // Shopping: estimated average per person
    const shoppingAnnual = 500; // kg CO₂e/year average

    // Waste: estimated
    const wasteAnnual = 200; // kg CO₂e/year average

    const total = transportAnnual + foodAnnual + energyAnnual + shoppingAnnual + wasteAnnual;

    return {
      total: Math.round(total),
      transport: Math.round(transportAnnual),
      food: Math.round(foodAnnual),
      energy: Math.round(energyAnnual),
      shopping: shoppingAnnual,
      waste: wasteAnnual,
    };
  }

  /**
   * Gets the national average for a country code.
   * @param {string} country
   * @returns {number} tonnes CO₂e/year
   */
  function getNationalAverage(country) {
    return NATIONAL_AVERAGES[country] || NATIONAL_AVERAGES['global'];
  }

  /**
   * Gets available transport types.
   * @returns {Array<{key: string, label: string, icon: string}>}
   */
  function getTransportTypes() {
    return [
      { key: 'car-petrol',   label: 'Car (Petrol)',   icon: '🚗' },
      { key: 'car-diesel',   label: 'Car (Diesel)',   icon: '🚙' },
      { key: 'car-hybrid',   label: 'Car (Hybrid)',   icon: '🔋' },
      { key: 'car-electric', label: 'Car (Electric)', icon: '⚡' },
      { key: 'bus',          label: 'Bus',            icon: '🚌' },
      { key: 'train',        label: 'Train',          icon: '🚂' },
      { key: 'metro',        label: 'Metro/Subway',   icon: '🚇' },
      { key: 'motorcycle',   label: 'Motorcycle',     icon: '🏍️' },
      { key: 'bike',         label: 'Bicycle',        icon: '🚲' },
      { key: 'walk',         label: 'Walk',           icon: '🚶' },
      { key: 'e-scooter',    label: 'E-Scooter',      icon: '🛴' },
      { key: 'taxi',         label: 'Taxi/Rideshare', icon: '🚕' },
    ];
  }

  /**
   * Gets available food types.
   * @returns {Array<{key: string, label: string, icon: string, factor: number}>}
   */
  function getFoodTypes() {
    return [
      { key: 'vegan',       label: 'Vegan',          icon: '🥬', factor: FOOD['vegan'] },
      { key: 'vegetarian',  label: 'Vegetarian',     icon: '🥚', factor: FOOD['vegetarian'] },
      { key: 'pescatarian', label: 'Pescatarian',    icon: '🐟', factor: FOOD['pescatarian'] },
      { key: 'mixed',       label: 'Mixed/Omnivore', icon: '🍽️', factor: FOOD['mixed'] },
      { key: 'high-meat',   label: 'High Meat',      icon: '🥩', factor: FOOD['high-meat'] },
    ];
  }

  /**
   * Gets available shopping types.
   * @returns {Array<{key: string, label: string, icon: string}>}
   */
  function getShoppingTypes() {
    return [
      { key: 'clothing',    label: 'Clothing',    icon: '👕' },
      { key: 'electronics', label: 'Electronics', icon: '📱' },
      { key: 'furniture',   label: 'Furniture',   icon: '🪑' },
      { key: 'books',       label: 'Books',       icon: '📚' },
      { key: 'groceries',   label: 'Groceries',   icon: '🛒' },
      { key: 'general',     label: 'General',     icon: '📦' },
    ];
  }

  /**
   * Gets category metadata (icon, color, label).
   * @param {string} category
   * @returns {Object}
   */
  function getCategoryMeta(category) {
    const meta = {
      transport: { icon: '🚗', label: 'Transport', color: 'hsl(210, 80%, 56%)' },
      flight:    { icon: '✈️', label: 'Flights',   color: 'hsl(265, 70%, 56%)' },
      food:      { icon: '🍽️', label: 'Food',      color: 'hsl(38, 92%, 50%)' },
      energy:    { icon: '⚡', label: 'Energy',    color: 'hsl(152, 60%, 38%)' },
      shopping:  { icon: '🛍️', label: 'Shopping',  color: 'hsl(330, 70%, 56%)' },
      waste:     { icon: '♻️', label: 'Waste',     color: 'hsl(180, 50%, 42%)' },
    };
    return meta[category] || { icon: '📊', label: category, color: 'hsl(0, 0%, 50%)' };
  }

  // Public API
  return Object.freeze({
    TRANSPORT,
    FLIGHTS,
    FOOD,
    ENERGY,
    HOME_ENERGY_DAILY,
    SHOPPING,
    WASTE,
    NATIONAL_AVERAGES,
    PARIS_TARGET,
    calcTransport,
    calcFlight,
    calcFood,
    calcEnergy,
    calcShopping,
    calcWaste,
    calculate,
    estimateBaseline,
    getNationalAverage,
    getTransportTypes,
    getFoodTypes,
    getShoppingTypes,
    getCategoryMeta,
  });
})();
