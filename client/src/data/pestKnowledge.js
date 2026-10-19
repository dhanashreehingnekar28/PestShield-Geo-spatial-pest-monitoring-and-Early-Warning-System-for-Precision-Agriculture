// Extra, pest-specific guidance shown in the Pest Library detail popup.
// It is matched to a library entry by crop + pest name, and sits next to whatever
// text is stored in the database (nothing here is written back to the database).
// Chemical names and doses are indicative: always follow the product label and
// the local agriculture officer's advice.

const norm = (s) => String(s || '').toLowerCase().replace(/_/g, ' ').trim();

const HEALTHY = (crop) => ({
  cause: 'No disease detected',
  early: ['Leaves are an even green with no spots, pustules, curling or mottling.'],
  advanced: ['Not applicable. If symptoms appear later, report the crop again with a fresh photo.'],
  identify: [
    'Check the upper and lower leaf surfaces, stems and growing tip.',
    'A "Healthy" result only means the photo showed no visible disease. It does not rule out one that has just started.',
  ],
  immediate: ['No treatment needed. Keep the normal field work schedule.'],
  treatment: ['No spraying is needed. Avoid unnecessary pesticide use on a healthy ' + crop.toLowerCase() + ' crop.'],
  prevention: [
    'Scout the field every 5 to 7 days, especially after rain or a humid spell.',
    'Keep the field free of weeds and old crop residue.',
    'Use certified, treated seed and balanced fertilizer.',
  ],
  precautions: [],
});

const KNOWLEDGE = {
  'groundnut:rust': {
    cause: 'Fungus, Puccinia arachidis',
    early: [
      'Tiny pale yellow flecks on the leaf, mostly on the underside.',
      'Small orange-brown raised pustules start to form under the leaflets.',
    ],
    advanced: [
      'Pustules burst and release an orange-brown powder (spores) that rubs off on fingers.',
      'The upper leaf surface turns yellow-brown, then leaves dry up and drop.',
      'Heavy attack shrivels the plant from the lower leaves upward, reducing pod fill and fodder quality.',
    ],
    identify: [
      'Turn the leaflet over: powdery orange-brown pustules on the underside are the key sign.',
      'Different from leaf spot: rust pustules are powdery and raised, and are not surrounded by a clear yellow halo.',
      'Rust and leaf spot often occur together in the same field, so check for both.',
    ],
    immediate: [
      'Walk the field and note how many plants and what share of leaf area is affected.',
      'Spray a recommended fungicide at the first pustules rather than waiting for them to spread.',
      'Avoid moving through the wet crop, as spores spread on clothes and tools.',
    ],
    treatment: [
      'Protective sprays of chlorothalonil (about 2 g per litre) or mancozeb (about 2.5 g per litre).',
      'For an established attack, a triazole such as hexaconazole or tebuconazole is commonly advised, as per label dose.',
      'Repeat after 10 to 15 days if humid weather continues. Rotate between fungicide groups.',
    ],
    prevention: [
      'Remove volunteer groundnut plants and weeds that carry rust between seasons.',
      'Avoid very late sowing and avoid growing groundnut in the same plot year after year.',
      'Use less susceptible varieties where available.',
      'Do not over-irrigate. Leave enough spacing for air movement.',
    ],
    precautions: [
      'Wear gloves, a mask and full-sleeve clothing while spraying. Spray in calm weather, morning or evening.',
      'Observe the waiting period on the label before harvesting pods or feeding the haulms to animals.',
    ],
  },

  'groundnut:alternaria leaf spot': {
    cause: 'Fungus, Alternaria alternata',
    early: [
      'Small brown spots that often start at the leaflet tip or edge.',
      'Spots are irregular in shape, with a darker brown border.',
    ],
    advanced: [
      'Spots join together into large dry patches, often wedge or V-shaped from the leaf tip.',
      'Affected leaflets dry, curl and fall, leaving a thin canopy.',
    ],
    identify: [
      'Look at the leaflet tips first: tip-end browning in a V shape points to Alternaria.',
      'Different from Cercospora leaf spot, which gives round spots with a clear yellow halo.',
      'It is more common on stressed, older leaves and in the later part of the crop.',
    ],
    immediate: [
      'Check how far up the plant the browning has spread.',
      'Remove and destroy badly affected plants if only a few are infected.',
      'Spray a protective fungicide if the spread is on newer leaves.',
    ],
    treatment: [
      'Mancozeb (about 2.5 g per litre) or chlorothalonil (about 2 g per litre) as a protective spray.',
      'Repeat after 10 to 15 days if wet weather continues.',
    ],
    prevention: [
      'Keep the crop well fed and watered. Plant stress makes this disease worse.',
      'Clear crop residue after harvest and rotate with a non-legume crop such as cereal.',
      'Use healthy, treated seed.',
    ],
    precautions: [
      'Use protective clothing while spraying and keep sprays away from water sources.',
      'Follow the pre-harvest interval on the label.',
    ],
  },

  'groundnut:leaf spot': {
    cause: 'Fungi, Cercospora arachidicola (early leaf spot) and Nothopassalora personata (late leaf spot)',
    early: [
      'Early leaf spot: round brown spots, about 1 to 10 mm, with a clear yellow halo, mostly on the upper surface.',
      'Late leaf spot: smaller, darker, nearly black spots, mostly on the underside.',
    ],
    advanced: [
      'Spots multiply and merge, and the yellow halo spreads across the leaflet.',
      'Leaves fall off heavily, exposing stems. Spots can appear on stems and pegs.',
      'Severe attack can cut pod yield sharply and weakens the pegs, so pods are left in the soil.',
    ],
    identify: [
      'Round spots with a yellow ring: early leaf spot.',
      'Smaller, black, rough-looking spots mainly under the leaf: late leaf spot.',
      'Different from rust, which gives powdery orange pustules instead of round spots.',
    ],
    immediate: [
      'Start spraying at the first spots, since the disease spreads fast in humid weather.',
      'Remove infected fallen leaves where practical.',
    ],
    treatment: [
      'Chlorothalonil (about 2 g per litre) or mancozeb (about 2.5 g per litre) as protective sprays.',
      'Hexaconazole or tebuconazole may be used on a heavy attack, as per label dose.',
      'Repeat after 10 to 15 days. Rotate fungicide groups to reduce resistance.',
    ],
    prevention: [
      'Rotate with cereals and avoid groundnut after groundnut.',
      'Destroy crop residue and volunteer plants after harvest.',
      'Use treated seed and, where available, less susceptible varieties.',
      'Maintain adequate spacing for airflow.',
    ],
    precautions: [
      'Wear gloves, mask and full sleeves. Do not spray in strong wind or hot midday sun.',
      'Respect the waiting period on the label before harvest and before feeding haulms to cattle.',
    ],
  },

  'groundnut:rosette': {
    cause: 'Groundnut rosette virus, spread by the groundnut aphid (Aphis craccivora)',
    early: [
      'Young leaves turn yellow with a mottled or mosaic look, or stay green but crinkled.',
      'Plant growth begins to slow.',
    ],
    advanced: [
      'Severe stunting with very short stem sections, so the plant looks bushy or "rosetted".',
      'Leaflets stay small and distorted.',
      'Few or no pods form when infection happens early. Late infection mostly affects pod weight.',
    ],
    identify: [
      'Look for patches of short, bunched plants among normal ones, often near field edges where aphids arrive first.',
      'Check the shoot tips for small dark aphids, often in groups.',
      'Different from nutrient deficiency, which is usually uniform across a patch rather than random stunted plants.',
    ],
    immediate: [
      'There is no cure for infected plants. Pull out and destroy them (do not leave them in the field).',
      'Control aphids on the remaining plants to stop spread.',
      'Report the location so the outbreak can be tracked.',
    ],
    treatment: [
      'Aphid control: neem-based spray (NSKE 5 percent or neem oil), or an insecticide recommended locally, such as imidacloprid or dimethoate, as per label dose.',
      'Spraying does not cure a diseased plant. It protects the healthy plants around it.',
    ],
    prevention: [
      'Sow early and on time with the first rains, and keep a recommended close plant spacing so the crop covers the ground quickly.',
      'Treat seed with a systemic insecticide where recommended.',
      'Keep weeds down, because weeds host aphids and the virus.',
      'Use resistant or tolerant varieties if your agriculture office recommends them.',
    ],
    precautions: [
      'Protect bees and other beneficial insects: avoid spraying during flowering hours.',
      'Wear protective clothing and follow the label on dose and waiting period.',
    ],
  },

  'potato:early blight': {
    cause: 'Fungus, Alternaria solani',
    early: [
      'Small, dark brown spots on the oldest, lower leaves first.',
      'Spots enlarge and show a pattern of rings, like a target board, often with a yellow border.',
    ],
    advanced: [
      'Spots join and whole leaves turn yellow, dry and fall, moving up the plant.',
      'Dark, sunken, dry spots can appear on stems and on tubers (hard, leathery, with a raised edge).',
      'Early leaf loss reduces tuber size and yield.',
    ],
    identify: [
      'Concentric rings inside a brown spot, on older leaves, is the key sign.',
      'Different from late blight: early blight spots are dry with rings, and there is no white fuzzy growth.',
      'Favoured by warm days with alternating dry and wet or dewy spells, and by weak, nutrient-poor plants.',
    ],
    immediate: [
      'Remove the worst affected lower leaves if only a few plants are infected.',
      'Begin a protective fungicide programme before the disease climbs the plant.',
    ],
    treatment: [
      'Mancozeb (about 2.5 g per litre) or chlorothalonil, applied as a protective spray.',
      'Azoxystrobin or similar can be used as per label, rotating with other groups.',
      'Repeat every 7 to 10 days when weather stays favourable.',
    ],
    prevention: [
      'Use healthy seed tubers and rotate crops for at least 2 to 3 years away from potato, tomato and brinjal.',
      'Feed the crop well. Nitrogen- or potassium-starved plants get it more severely.',
      'Hill up soil properly so tubers are covered.',
      'Destroy plant residue after harvest and avoid overhead irrigation late in the day.',
    ],
    precautions: [
      'Wear gloves, mask and full sleeves while spraying.',
      'Follow the pre-harvest interval before digging tubers.',
    ],
  },

  'potato:late blight': {
    cause: 'Oomycete (water mould), Phytophthora infestans',
    early: [
      'Pale green to dark, water-soaked patches, usually at leaf tips and edges.',
      'In cool, humid mornings a white, fuzzy growth appears on the underside at the edge of the patch.',
    ],
    advanced: [
      'Patches turn brown-black and spread quickly across leaves and stems; the field can look scorched within days.',
      'Dark streaks on stems cause plants to collapse.',
      'Tubers show reddish-brown dry rot under the skin, which can later turn into soft rot with other germs.',
    ],
    identify: [
      'Water-soaked patches with no rings, plus white fuzz underneath in damp weather, point to late blight.',
      'Different from early blight, which shows dry, ringed spots on older leaves.',
      'It is worst in cool (about 10 to 20 degrees C), cloudy, humid or rainy weather.',
    ],
    immediate: [
      'Act the same day: late blight can destroy a field in a few days.',
      'Spray a recommended fungicide on the whole field, not only the affected spots.',
      'Remove and bury badly infected plants and cut vines before harvest to protect tubers.',
    ],
    treatment: [
      'Protective: mancozeb (about 2.5 g per litre) before and during humid weather.',
      'Once infection is present: cymoxanil + mancozeb, dimethomorph + mancozeb, or metalaxyl + mancozeb, as per label dose.',
      'Repeat every 5 to 7 days while the weather stays wet. Alternate different fungicide groups to avoid resistance.',
    ],
    prevention: [
      'Plant certified, disease-free seed tubers and avoid planting where infected waste was dumped.',
      'Use tolerant varieties if available, and ridge high so tubers are well covered.',
      'Avoid overhead irrigation, and irrigate in the morning so foliage dries.',
      'Destroy culls and volunteer plants. Keep harvested tubers dry and sorted.',
    ],
    precautions: [
      'Do not store tubers from a late-blight field with healthy ones; sort and discard rotting tubers.',
      'Wear protective clothing, and observe the waiting period before harvest.',
      'Do not mix fungicides unless the labels allow it.',
    ],
  },

  'chilli:leaf curl': {
    cause: 'Mainly a virus (chilli leaf curl begomovirus) carried by whitefly (Bemisia tabaci). Thrips and mites can cause similar curling.',
    early: [
      'Young leaves curl upward at the edges and look slightly puckered.',
      'Light yellowing of veins or leaf patches on new growth.',
    ],
    advanced: [
      'Leaves become small, thick, leathery and rolled, with shortened gaps between leaves.',
      'The whole plant is stunted and bushy. Flowers drop and few small, deformed fruits form.',
      'Plants infected young may give almost no yield.',
    ],
    identify: [
      'Check the underside of young leaves for tiny white flying insects (whitefly) that fly up when the plant is shaken.',
      'If leaves curl downward and look bronzed or silvery, suspect mites or thrips rather than the virus.',
      'Different from herbicide or water stress, which rarely cause stunted bushy plants with small leathery leaves.',
    ],
    immediate: [
      'Pull out and destroy badly infected plants, bagging them first so whiteflies do not move to healthy plants.',
      'Start controlling the insect carriers on the remaining plants.',
      'Check nearby fields and the nursery for the same signs.',
    ],
    treatment: [
      'There is no cure for infected plants, so treatment is aimed at the carriers.',
      'Neem oil (about 3 to 5 ml per litre) or NSKE 5 percent as a first step. Yellow sticky traps help reduce whitefly.',
      'If numbers keep rising, use an insecticide recommended locally for whitefly, as per label dose, rotating groups. Mite-type curling needs a miticide.',
    ],
    prevention: [
      'Raise seedlings under insect-proof net and plant only healthy seedlings.',
      'Keep the field and bunds free of weeds that host whitefly.',
      'Grow a tall border crop such as maize or sorghum to lower whitefly entry, and use reflective or sticky traps.',
      'Use tolerant varieties or hybrids if available.',
    ],
    precautions: [
      'Avoid frequent spraying of strong insecticides, since it kills natural enemies and builds resistance.',
      'Spray in the evening to protect pollinators, and follow the label on dose and waiting period.',
    ],
  },

  'chilli:cercospora leaf spot': {
    cause: 'Fungus, Cercospora capsici (also called frogeye leaf spot)',
    early: [
      'Small, round spots on the leaves with a pale grey or whitish centre.',
      'A dark brown ring around each spot gives a "frog eye" look.',
    ],
    advanced: [
      'Spots grow to about 1 cm or more and join. Leaves turn yellow and fall.',
      'Spots can also appear on stems and fruit stalks.',
      'Heavy leaf drop exposes the fruit to sunscald and lowers yield and fruit quality.',
    ],
    identify: [
      'A pale, grey-white centre with a clear dark ring is the key sign.',
      'Different from anthracnose, which affects fruits with sunken spots, and from bacterial spots, which look water-soaked and angular.',
      'Common in warm, humid or rainy weather and in dense crops.',
    ],
    immediate: [
      'Remove and destroy badly spotted leaves and fallen leaves around the plants.',
      'Spray a recommended fungicide on the full plant.',
    ],
    treatment: [
      'Mancozeb (about 2.5 g per litre), copper oxychloride (about 3 g per litre) or carbendazim (about 1 g per litre) as per label dose.',
      'Repeat after 10 to 15 days if wet weather continues, and rotate fungicide groups.',
    ],
    prevention: [
      'Use disease-free seed and treat seed before sowing.',
      'Rotate with non-solanaceous crops (not tomato, brinjal or potato).',
      'Use proper spacing, avoid overhead irrigation and clear crop residue after harvest.',
    ],
    precautions: [
      'Wear gloves, mask and full sleeves while spraying.',
      'Copper and some other fungicides can burn leaves in hot sun, so spray in the cooler part of the day.',
      'Observe the pre-harvest interval, as chilli fruits are picked repeatedly.',
    ],
  },

  'groundnut:healthy': HEALTHY('Groundnut'),
  'potato:healthy': HEALTHY('Potato'),
  'chilli:healthy': HEALTHY('Chilli'),
};

// Returns the extra guidance for a library entry, or null if there is none yet.
export const getPestKnowledge = (pest) => {
  if (!pest) return null;
  return KNOWLEDGE[`${norm(pest.crop)}:${norm(pest.pestName)}`] || null;
};