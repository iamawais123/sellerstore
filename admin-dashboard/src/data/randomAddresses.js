// The "Random USA" button on the Give Order screen fills in a customer from a pool of 1,000 different US
// addresses. The pool is generated once from a fixed seed (so it is the same 1,000 on every machine), and
// each click deals the next customer from a shuffled deck: nothing repeats until all 1,000 have been used.

export const ADDRESS_POOL_SIZE = 1000

// [city, state, first ZIP, last ZIP, area code] — the ZIP range and area code belong to the city, so a
// generated address, postal code and phone number agree with each other.
const PLACES = [
  ['New York', 'NY', 10001, 10040, 212],
  ['Brooklyn', 'NY', 11201, 11239, 718],
  ['Bronx', 'NY', 10451, 10475, 718],
  ['Los Angeles', 'CA', 90001, 90089, 213],
  ['Chicago', 'IL', 60601, 60661, 312],
  ['Houston', 'TX', 77001, 77099, 713],
  ['Phoenix', 'AZ', 85003, 85054, 602],
  ['Philadelphia', 'PA', 19102, 19154, 215],
  ['San Antonio', 'TX', 78201, 78260, 210],
  ['San Diego', 'CA', 92101, 92130, 619],
  ['Dallas', 'TX', 75201, 75253, 214],
  ['San Jose', 'CA', 95110, 95136, 408],
  ['Austin', 'TX', 78701, 78759, 512],
  ['Jacksonville', 'FL', 32202, 32259, 904],
  ['Fort Worth', 'TX', 76102, 76164, 817],
  ['Columbus', 'OH', 43201, 43235, 614],
  ['Charlotte', 'NC', 28202, 28277, 704],
  ['San Francisco', 'CA', 94102, 94134, 415],
  ['Indianapolis', 'IN', 46201, 46260, 317],
  ['Seattle', 'WA', 98101, 98125, 206],
  ['Denver', 'CO', 80202, 80249, 303],
  ['Washington', 'DC', 20001, 20020, 202],
  ['Boston', 'MA', 2108, 2136, 617],
  ['El Paso', 'TX', 79901, 79938, 915],
  ['Nashville', 'TN', 37201, 37221, 615],
  ['Detroit', 'MI', 48201, 48238, 313],
  ['Oklahoma City', 'OK', 73102, 73135, 405],
  ['Portland', 'OR', 97201, 97239, 503],
  ['Las Vegas', 'NV', 89101, 89149, 702],
  ['Memphis', 'TN', 38103, 38141, 901],
  ['Louisville', 'KY', 40202, 40223, 502],
  ['Baltimore', 'MD', 21201, 21231, 410],
  ['Milwaukee', 'WI', 53202, 53233, 414],
  ['Albuquerque', 'NM', 87102, 87123, 505],
  ['Tucson', 'AZ', 85701, 85756, 520],
  ['Fresno', 'CA', 93701, 93730, 559],
  ['Sacramento', 'CA', 95811, 95838, 916],
  ['Kansas City', 'MO', 64101, 64158, 816],
  ['Atlanta', 'GA', 30303, 30345, 404],
  ['Omaha', 'NE', 68102, 68164, 402],
  ['Colorado Springs', 'CO', 80903, 80929, 719],
  ['Raleigh', 'NC', 27601, 27617, 919],
  ['Miami', 'FL', 33125, 33145, 305],
  ['Minneapolis', 'MN', 55401, 55419, 612],
  ['Tulsa', 'OK', 74103, 74137, 918],
  ['Cleveland', 'OH', 44102, 44135, 216],
  ['New Orleans', 'LA', 70112, 70131, 504],
  ['Tampa', 'FL', 33602, 33647, 813],
  ['Honolulu', 'HI', 96813, 96826, 808],
  ['Pittsburgh', 'PA', 15201, 15238, 412],
  ['Cincinnati', 'OH', 45202, 45255, 513],
  ['St. Louis', 'MO', 63101, 63147, 314],
  ['Orlando', 'FL', 32801, 32839, 407],
  ['Salt Lake City', 'UT', 84101, 84128, 801],
  ['Richmond', 'VA', 23219, 23235, 804],
  ['Boise', 'ID', 83702, 83716, 208],
  ['Buffalo', 'NY', 14201, 14228, 716],
  ['Anchorage', 'AK', 99501, 99518, 907],
  ['Birmingham', 'AL', 35203, 35244, 205],
  ['Des Moines', 'IA', 50309, 50322, 515],
  ['Providence', 'RI', 2903, 2909, 401],
  ['Hartford', 'CT', 6103, 6120, 860],
  ['Charleston', 'SC', 29401, 29412, 843],
  ['Madison', 'WI', 53703, 53719, 608],
  ['Little Rock', 'AR', 72201, 72212, 501],
  ['Jackson', 'MS', 39201, 39213, 601],
  ['Albany', 'NY', 12202, 12210, 518],
  ['Wilmington', 'DE', 19801, 19810, 302],
  ['Portland', 'ME', 4101, 4103, 207],
  ['Manchester', 'NH', 3101, 3109, 603],
  ['Billings', 'MT', 59101, 59106, 406],
  ['Fargo', 'ND', 58102, 58104, 701],
  ['Sioux Falls', 'SD', 57103, 57110, 605],
  ['Cheyenne', 'WY', 82001, 82009, 307],
  ['Burlington', 'VT', 5401, 5408, 802],
  ['Charleston', 'WV', 25301, 25314, 304],
  ['Lincoln', 'NE', 68502, 68528, 402],
  ['Wichita', 'KS', 67202, 67220, 316],
  ['Lexington', 'KY', 40502, 40517, 859],
  ['Baton Rouge', 'LA', 70802, 70820, 225],
  ['Spokane', 'WA', 99201, 99224, 509],
  ['Reno', 'NV', 89501, 89523, 775],
  ['St. Paul', 'MN', 55101, 55130, 651],
  ['Scottsdale', 'AZ', 85250, 85262, 480],
  ['Mesa', 'AZ', 85201, 85215, 480],
  ['Chandler', 'AZ', 85224, 85249, 480],
  ['Tempe', 'AZ', 85281, 85288, 480],
  ['Glendale', 'AZ', 85301, 85312, 623],
  ['Long Beach', 'CA', 90802, 90815, 562],
  ['Oakland', 'CA', 94601, 94621, 510],
  ['Bakersfield', 'CA', 93301, 93314, 661],
  ['Anaheim', 'CA', 92801, 92809, 714],
  ['Riverside', 'CA', 92501, 92509, 951],
  ['Stockton', 'CA', 95202, 95219, 209],
  ['Irvine', 'CA', 92602, 92620, 949],
  ['Pasadena', 'CA', 91101, 91107, 626],
  ['Santa Monica', 'CA', 90401, 90405, 310],
  ['Berkeley', 'CA', 94702, 94710, 510],
  ['Palo Alto', 'CA', 94301, 94306, 650],
  ['Henderson', 'NV', 89002, 89015, 702],
  ['Plano', 'TX', 75023, 75025, 972],
  ['Lubbock', 'TX', 79401, 79416, 806],
  ['Corpus Christi', 'TX', 78401, 78419, 361],
  ['Arlington', 'TX', 76010, 76018, 817],
  ['Irving', 'TX', 75038, 75063, 972],
  ['Durham', 'NC', 27701, 27713, 919],
  ['Greensboro', 'NC', 27401, 27410, 336],
  ['Winston-Salem', 'NC', 27101, 27127, 336],
  ['Asheville', 'NC', 28801, 28816, 828],
  ['Virginia Beach', 'VA', 23451, 23464, 757],
  ['Norfolk', 'VA', 23502, 23518, 757],
  ['Arlington', 'VA', 22201, 22213, 703],
  ['Roanoke', 'VA', 24011, 24019, 540],
  ['Newark', 'NJ', 7102, 7114, 973],
  ['Jersey City', 'NJ', 7302, 7311, 201],
  ['Stamford', 'CT', 6901, 6907, 203],
  ['New Haven', 'CT', 6510, 6519, 203],
  ['Worcester', 'MA', 1601, 1610, 508],
  ['Springfield', 'MA', 1101, 1109, 413],
  ['Cambridge', 'MA', 2138, 2142, 617],
  ['Rochester', 'NY', 14604, 14626, 585],
  ['Syracuse', 'NY', 13202, 13210, 315],
  ['Yonkers', 'NY', 10701, 10710, 914],
  ['Toledo', 'OH', 43604, 43615, 419],
  ['Akron', 'OH', 44301, 44314, 330],
  ['Dayton', 'OH', 45402, 45420, 937],
  ['Grand Rapids', 'MI', 49503, 49548, 616],
  ['Ann Arbor', 'MI', 48103, 48109, 734],
  ['Lansing', 'MI', 48906, 48917, 517],
  ['Fort Wayne', 'IN', 46802, 46825, 260],
  ['Evansville', 'IN', 47708, 47725, 812],
  ['South Bend', 'IN', 46601, 46637, 574],
  ['Gainesville', 'FL', 32601, 32611, 352],
  ['Tallahassee', 'FL', 32301, 32312, 850],
  ['Fort Lauderdale', 'FL', 33301, 33316, 954],
  ['St. Petersburg', 'FL', 33701, 33716, 727],
  ['Savannah', 'GA', 31401, 31419, 912],
  ['Knoxville', 'TN', 37902, 37921, 865],
  ['Chattanooga', 'TN', 37402, 37421, 423],
  ['Mobile', 'AL', 36602, 36617, 251],
  ['Montgomery', 'AL', 36104, 36117, 334],
  ['Huntsville', 'AL', 35801, 35816, 256],
  ['Columbia', 'SC', 29201, 29212, 803],
  ['Greenville', 'SC', 29601, 29617, 864],
  ['Columbia', 'MO', 65201, 65203, 573],
  ['Springfield', 'MO', 65802, 65810, 417],
  ['Springfield', 'IL', 62701, 62712, 217],
  ['Peoria', 'IL', 61602, 61615, 309],
  ['Naperville', 'IL', 60540, 60565, 630],
  ['Boulder', 'CO', 80301, 80310, 303],
  ['Fort Collins', 'CO', 80521, 80528, 970],
  ['Aurora', 'CO', 80010, 80019, 303],
  ['Eugene', 'OR', 97401, 97405, 541],
  ['Tacoma', 'WA', 98402, 98422, 253],
  ['Bellevue', 'WA', 98004, 98008, 425],
  ['Olympia', 'WA', 98501, 98513, 360],
  ['Santa Fe', 'NM', 87501, 87508, 505],
  ['Duluth', 'MN', 55802, 55812, 218],
  ['Green Bay', 'WI', 54301, 54313, 920],
  ['Cedar Rapids', 'IA', 52401, 52411, 319],
  ['Topeka', 'KS', 66603, 66617, 785],
  ['Overland Park', 'KS', 66204, 66225, 913],
  ['Provo', 'UT', 84601, 84606, 801],
  ['Harrisburg', 'PA', 17101, 17113, 717],
  ['Allentown', 'PA', 18101, 18109, 610],
  ['Erie', 'PA', 16501, 16511, 814],
]

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
  'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
  'Daniel', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Steven', 'Sandra',
  'Andrew', 'Ashley', 'Paul', 'Emily', 'Joshua', 'Donna', 'Kenneth', 'Michelle', 'Kevin', 'Carol',
  'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah', 'Ronald', 'Stephanie', 'Jason', 'Rebecca',
  'Ryan', 'Laura', 'Jacob', 'Sharon', 'Gary', 'Cynthia', 'Nicholas', 'Kathleen', 'Eric', 'Amy',
  'Jonathan', 'Angela', 'Justin', 'Shirley', 'Brandon', 'Anna', 'Samuel', 'Brenda', 'Tyler', 'Olivia',
  'Parker', 'Jamie', 'Taylor', 'Morgan', 'Casey', 'Jordan', 'Riley', 'Avery', 'Hannah', 'Logan',
]

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes',
  'Stewart', 'Morris', 'Morales', 'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper',
  'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers', 'Long', 'Ross', 'Foster', 'Jimenez',
  'Blake', 'Chen', 'Reid', 'Brennan', 'Fischer', 'Lindgren', 'Kowalski', 'Sullivan', 'Donovan', 'Whitaker',
]

const STREET_NAMES = [
  'Main', 'Oak', 'Maple', 'Cedar', 'Pine', 'Elm', 'Washington', 'Lake', 'Hill', 'Park',
  'Walnut', 'Sunset', 'Lincoln', 'Jackson', 'Jefferson', 'Madison', 'Adams', 'Franklin', 'Church', 'Spring',
  'River', 'Highland', 'Forest', 'Meadow', 'Ridge', 'Chestnut', 'Willow', 'Birch', 'Cherry', 'Dogwood',
  'Magnolia', 'Hickory', 'Sycamore', 'Laurel', 'Poplar', 'Spruce', 'Aspen', 'Cypress', 'Juniper', 'Mulberry',
  'College', 'Center', 'Union', 'Market', 'Mill', 'Orchard', 'Prospect', 'Valley', 'Summit', 'Garfield',
  'Wilson', 'Monroe', 'Harrison', 'Grant', 'Hamilton', 'Kennedy', 'Roosevelt', 'Liberty', 'Bridge', 'Canal',
  'Harbor', 'Lakeview', 'Woodland', 'Brookside', 'Fairview', 'Greenwood', 'Hillcrest', 'Oakwood', 'Riverside', 'Sherwood',
]

const STREET_SUFFIXES = ['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Rd', 'Ct', 'Way', 'Pl', 'Ter', 'Pkwy']
const DIRECTIONS = ['N', 'S', 'E', 'W']

const ordinal = (n) => {
  const teen = n % 100
  if (teen >= 11 && teen <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10 > 3 ? 0 : n % 10]}`
}

// A small seeded generator (mulberry32), so the pool does not change from one load to the next.
const seededRandom = (seed) => {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let pool = null

// The 1,000 customers, as the Give Order form holds them (without the country, which is always the US here).
export function randomAddressPool() {
  if (pool) return pool
  const random = seededRandom(20261001)
  const pick = (list) => list[Math.floor(random() * list.length)]
  const between = (min, max) => min + Math.floor(random() * (max - min + 1))
  const seen = new Set()
  const built = []
  while (built.length < ADDRESS_POOL_SIZE) {
    const [city, state, zipFrom, zipTo, areaCode] = pick(PLACES)
    const streetName = random() < 0.2 ? ordinal(between(1, 60)) : pick(STREET_NAMES)
    const direction = random() < 0.2 ? `${pick(DIRECTIONS)} ` : ''
    const address1 = `${between(100, 9899)} ${direction}${streetName} ${pick(STREET_SUFFIXES)}`
    const key = `${address1}|${city}|${state}`
    if (seen.has(key)) continue
    seen.add(key)
    // No N11 exchange (411, 911…), which is not a real line.
    let exchange = between(200, 989)
    while (exchange % 100 === 11) exchange = between(200, 989)
    built.push({
      fullName: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      phone: `+1 ${areaCode}-${exchange}-${String(between(0, 9999)).padStart(4, '0')}`,
      address1,
      address2: random() < 0.22 ? `${pick(['Apt', 'Unit'])} ${between(1, 40)}${random() < 0.4 ? pick(['A', 'B', 'C', 'D']) : ''}` : '',
      city,
      state,
      postalCode: String(between(zipFrom, zipTo)).padStart(5, '0'),
    })
  }
  pool = built
  return pool
}

// The deck the next customers are dealt from: every index of the pool once, in a random order.
let deck = []
let lastDealt = -1

const shuffledDeck = () => {
  const indexes = Array.from({ length: ADDRESS_POOL_SIZE }, (_, index) => index)
  for (let i = indexes.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[indexes[i], indexes[j]] = [indexes[j], indexes[i]]
  }
  // The card about to be dealt is the last one: make sure it is not the one dealt just before the reshuffle.
  if (indexes[indexes.length - 1] === lastDealt) [indexes[0], indexes[indexes.length - 1]] = [indexes[indexes.length - 1], indexes[0]]
  return indexes
}

// A random US customer for the Give Order form: a different one each click, until all 1,000 have been used.
export function randomUSACustomer() {
  const addresses = randomAddressPool()
  if (!deck.length) deck = shuffledDeck()
  lastDealt = deck.pop()
  return { ...addresses[lastDealt], country: 'United States' }
}
