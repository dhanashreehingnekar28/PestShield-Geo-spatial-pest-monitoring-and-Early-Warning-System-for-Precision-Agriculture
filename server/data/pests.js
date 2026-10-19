// NOTE: keep pestName values here in sync with your teammate's model class
// names (class_indices.json from the training notebook) once it's ready -
// that's what lets an AI prediction match up to a Pest document automatically.
//
// description / symptoms / treatment are the short summaries used by alerts and
// advisories. The remaining fields feed the admin "Symptoms and treatment"
// popup. Fungicide and insecticide names are examples only: doses, intervals
// and waiting periods must always come from the product label and your local
// agriculture officer or Krishi Vigyan Kendra.
module.exports = [
  // ---------------------------------------------------------------- Groundnut
  {
    pestName: 'Healthy', crop: 'Groundnut',
    description: 'No disease detected.', symptoms: 'N/A', treatment: 'Continue regular monitoring.',
    causalAgent: 'Not a disease. The plant shows no sign of infection or pest damage.',
    spread: 'Groundnut is most at risk from leaf spot and rust once flowering starts, especially after humid or drizzly weather.',
    identification: [
      'Leaves are an even green, with no spots, orange pustules or yellow rings.',
      'New leaves open flat and normal in size, and the plant grows evenly with its neighbours.',
      'The underside of lower leaves is clean, with no powdery orange dust.',
    ],
    immediateSteps: [
      'No treatment is needed. Do not spray a healthy crop as a precaution.',
      'Walk the field once a week and check the underside of lower leaves.',
      'Take a photo and report it if you see the first spots or pustules.',
    ],
    treatmentOptions: ['None needed. Unnecessary spraying costs money and can kill the beneficial insects in your field.'],
    prevention: [
      'Keep the field free of weeds and volunteer groundnut plants.',
      'Keep proper spacing so leaves dry quickly after rain or dew.',
      'Rotate with a cereal crop next season.',
    ],
    precautions: [
      'Tell your agriculture officer early if neighbouring fields show leaf spot or rust, because the spores travel on the wind.',
    ],
  },
  {
    pestName: 'Rust', crop: 'Groundnut',
    description: 'Fungal disease causing rust-colored pustules.',
    symptoms: 'Orange-brown pustules on leaf underside.',
    treatment: 'Apply recommended fungicide (e.g. Mancozeb), remove infected debris.',
    causalAgent: 'Fungus Puccinia arachidis. It survives on volunteer groundnut plants and crop debris between seasons.',
    spread: 'Powdery spores are carried by wind and rain splash, even over long distances. It builds up fast in warm, humid, cloudy weather, usually from flowering onward.',
    earlySigns: [
      'Tiny pale or yellowish flecks on the upper surface of the older, lower leaves.',
      'Small raised orange-brown pustules (blisters) on the underside of the same leaves.',
    ],
    advancedSigns: [
      'Pustules multiply and join, covering most of the leaf underside.',
      'Pustules burst and release rusty orange powder that rubs off on your fingers.',
      'Leaflets turn yellow, then brown and dry up, but often stay hanging on the plant.',
      'Pustules also appear on stems and leaf stalks, pods fill poorly and yield drops.',
    ],
    identification: [
      'Rub the underside of a spotted leaf. Orange powder on your finger points to rust.',
      'Leaf spot gives dark brown or black round spots with a yellow ring and no orange powder.',
      'Alternaria leaf spot gives larger brown spots with rings, not raised pustules.',
    ],
    immediateSteps: [
      'Check 10 to 20 plants across the field, turning over lower leaves, to see how far it has spread.',
      'Pull out and destroy badly affected plants and any volunteer groundnut plants nearby.',
      'Start a fungicide spray as soon as pustules are found on several plants.',
      'Avoid walking through the field while leaves are wet, since spores stick to clothes.',
      'Re-check after 7 days and repeat the spray if new pustules keep appearing.',
    ],
    treatmentOptions: [
      'Protectant fungicides such as mancozeb or chlorothalonil, sprayed so the whole leaf, including the underside, is covered.',
      'Systemic triazole fungicides such as tebuconazole or hexaconazole once the disease is established.',
      'Repeat at the interval on the product label, usually 10 to 15 days in humid weather, and rotate products with different modes of action.',
      'After harvest, collect and destroy crop residue or plough it in deeply.',
    ],
    prevention: [
      'Grow rust-tolerant varieties recommended for your area.',
      'Sow early enough that flowering does not fall in the wettest, cloudiest weeks.',
      'Remove volunteer groundnut plants and clean field edges before sowing.',
      'Rotate with cereals such as sorghum, pearl millet or maize.',
    ],
    precautions: [
      'Wear gloves, a mask and long sleeves, and spray in the cool part of the day with the wind behind you.',
      'Groundnut haulm is often fed to cattle. Respect the waiting period on the label before using it as fodder.',
      'Keep children and animals out of the field for the re-entry period on the label.',
    ],
  },
  {
    pestName: 'Alternaria_Leaf_Spot', crop: 'Groundnut',
    description: 'Fungal leaf spot disease.',
    symptoms: 'Dark brown circular spots with concentric rings.',
    treatment: 'Fungicide spray, crop rotation.',
    causalAgent: 'Fungus Alternaria alternata. It lives on crop residue and attacks weak or stressed plants most easily.',
    spread: 'Spores travel by wind and rain splash. It is more serious in warm, humid weather and on plants stressed by drought or poor nutrition.',
    earlySigns: [
      'Small brown spots on leaflets, often with a pale yellow edge.',
      'Spots can start anywhere on the leaflet, including the tip and the edges.',
    ],
    advancedSigns: [
      'Spots grow larger and show rings like a target, dark brown with a lighter centre.',
      'Neighbouring spots merge into large dry patches and the leaflet curls and dries.',
      'Heavy infection makes leaves fall early and weakens the plant before pod filling.',
    ],
    identification: [
      'Look for ringed, fairly large spots. Leaf spot (Cercospora) spots are usually smaller and round, with no clear rings.',
      'Rust has raised orange pustules underneath. Alternaria has flat brown spots with no orange powder.',
      'If spots are dry and ringed on the older leaves, Alternaria is the more likely cause.',
    ],
    immediateSteps: [
      'Pick off and destroy the worst affected leaves, and take them out of the field.',
      'Spray a protectant fungicide if spots are spreading to younger leaves.',
      'Water at the base of the plants, not over the leaves, and avoid letting the crop dry out completely.',
      'Check again after a week to see whether new leaves are being affected.',
    ],
    treatmentOptions: [
      'Protectant fungicides such as mancozeb or chlorothalonil, with full leaf coverage.',
      'Copper-based fungicides such as copper oxychloride where recommended locally.',
      'Repeat at the label interval if wet weather continues, and alternate products.',
    ],
    prevention: [
      'Rotate with cereals for two to three seasons, as leaf residue carries the fungus over.',
      'Plough in or remove crop residue after harvest.',
      'Use clean, healthy seed and keep the crop well fed and not water stressed.',
    ],
    precautions: [
      'Wear gloves and a mask, and do not spray in wind or in the heat of midday.',
      'Do not use treated haulm as fodder until the waiting period on the label has passed.',
      'Burn or bury removed leaves. Do not leave them in a heap at the field edge.',
    ],
  },
  {
    pestName: 'Leaf_Spot', crop: 'Groundnut',
    description: 'Early/late leaf spot fungal disease.',
    symptoms: 'Small dark spots, yellow halo, leaf drop.',
    treatment: 'Fungicide application, remove infected leaves.',
    causalAgent: 'Fungi Cercospora arachidicola (early leaf spot) and Nothopassalora personata (late leaf spot).',
    spread: 'Spores are carried by wind and rain splash and survive on crop residue. It often starts around four to six weeks after sowing and spreads quickly in humid weather.',
    earlySigns: [
      'Early leaf spot: round light to dark brown spots, a few millimetres wide, with a yellow ring around them, mostly on the upper leaf surface.',
      'Late leaf spot: smaller, nearly black spots, mostly on the underside, usually without a yellow ring.',
    ],
    advancedSigns: [
      'Spots join together and the leaflets turn yellow.',
      'Leaves drop early, leaving bare stems and a thin crop canopy.',
      'Spots appear on leaf stalks and stems, and weak pegs break so pods are left in the soil.',
      'Heavy attack can cut pod yield severely.',
    ],
    identification: [
      'Look for the yellow ring on the upper surface (early) or black spots underneath (late).',
      'Rust gives orange powdery pustules. Leaf spot gives dark, flat or slightly rough spots with no orange dust.',
      'Alternaria spots are larger and show clear rings.',
    ],
    immediateSteps: [
      'Start spraying at the first spots rather than waiting for leaves to fall.',
      'Remove and destroy heavily spotted plants if only a few are affected.',
      'Re-spray at the label interval, because new leaves keep coming and need protecting.',
      'Plan to remove or plough in all crop residue after harvest.',
    ],
    treatmentOptions: [
      'Protectant fungicides such as chlorothalonil or mancozeb, applied as soon as the first spots appear.',
      'Systemic fungicides such as tebuconazole, hexaconazole or carbendazim on your agriculture officer advice.',
      'Rotate products with different modes of action to avoid resistance.',
    ],
    prevention: [
      'Grow tolerant varieties recommended for your area.',
      'Rotate with non-legume crops such as cereals.',
      'Do not sow next to last season groundnut fields, and remove volunteer plants.',
      'Plough crop residue deep after harvest.',
    ],
    precautions: [
      'Spray in the morning or evening, wearing gloves, a mask and long sleeves.',
      'Follow the waiting period on the label before feeding groundnut haulm to cattle.',
      'Rinse sprayers away from ponds, wells and drains.',
    ],
  },
  {
    pestName: 'Rosette', crop: 'Groundnut',
    description: 'Viral disease spread by aphids.',
    symptoms: 'Stunted growth, mottled yellow-green leaves.',
    treatment: 'Control aphid vectors, remove infected plants.',
    causalAgent: 'A virus complex (groundnut rosette virus, its assistor virus and a satellite RNA) carried by the groundnut aphid, Aphis craccivora.',
    spread: 'Aphids pick up the virus from infected plants and carry it to healthy ones. Dry spells that cause aphid outbreaks and early infection do the most damage.',
    earlySigns: [
      'Young leaves are small and mottled, with yellow patches on green (chlorotic rosette) or dark green mottling (green rosette).',
      'Growth slows and the plant looks short and bunched next to its neighbours.',
    ],
    advancedSigns: [
      'Severe stunting with very short stem segments, giving a bushy, rosette-like plant.',
      'Leaflets stay small, curled and distorted.',
      'Very few or no pods form. Plants infected early lose almost the whole yield, and later infections lose less.',
    ],
    identification: [
      'Affected plants are scattered through the field, not in an even patch, which separates this from drought or nutrient problems.',
      'Look for dark aphid colonies, often with ants, on growing tips and young leaves.',
      'The mottling and stunting stay as the plant grows. Water or nutrient problems usually improve when corrected.',
    ],
    immediateSteps: [
      'Uproot infected plants early, put them straight into a bag and destroy them away from the field.',
      'Check the growing tips of nearby plants for aphids.',
      'Control aphids on the rest of the crop before they spread the virus.',
      'Remove weeds that can host aphids and the virus.',
    ],
    treatmentOptions: [
      'There is no cure for an infected plant, so the aim is to stop spread.',
      'Aphid control with neem-based sprays or an insecticide registered for groundnut, used strictly as the label directs.',
      'Seed treatment against sucking insects, where recommended in your area.',
    ],
    prevention: [
      'Sow early and at the recommended spacing, since a dense, even canopy discourages aphids.',
      'Use rosette-tolerant varieties if available locally.',
      'Remove infected plants within the first few weeks after emergence.',
      'Keep the field and borders weed free.',
    ],
    precautions: [
      'Bag infected plants before pulling them, so aphids do not drop onto healthy ones.',
      'Spray insecticides in the evening to protect bees and natural enemies of aphids.',
      'Wear gloves and a mask, and follow the waiting period before harvesting or feeding haulm.',
    ],
  },

  // ------------------------------------------------------------------- Potato
  {
    pestName: 'Healthy', crop: 'Potato',
    description: 'No disease detected.', symptoms: 'N/A', treatment: 'Continue regular monitoring.',
    causalAgent: 'Not a disease. The plant shows no sign of infection or pest damage.',
    spread: 'Potato blights spread fastest in cool, humid or cloudy weather, so scouting matters most after rain, fog or heavy dew.',
    identification: [
      'Leaves are an even green with no spots, water-soaked patches or white mould underneath.',
      'Stems are firm and green, and the canopy closes evenly across the row.',
      'Older lower leaves show no ringed brown spots.',
    ],
    immediateSteps: [
      'No treatment is needed. Do not spray a healthy crop without a reason.',
      'Scout twice a week during cool, damp weather, checking both leaf surfaces and stems.',
      'Report a photo straight away if you see water-soaked spots or ringed lesions.',
    ],
    treatmentOptions: ['None needed. Keep fungicide for when scouting or a local blight warning calls for it.'],
    prevention: [
      'Keep tubers covered by earthing up the rows so spores cannot reach them.',
      'Water at the base of plants and avoid late-evening overhead irrigation.',
      'Remove volunteer potato plants and cull piles from the field.',
    ],
    precautions: [
      'Never plant tubers from a blighted crop, even if they look healthy.',
    ],
  },
  {
    pestName: 'Early_Blight', crop: 'Potato',
    description: 'Fungal disease common in warm humid weather.',
    symptoms: 'Dark concentric-ring spots on older leaves.',
    treatment: 'Fungicide (Chlorothalonil), remove infected leaves.',
    causalAgent: 'Fungus Alternaria solani. It survives on crop residue, volunteer plants and infected tubers.',
    spread: 'Spores spread by wind and rain splash. Warm days with alternating wet and dry spells favour it, and plants short of nitrogen or under stress are hit hardest.',
    earlySigns: [
      'Small dark brown to black spots on the oldest, lowest leaves first.',
      'Spots grow into oval or angular lesions with a yellow edge.',
    ],
    advancedSigns: [
      'Lesions show clear rings like a target and join into large dead patches.',
      'Leaves turn yellow and dry up, and defoliation moves up the plant from the bottom.',
      'Dark, sunken lesions can appear on stems.',
      'Tubers may show dark, sunken, round spots with dry brown flesh beneath, and yield and size drop.',
    ],
    identification: [
      'Early blight is dry, firm and ringed, and starts on the oldest leaves.',
      'Late blight is wet and greasy looking, spreads in days, hits all ages of leaf and stem, and grows white mould underneath in humid weather.',
      'Ringed spots on the older leaves in warm weather mean early blight is the more likely cause.',
    ],
    immediateSteps: [
      'Remove the worst infected lower leaves and take them out of the field.',
      'Start a protectant fungicide spray when the first lesions appear and keep to the label interval.',
      'Check that plants are not short of nitrogen or water, as stress makes the disease worse.',
      'Avoid overhead irrigation in the evening.',
    ],
    treatmentOptions: [
      'Protectant fungicides such as chlorothalonil or mancozeb.',
      'Systemic or strobilurin fungicides such as azoxystrobin or difenoconazole, alternated with protectants.',
      'Rotate products with different modes of action, and stick to the number of sprays on the label.',
    ],
    prevention: [
      'Plant certified, disease-free seed tubers.',
      'Rotate with cereals or legumes for at least two to three seasons.',
      'Remove volunteer potato plants and nightshade weeds.',
      'Keep plants well fed and watered, and earth up tubers well.',
      'Harvest when tubers are mature and avoid wounding them.',
    ],
    precautions: [
      'Respect the waiting period on the label before harvest, as the tubers go to market and your home.',
      'Wear gloves and a mask, and do not enter the field while sprayed foliage is still wet.',
      'Do not store tubers with dark sunken spots together with healthy ones.',
    ],
  },
  {
    pestName: 'Late_Blight', crop: 'Potato',
    description: 'Aggressive fungal disease, can destroy crop quickly.',
    symptoms: 'Water-soaked spots turning brown/black, white mold underside.',
    treatment: 'Fungicide application immediately, destroy infected plants.',
    causalAgent: 'Oomycete (water mould) Phytophthora infestans. It survives in infected seed tubers, cull piles and volunteer plants.',
    spread: 'Spores travel on wind and rain for long distances. Cool nights (about 10 to 20 degrees C), fog, drizzle and humidity above 90 percent can wipe out a field within days.',
    earlySigns: [
      'Pale green to dark water-soaked spots on leaf tips and edges.',
      'Spots enlarge fast into large, irregular brown to black blotches.',
      'In humid mornings, a fine white fuzzy ring of mould on the underside at the edge of a spot.',
    ],
    advancedSigns: [
      'Whole leaves and stems turn black and collapse. The field can look scorched within a week.',
      'Dark brown streaks on stems and a sour smell of rotting foliage.',
      'Tubers show brown to purplish, slightly sunken patches, with reddish-brown dry rot spreading into the flesh.',
      'Soft bacterial rot often follows and spoils tubers in store.',
    ],
    identification: [
      'Water-soaked, greasy patches that spread in days point to late blight.',
      'White mould underneath in humid weather is the key sign.',
      'Early blight has dry, firm, ringed spots and spreads slowly from the oldest leaves.',
    ],
    immediateSteps: [
      'Treat the same day. Late blight can destroy a crop in under a week.',
      'Spray a protectant plus systemic fungicide mix, covering both leaf surfaces and stems.',
      'Remove and bury or burn heavily infected plants away from the field.',
      'Warn neighbouring farmers and your agriculture officer, since the spores spread on the wind.',
      'Cut the haulm (foliage) 10 to 14 days before harvest if the field is badly blighted, so spores do not wash down onto the tubers.',
    ],
    treatmentOptions: [
      'Protectant fungicides such as mancozeb or chlorothalonil, applied before and during wet weather.',
      'Systemic or translaminar mixes such as cymoxanil with mancozeb, or dimethomorph with mancozeb, once blight is present.',
      'In wet weather repeat at the shortest interval on the label, often 5 to 7 days, and rotate modes of action.',
      'Do not rely on one systemic product repeatedly, since resistance is common.',
    ],
    prevention: [
      'Plant certified, blight-free seed tubers, and grow varieties with field resistance advised for your region.',
      'Earth up rows well so tubers are covered and spores cannot reach them.',
      'Destroy cull piles and volunteer plants, and plant in well drained fields.',
      'Follow local blight warnings, and spray before a forecast spell of cool, wet weather.',
    ],
    precautions: [
      'Let tuber skins set after cutting haulm and before harvest, and keep blighted tubers out of storage.',
      'Respect the pre-harvest waiting period on each product label.',
      'Wear gloves, a mask and long sleeves, and do not spray in rain or wind.',
    ],
  },

  // ------------------------------------------------------------------- Chilli
  {
    pestName: 'Healthy', crop: 'Chilli',
    description: 'No disease detected.', symptoms: 'N/A', treatment: 'Continue regular monitoring.',
    causalAgent: 'Not a disease. The plant shows no sign of infection or pest damage.',
    spread: 'Chilli is most at risk from whitefly-borne leaf curl and from leaf spots in the humid rainy season.',
    identification: [
      'Leaves are flat, evenly green and normal in size, with no curling, crinkling or spots.',
      'Growing tips are tidy, with no clusters of tiny white flies underneath the leaves.',
      'Flowers set normally and fruits are well formed.',
    ],
    immediateSteps: [
      'No treatment is needed. Do not spray a healthy crop as a precaution.',
      'Scout every week, and shake a branch to see if whiteflies fly up.',
      'Report any early curling or spots with a photo straight away.',
    ],
    treatmentOptions: ['None needed. Chilli is picked repeatedly, so every unnecessary spray adds a waiting period before you can harvest.'],
    prevention: [
      'Grow the crop away from cotton, tomato, okra and other whitefly hosts.',
      'Keep weeds under control in and around the field.',
      'Water at the base of the plants rather than over the leaves.',
    ],
    precautions: [
      'Check seedlings carefully before planting, because viruses are often brought in from the nursery.',
    ],
  },
  {
    pestName: 'Leaf_Curl', crop: 'Chilli',
    description: 'Viral disease spread by whiteflies.',
    symptoms: 'Upward curling, crinkled leaves, stunted growth.',
    treatment: 'Control whitefly vectors, remove infected plants.',
    causalAgent: 'Chilli leaf curl virus (a begomovirus), carried by the whitefly Bemisia tabaci.',
    spread: 'Whiteflies pick up the virus when feeding on an infected plant and carry it to healthy ones. Warm, dry weather with many whiteflies speeds spread, and infection in the first 30 to 45 days costs the most yield.',
    earlySigns: [
      'The youngest leaves curl upward at the edges, like a boat or cup.',
      'Veins look thicker or paler, and leaves may show light yellow patches.',
      'The stem segments between leaves become short.',
    ],
    advancedSigns: [
      'Leaves become small, thick, leathery and crinkled.',
      'The plant is stunted and bushy and stays that way.',
      'Flowers and young fruits drop, and the few fruits that set are small and deformed.',
      'Plants infected early give very little or no yield.',
    ],
    identification: [
      'Turn leaves over and shake the plant. Many tiny white flies flying up suggests whitefly-borne leaf curl.',
      'Thrips or mites cause leaf curling too, usually downward, with a silvery or bronze surface.',
      'Herbicide drift and nutrient problems also curl leaves, but they affect whole patches evenly and the plant often recovers.',
    ],
    immediateSteps: [
      'Pull out infected plants early, in the cool of the morning when whiteflies are sluggish, and bag them before removing.',
      'Bury or burn the plants away from the field.',
      'Control whiteflies on the remaining plants with sticky traps and sprays.',
      'Remove weeds that host whiteflies from the field and its borders.',
    ],
    treatmentOptions: [
      'There is no cure for infected plants, so the aim is to protect the healthy ones.',
      'Yellow sticky traps and neem-based sprays to reduce whiteflies.',
      'Insecticides registered for chilli, such as diafenthiuron, spiromesifen or imidacloprid, rotated by mode of action. Follow the label closely.',
    ],
    prevention: [
      'Raise seedlings under fine insect-proof net in the nursery.',
      'Plant tolerant or resistant varieties recommended locally.',
      'Grow two or three rows of a tall barrier crop such as maize, sorghum or pearl millet around the field.',
      'Use reflective silver mulch where possible, and avoid planting near cotton, tomato or okra.',
    ],
    precautions: [
      'Chilli is picked again and again, so check the waiting period before harvest on every insecticide you use.',
      'Spray in the evening when bees are not working the flowers, and wear gloves, mask and long sleeves.',
      'Never shake infected plants near healthy ones, since the whiteflies will fly across.',
    ],
  },
  {
    pestName: 'Cercospora_Leaf_Spot', crop: 'Chilli',
    description: 'Fungal leaf spot (frog-eye spot).',
    symptoms: 'Circular spots with grey center and dark margin.',
    treatment: 'Fungicide spray, avoid overhead irrigation.',
    causalAgent: 'Fungus Cercospora capsici. It survives on crop residue and in infected seed.',
    spread: 'Spores spread by wind and rain splash. Warm, humid or rainy weather, dense foliage and overhead irrigation all favour it.',
    earlySigns: [
      'Small round brown spots on the leaves, about half a centimetre across.',
      'As they grow, the centre turns grey or whitish and a darker brown to reddish edge forms, giving a frog-eye look.',
    ],
    advancedSigns: [
      'Spots grow to over a centimetre and join together.',
      'Leaves turn yellow and drop early, leaving fruit exposed to sunscald.',
      'In severe cases spots appear on leaf stalks, stems and fruit stalks.',
      'Fruit set and size fall, so yield drops.',
    ],
    identification: [
      'The grey or white centre with a dark rim is the key sign.',
      'Bacterial leaf spot gives water-soaked, angular spots with a yellow halo and no grey centre.',
      'Anthracnose mainly shows as dark sunken spots on ripe fruit, not frog-eye spots on leaves.',
    ],
    immediateSteps: [
      'Remove the worst affected leaves and plants and take them out of the field.',
      'Spray a fungicide as soon as spots are found on several plants.',
      'Stop watering over the leaves, and water at the base in the morning.',
      'Open up dense growth where you can, with staking and spacing, so leaves dry faster.',
    ],
    treatmentOptions: [
      'Protectant fungicides such as mancozeb, chlorothalonil or copper oxychloride.',
      'A systemic fungicide, only if your agriculture officer recommends one for your area.',
      'Repeat at the label interval in wet weather and rotate products.',
    ],
    prevention: [
      'Use disease-free seed and treat seed as recommended before sowing.',
      'Rotate with non-solanaceous crops (not tomato, brinjal or potato) for two to three seasons.',
      'Keep proper spacing, weed the field and remove crop residue after harvest.',
      'Use drip or furrow irrigation instead of overhead.',
    ],
    precautions: [
      'Chilli is harvested repeatedly. Check the waiting period on each fungicide label and pick ripe fruit before spraying.',
      'Wear gloves, a mask and long sleeves, and avoid spraying in wind or midday heat.',
      'Wash picked chillies as normal and do not harvest from freshly sprayed plants.',
    ],
  },
  
  // ============================================================
  // POTATO — Additional AI model classification categories
  // ============================================================

  {
    pestName: 'Bacteria',
    crop: 'Potato',
    description: 'AI category indicating possible bacterial damage.',
    symptoms: 'Wilting, soft rot, discolouration or bacterial lesions.',
    treatment: 'Seek confirmation before selecting a treatment.',
    causalAgent: 'Potential bacterial pathogens; exact organism not identified.',
    identification: [
      'Inspect stems, leaves and tubers for bacterial symptoms.',
      'The AI category alone does not identify a specific disease.'
    ],
    immediateSteps: [
      'Inspect nearby plants and document the symptoms.',
      'Avoid moving potentially infected planting material.',
      'Contact a local agriculture officer for confirmation.'
    ],
    prevention: [
      'Use certified, disease-free seed tubers.',
      'Maintain clean equipment and suitable field drainage.'
    ],
    precautions: [
      'Do not apply antibiotics or pesticides based only on this AI category.'
    ]
  },
  {
    pestName: 'Fungi',
    crop: 'Potato',
    description: 'Broad AI category indicating possible fungal disease.',
    symptoms: 'Leaf spots, lesions, mould or other fungal-like damage.',
    treatment: 'Identify the specific disease before treatment.',
    causalAgent: 'Possible fungal pathogen; species not determined.',
    identification: [
      'Check lesion patterns and which leaves are affected.',
      'Fungi is a broad classification, not a confirmed Early Blight diagnosis.'
    ],
    immediateSteps: [
      'Inspect multiple plants and record symptom progression.',
      'Avoid prolonged leaf wetness.',
      'Request expert identification if symptoms spread.'
    ],
    prevention: [
      'Use healthy planting material.',
      'Maintain crop rotation and good field sanitation.'
    ],
    precautions: [
      'Do not select a fungicide solely from this broad prediction.'
    ]
  },
  {
    pestName: 'Nematode',
    crop: 'Potato',
    description: 'AI category indicating possible nematode-related damage.',
    symptoms: 'Stunting, yellowing, poor growth or root-related damage.',
    treatment: 'Confirm nematode presence before management.',
    causalAgent: 'Potential plant-parasitic nematodes; species unknown.',
    identification: [
      'Inspect roots and tubers for abnormalities.',
      'Laboratory or soil testing may be needed for confirmation.'
    ],
    immediateSteps: [
      'Record affected patches in the field.',
      'Consult an agriculture officer about sampling.'
    ],
    prevention: [
      'Use certified seed tubers.',
      'Follow locally recommended crop rotations.'
    ],
    precautions: [
      'Do not apply nematicides without confirmation and local guidance.'
    ]
  },
  {
    pestName: 'Pest',
    crop: 'Potato',
    description: 'Broad AI category indicating possible insect or pest damage.',
    symptoms: 'Feeding holes, damaged leaves or visible pest activity.',
    treatment: 'Identify the pest before choosing control measures.',
    causalAgent: 'Unspecified agricultural pest.',
    identification: [
      'Check both sides of leaves for insects, eggs and feeding damage.',
      'Identify the organism before selecting a treatment.'
    ],
    immediateSteps: [
      'Inspect several affected and unaffected plants.',
      'Photograph any visible insects or larvae.'
    ],
    prevention: [
      'Scout fields regularly.',
      'Encourage beneficial insects and maintain field hygiene.'
    ],
    precautions: [
      'Avoid unnecessary insecticide applications.'
    ]
  },
  {
    pestName: 'Phytophthora',
    crop: 'Potato',
    description: 'AI category associated with possible Phytophthora infection.',
    symptoms: 'Water-soaked lesions, darkening foliage or blight-like symptoms.',
    treatment: 'Seek prompt confirmation of the suspected infection.',
    causalAgent: 'Possible Phytophthora species; not laboratory confirmed.',
    identification: [
      'Look for rapidly expanding water-soaked lesions.',
      'Inspect the underside of leaves during humid conditions.'
    ],
    immediateSteps: [
      'Inspect the field promptly for spreading symptoms.',
      'Contact an agriculture officer if late blight is suspected.'
    ],
    prevention: [
      'Use certified healthy seed tubers.',
      'Avoid prolonged wet foliage and remove infected crop debris.'
    ],
    precautions: [
      'Do not treat the AI category as laboratory confirmation.'
    ]
  },
  {
    pestName: 'Virus',
    crop: 'Potato',
    description: 'Broad AI category indicating possible viral symptoms.',
    symptoms: 'Mosaic patterns, curling, yellowing or stunted growth.',
    treatment: 'Confirm the virus and manage its vectors where appropriate.',
    causalAgent: 'Possible plant virus; specific virus not identified.',
    identification: [
      'Look for mosaic patterns and abnormal leaf growth.',
      'Similar symptoms can result from nutrient or environmental stress.'
    ],
    immediateSteps: [
      'Record affected plants and inspect for insect vectors.',
      'Consult an agriculture officer for confirmation.'
    ],
    prevention: [
      'Use certified virus-tested seed tubers.',
      'Monitor insect vectors and remove volunteer plants.'
    ],
    precautions: [
      'There is no general chemical cure for plant viral infections.'
    ]
  },

  // ============================================================
  // CHILLI — Additional AI model classification categories
  // ============================================================

  {
    pestName: 'Whitefly',
    crop: 'Chilli',
    description: 'Possible whitefly infestation.',
    symptoms: 'Small white insects, yellowing and weakened growth.',
    treatment: 'Monitor whiteflies and use integrated pest management.',
    causalAgent: 'Whiteflies, potentially including Bemisia tabaci.',
    identification: [
      'Inspect leaf undersides for small white insects.',
      'Disturb foliage gently and check for flying whiteflies.'
    ],
    immediateSteps: [
      'Inspect nearby plants and monitor pest numbers.',
      'Use yellow sticky traps for monitoring.'
    ],
    prevention: [
      'Remove alternate weed hosts.',
      'Protect nursery seedlings with suitable insect-proof netting.'
    ],
    precautions: [
      'Follow local guidance and pesticide labels before spraying.'
    ]
  },
  {
    pestName: 'Yellowish',
    crop: 'Chilli',
    description: 'Yellowing symptom detected; underlying cause is unknown.',
    symptoms: 'Yellow or pale leaves.',
    treatment: 'Investigate nutrition, irrigation, pests and disease.',
    causalAgent: 'Undetermined; may be nutritional, environmental or biological.',
    identification: [
      'Check whether yellowing affects old or young leaves.',
      'Inspect soil moisture, roots and insect activity.'
    ],
    immediateSteps: [
      'Check irrigation and drainage.',
      'Look for pests and other symptoms.',
      'Seek diagnosis if yellowing persists.'
    ],
    prevention: [
      'Maintain balanced nutrition and appropriate irrigation.',
      'Inspect plants regularly.'
    ],
    precautions: [
      'Yellowing alone does not confirm an infectious disease.'
    ]
  },
  {
    pestName: 'Anthracnos',
    crop: 'Chilli',
    description: 'AI dataset category suggesting anthracnose-like symptoms.',
    symptoms: 'Dark or sunken lesions, potentially affecting fruit or foliage.',
    treatment: 'Confirm anthracnose before choosing management.',
    causalAgent: 'Potential Colletotrichum species.',
    identification: [
      'Inspect fruits for sunken lesions.',
      'Check affected plant material for spreading spots.'
    ],
    immediateSteps: [
      'Separate visibly affected harvested produce.',
      'Document symptoms and consult local crop guidance.'
    ],
    prevention: [
      'Use disease-free seed.',
      'Maintain sanitation and avoid unnecessary leaf wetness.'
    ],
    precautions: [
      'The dataset label Anthracnos is retained for AI compatibility.'
    ]
  },
  {
    pestName: 'Damping_Off',
    crop: 'Chilli',
    description: 'Possible damping-off disease in seedlings.',
    symptoms: 'Seedlings collapse or develop weakened stems near soil level.',
    treatment: 'Improve nursery conditions and confirm the causal organism.',
    causalAgent: 'May involve soilborne pathogens such as Pythium or Rhizoctonia.',
    identification: [
      'Inspect young seedlings near the soil line.',
      'Look for stem narrowing, decay and seedling collapse.'
    ],
    immediateSteps: [
      'Remove severely affected seedlings.',
      'Check nursery drainage and avoid overwatering.'
    ],
    prevention: [
      'Use clean nursery trays and suitable growing media.',
      'Avoid overcrowding and excess moisture.'
    ],
    precautions: [
      'Different pathogens can cause similar symptoms.'
    ]
  },
  {
    pestName: 'Leaf_Spot',
    crop: 'Chilli',
    description: 'General AI category indicating leaf-spot symptoms.',
    symptoms: 'Brown, grey or dark spots on leaves.',
    treatment: 'Identify the cause before applying treatment.',
    causalAgent: 'Undetermined; leaf spots may have several causes.',
    identification: [
      'Inspect spot shape, colour and distribution.',
      'Do not assume every leaf spot is Cercospora.'
    ],
    immediateSteps: [
      'Photograph affected leaves and monitor new symptoms.',
      'Avoid unnecessary overhead irrigation.'
    ],
    prevention: [
      'Use clean planting material and maintain field hygiene.',
      'Provide suitable spacing for air circulation.'
    ],
    precautions: [
      'The AI category does not identify a specific pathogen.'
    ]
  },
  {
    pestName: 'Veinal_Mottle_Virus',
    crop: 'Chilli',
    description: 'Possible chilli veinal mottle virus symptoms.',
    symptoms: 'Mottling, mosaic patterns and abnormal leaf growth.',
    treatment: 'Seek confirmation and manage relevant insect vectors.',
    causalAgent: 'Potential chilli veinal mottle virus.',
    identification: [
      'Look for vein-associated mottling and mosaic patterns.',
      'Inspect plants for aphids and other potential vectors.'
    ],
    immediateSteps: [
      'Record affected plants and monitor symptom spread.',
      'Consult an agriculture officer for confirmation.'
    ],
    prevention: [
      'Use healthy seedlings.',
      'Monitor aphids and maintain field sanitation.'
    ],
    precautions: [
      'AI image classification is not laboratory virus confirmation.'
    ]
  },

];