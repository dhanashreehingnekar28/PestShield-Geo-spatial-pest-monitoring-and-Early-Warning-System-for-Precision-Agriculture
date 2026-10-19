module.exports = {
  Groundnut: [
    { day: 0, stage: 'Sowing', task: 'Sow seeds 3-5 cm deep, 15-20 cm spacing.' },
    { day: 15, stage: 'Germination', task: 'Ensure adequate soil moisture, check for gaps.' },
    { day: 30, stage: 'Vegetative Growth', task: 'Apply first dose of fertilizer, weed control.' },
    { day: 45, stage: 'Flowering', task: 'Monitor for early leaf spot and rust, light irrigation.' },
    { day: 70, stage: 'Pegging', task: 'Earth up soil around base for peg penetration.' },
    { day: 100, stage: 'Pod Development', task: 'Maintain consistent moisture, watch for rosette.' },
    { day: 130, stage: 'Maturity & Harvest', task: 'Check pod maturity, harvest and dry.' },
  ],
  Potato: [
    { day: 0, stage: 'Planting', task: 'Plant seed tubers 10-15 cm deep, 20-25 cm spacing.' },
    { day: 15, stage: 'Sprouting', task: 'Maintain soil moisture, avoid waterlogging.' },
    { day: 30, stage: 'Vegetative Growth', task: 'First earthing up, apply nitrogen fertilizer.' },
    { day: 45, stage: 'Tuber Initiation', task: 'Second earthing up, watch for early blight.' },
    { day: 65, stage: 'Tuber Bulking', task: 'Regular irrigation, monitor for late blight.' },
    { day: 90, stage: 'Maturity & Harvest', task: 'Stop irrigation 2 weeks before harvest, then harvest.' },
  ],
  Chilli: [
    { day: 0, stage: 'Nursery/Sowing', task: 'Raise seedlings in nursery bed or sow directly.' },
    { day: 25, stage: 'Transplanting', task: 'Transplant seedlings at 45-60 cm spacing.' },
    { day: 40, stage: 'Vegetative Growth', task: 'First fertilizer dose, weeding.' },
    { day: 60, stage: 'Flowering', task: 'Monitor for leaf curl and leaf spot, light irrigation.' },
    { day: 80, stage: 'Fruiting', task: 'Regular irrigation, pest monitoring increases in importance.' },
    { day: 120, stage: 'Harvest', task: 'Begin periodic harvesting of mature pods.' },
  ],
};
