const reviewFirstNames = [
  'Elijah', 'Logan', 'Charlotte', 'Ava', 'Noah', 'Olivia', 'Liam', 'Emma',
  'Sophia', 'Jackson', 'Lucas', 'Isabella', 'Mia', 'Zoe', 'Lily', 'Mason',
  'Carter', 'Harper', 'Amelia', 'Evelyn', 'Abigail', 'James', 'Benjamin',
  'Henry', 'Alexander', 'Sebastian', 'Daniel', 'Matthew', 'David', 'Joseph',
  'Gabriel', 'Samuel', 'Grayson', 'Leo', 'Julian', 'Christopher', 'Andrew',
  'Thomas', 'Joshua', 'Nathan', 'Connor', 'Caleb', 'Isaac', 'Hunter',
  'Owen', 'Ryan', 'Luke', 'Sofia', 'Scarlett', 'Emily', 'Aria', 'Grace',
  'Chloe', 'Victoria', 'Riley', 'Aubrey', 'Ellie', 'Stella', 'Natalie',
  'Leah', 'Hazel', 'Violet', 'Aurora', 'Audrey', 'Bella', 'Claire',
  'Skyler', 'Lucy', 'Paisley', 'Everly', 'Anna', 'Caroline', 'Nova',
  'Genesis', 'Emilia', 'Kennedy', 'Samantha', 'Maya', 'Willow', 'Kinsley',
  'Naomi', 'Elena', 'Piper', 'Serena', 'Penelope', 'Jaxon', 'Lincoln',
  'Mateo', 'Jayden', 'Nicholas', 'Ezra', 'Asher', 'Wesley', 'Kayden',
  'Silas', 'Easton', 'Roman', 'Elias', 'Josiah', 'Maverick'
]

const reviewLastNames = [
  'Khan', 'Müller', 'Anderson', 'Smith', 'Johnson', 'Williams', 'Brown',
  'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor',
  'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres',
  'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker',
  'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
  'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz',
  'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
  'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan',
  'Cooper', 'Peterson', 'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos',
  'Kim', 'Cox', 'Ward', 'Richardson', 'Watson', 'Brooks', 'Chavez',
  'Wood', 'James', 'Bennett', 'Gray', 'Mendoza', 'Ruiz', 'Hughes',
  'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez'
]

const reviewTexts = [
  'Honestly amazing for the cost. I\'d pay double and still feel good about it.',
  'Bought two — one for home and one for the office. Both excellent.',
  'This exceeded my expectations by a mile. High quality, great value!',
  'Delivery was faster than promised and the item is perfect. 10/10.',
  'Been using this daily for 2 weeks now and zero complaints. Solid build.',
  'My wife loved it so much I ordered another one for her sister.',
  'Great price point, feels premium in hand. Would recommend to friends.',
  'Honestly did not expect this quality at this price. Very pleasantly surprised.',
  'Came well-packaged, no damages. Setup was a breeze. Works perfectly.',
  'Third time I\'ve bought from this seller and they never disappoint!',
  'Replaced my old one with this and the difference is night and day.',
  'Perfect size, perfect fit, exactly what I was looking for. A+++',
  'Got this as a gift for my dad. He calls me every week to say how much he loves it.',
  'The craftsmanship is top tier. You can tell they didn\'t cut any corners.',
  'Better than anything I found at the big box stores. And cheaper too!',
  'I researched for weeks before buying. This was absolutely the right choice.',
  'Super functional + aesthetically pleasing. What more could you want?',
  'Dropped mine on concrete twice. Still works like new. Built like a tank.',
  'Customer service was fantastic when I had a question. Real humans reply fast.',
  'The packaging alone was worth opening. Gift-ready out of the box.',
  'Not a single flaw on mine. Attention to detail is evident everywhere.',
  'My colleagues keep asking where I got this. Proud to recommend.',
  'Worth every single penny. Save yourself the headache and just buy this.',
  'Arrived 3 days early. Already put it to good use this weekend. Love it.',
  'Searched high and low for something like this. Finally found the ONE.',
  'Even my picky roommate agreed this was a great purchase. That never happens!',
  'Quality materials, smooth finish, zero wobble. Buy with confidence.',
  'I was skeptical given the price. No more — it\'s legitimately great.',
  'Used it for a week straight on a trip. Performed flawlessly every time.',
  'Upgraded from the older model. The improvements are very noticeable.',
  'This has become my daily go-to. Don\'t know how I survived without it.',
  'My only regret is not buying two when they were on sale. Oh well — next time!',
  'Read all the positive reviews and they are 100% accurate. Great buy.',
  'Ordered on Monday, had it by Wednesday morning. Fast shipping!',
  'Doesn\'t feel cheap at all. Feels like something that costs 3x more.',
  'Purchased for a specific event and it absolutely nailed the job.',
  'Friend recommended this to me. Now I\'m recommending it to you!',
  'Sturdy, spacious, stylish — hits all three marks I needed.',
  'Washes well / cleans easily. Still looks brand new after a month.',
  'Was between two products, chose this one. No buyers remorse here.',
  'Literally unboxed it and started using it 5 minutes later. No assembly needed.',
  'The attention to little details sets this apart from the competitors.',
  'Got lots of compliments on this already. Definitely a head-turner.',
  'If you\'re on the fence, just get it. You\'ll thank yourself later.',
  'Durability test passed — kids got a hold of it and it survived. Impressive!',
  'Everything works exactly as described. No surprises, just a great product.',
  'Comfortable, reliable, and looks good. The three pillars right there.',
  'Recommending this to all my clients now. It\'s that good.',
  'Nice weight to it — substantial but not heavy. Feels balanced.',
  'Held up perfectly through rain, shine, and rough handling. Tough as nails.',
  'The design is clever and well thought-out. You can tell real users designed it.',
  'I use this multiple times a day and it still looks pristine. Excellent finish.',
  'A very thoughtful product. The small inclusions make a big difference.',
  'Works for my whole family. Good for adults and older kids alike.',
  'Way better than the off-brand version I tried before this. Night and day.',
  'The price had me worried but I was wrong to doubt it. Impressive.',
  'Bought this to replace a similar item that broke. Night and day difference.',
  'Packaging was eco-friendly and the product is quality. Love to see it.',
  'No assembly required was a huge plus. Started using immediately.',
  'Took it traveling internationally. Checked bag, no issues. Arrived intact.',
  'The warranty backing it gave me peace of mind. Worth it alone.'
]

const avatarColors = [
  'bg-amber-100', 'bg-sky-100', 'bg-emerald-100', 'bg-rose-100',
  'bg-violet-100', 'bg-orange-100', 'bg-teal-100', 'bg-pink-100',
  'bg-indigo-100', 'bg-lime-100', 'bg-fuchsia-100', 'bg-cyan-100'
]

const avatarInitialBg = [
  'bg-amber-500', 'bg-sky-500', 'bg-emerald-500', 'bg-rose-500',
  'bg-violet-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500',
  'bg-indigo-500', 'bg-lime-500', 'bg-fuchsia-500', 'bg-cyan-500'
]

// Reviewer avatar helpers. Imported reviews store only the name; the picture, initials and colour
// are derived from it so they stay identical to the live store (which seeds avatars by lowercase name).
export const reviewerInitials = (name = '') =>
  name.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase() || '?'

export const reviewerAvatarUrl = (name = '') =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.toLowerCase())}&radius=50`

export const reviewerBg = (name = '') =>
  avatarInitialBg[[...name].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) >>> 0, 7) % avatarInitialBg.length]

export const generateReviews = (count, baseRating) => {
  const reviewCount = Math.max(50, count + Math.floor(Math.random() * 180))
  const reviews = []

  for (let i = 0; i < reviewCount; i++) {
    const firstName = reviewFirstNames[Math.floor(Math.random() * reviewFirstNames.length)]
    const lastName = reviewLastNames[Math.floor(Math.random() * reviewLastNames.length)]
    const daysAgo = Math.floor(Math.random() * 180)
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    const dateStr = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/')
    let rating = baseRating + (Math.random() * 0.6 - 0.3)
    rating = Math.max(3, Math.min(5, rating))
    rating = Math.round(rating * 2) / 2
    if (rating === 0) rating = 5
    const ratingInt = Math.random() < 0.85 ? 5 : Math.random() < 0.7 ? 4 : 3
    const ratingFinal = Math.round(rating) || ratingInt

    const colorIdx = Math.floor(Math.random() * avatarColors.length)

    reviews.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      initials: `${firstName[0]}${lastName[0]}`,
      avatarColor: avatarColors[colorIdx],
      avatarBg: avatarInitialBg[colorIdx],
      date: dateStr,
      rating: ratingFinal,
      text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      verified: Math.random() < 0.72
    })
  }

  return reviews.sort((a, b) => {
    const [da, ma, ya] = a.date.split('/').map(Number)
    const [db, mb, yb] = b.date.split('/').map(Number)
    return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da)
  }).reverse()
}
