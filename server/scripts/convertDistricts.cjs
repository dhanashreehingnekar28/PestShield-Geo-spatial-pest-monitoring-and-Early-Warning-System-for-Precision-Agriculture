const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');

const inputPath = path.join(root, 'allDistricts.csv');
const outputPath = path.join(
  root,
  'client',
  'src',
  'data',
  'indiaDistricts.json'
);

// CSV parser that handles quoted fields, commas,
// escaped quotes, and line breaks inside fields.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  text = text.replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      if (quoted && text[i + 1] === '"') {
        field += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if (
      (char === '\n' || char === '\r') &&
      !quoted
    ) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++;
      }

      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

if (!fs.existsSync(inputPath)) {
  console.error('CSV not found:', inputPath);
  process.exit(1);
}

const text = fs.readFileSync(inputPath, 'utf8');
const rows = parseCSV(text);

const headers = rows.shift().map((h) => h.trim());

const required = [
  'state_code',
  'state_name_english',
  'district_code',
  'district_name_english'
];

for (const column of required) {
  if (!headers.includes(column)) {
    console.error('Missing CSV column:', column);
    process.exit(1);
  }
}

const states = {};

for (const row of rows) {
  if (!row.some((value) => value.trim())) continue;

  const record = Object.fromEntries(
    headers.map((header, index) => [
      header,
      (row[index] || '').trim()
    ])
  );

  const stateCode = record.state_code;
  const stateName = record.state_name_english;
  const districtCode = record.district_code;
  const districtName = record.district_name_english;

  if (
    !stateCode ||
    !stateName ||
    !districtCode ||
    !districtName
  ) {
    continue;
  }

  if (!states[stateCode]) {
    states[stateCode] = {
      stateName,
      districts: []
    };
  }

  const alreadyExists = states[stateCode].districts.some(
    (district) => district.districtCode === districtCode
  );

  if (!alreadyExists) {
    states[stateCode].districts.push({
      districtCode,
      districtName
    });
  }
}

for (const state of Object.values(states)) {
  state.districts.sort((a, b) =>
    a.districtName.localeCompare(b.districtName)
  );
}

const sortedStates = Object.fromEntries(
  Object.entries(states).sort((a, b) =>
    a[1].stateName.localeCompare(b[1].stateName)
  )
);

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true
});

fs.writeFileSync(
  outputPath,
  JSON.stringify(sortedStates, null, 2),
  'utf8'
);

const stateCount = Object.keys(sortedStates).length;

const districtCount = Object.values(sortedStates)
  .reduce((sum, state) => sum + state.districts.length, 0);

console.log('India district JSON created successfully!');
console.log('States / UTs:', stateCount);
console.log('Districts:', districtCount);
console.log('Output:', outputPath);

const gujarat = Object.values(sortedStates).find(
  (state) => state.stateName.toLowerCase() === 'gujarat'
);

if (gujarat) {
  const sabarkantha = gujarat.districts.find(
    (district) =>
      district.districtName.toLowerCase() === 'sabarkantha'
  );

  console.log(
    'Gujarat -> Sabarkantha:',
    sabarkantha || 'NOT FOUND IN CSV'
  );
}
