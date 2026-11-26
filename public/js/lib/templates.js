// Starting content for new weddings. Everything is editable afterwards.

// offset = days before the wedding the task is due. Negative = after the wedding.
export const TASKS = [
  // 12+ months
  { title: 'Agree on the overall budget', offset: 400, cat: 'Budget', link: '/budget' },
  { title: 'Draft the guest list', offset: 390, cat: 'Guests', link: '/guests' },
  { title: 'Choose a wedding date (and a backup)', offset: 380, cat: 'Planning' },
  { title: 'Collect inspiration and decide on a style', offset: 370, cat: 'Style', link: '/inspiration' },
  { title: 'Visit and compare venues', offset: 365, cat: 'Venue', link: '/vendors' },
  { title: 'Book the ceremony and reception venue', offset: 345, cat: 'Venue', link: '/vendors' },
  { title: 'Ask the koumbaros / koumbara, best man, maid of honour and bridesmaids', offset: 330, cat: 'People', link: '/team' },
  // 9–12 months
  { title: 'Research photographers and videographers', offset: 320, cat: 'Vendors', link: '/vendors' },
  { title: 'Book the photographer', offset: 300, cat: 'Vendors', link: '/vendors' },
  { title: 'Compare caterers and schedule tastings', offset: 300, cat: 'Catering', link: '/vendors' },
  { title: 'Book the caterer', offset: 280, cat: 'Catering', link: '/vendors' },
  { title: 'Start shopping for the wedding dress', offset: 290, cat: 'Attire' },
  { title: 'Book the band or DJ', offset: 270, cat: 'Music', link: '/music' },
  { title: 'Choose a colour palette', offset: 270, cat: 'Style', link: '/style' },
  { title: 'Set up a wedding website or RSVP page', offset: 250, cat: 'Guests', link: '/settings' },
  // 6–9 months
  { title: 'Meet florists and compare quotes', offset: 240, cat: 'Flowers', link: '/vendors' },
  { title: 'Book the florist', offset: 220, cat: 'Flowers', link: '/style' },
  { title: 'Send save-the-dates', offset: 220, cat: 'Guests', link: '/invitations' },
  { title: 'Book hair and makeup trials', offset: 200, cat: 'Attire' },
  { title: 'Order the wedding dress', offset: 210, cat: 'Attire' },
  { title: 'Book hotel blocks for out-of-town guests', offset: 200, cat: 'Guests' },
  { title: 'Plan and book the honeymoon', offset: 190, cat: 'Honeymoon' },
  { title: 'Book transport (wedding car, guest shuttle)', offset: 180, cat: 'Vendors', link: '/vendors' },
  // 4–6 months
  { title: 'Design the invitations', offset: 160, cat: 'Stationery', link: '/invitations' },
  { title: 'Order the wedding cake / book a tasting', offset: 150, cat: 'Catering', link: '/menu' },
  { title: 'Choose the menu with the caterer', offset: 140, cat: 'Catering', link: '/menu' },
  { title: 'Choose suits / groom attire', offset: 140, cat: 'Attire' },
  { title: 'Buy the wedding rings', offset: 130, cat: 'Attire' },
  { title: 'Rent décor, chairs, linen and lighting', offset: 120, cat: 'Décor', link: '/vendors' },
  { title: 'Plan the ceremony music', offset: 120, cat: 'Music', link: '/music' },
  // 2–4 months
  { title: 'Send the invitations', offset: 100, cat: 'Guests', link: '/invitations' },
  { title: 'Finalise flowers and bouquets', offset: 90, cat: 'Flowers', link: '/style' },
  { title: 'Plan the reception playlist and first dance', offset: 75, cat: 'Music', link: '/music' },
  { title: 'Dress fittings', offset: 70, cat: 'Attire' },
  { title: 'Buy wedding favours', offset: 65, cat: 'Décor' },
  { title: 'RSVP deadline: chase missing replies', offset: 45, cat: 'Guests', link: '/guests' },
  // 1–2 months
  { title: 'Draft the seating plan', offset: 35, cat: 'Guests', link: '/seating' },
  { title: 'Send dietary requirements to the caterer', offset: 30, cat: 'Catering', link: '/menu' },
  { title: 'Final dress fitting', offset: 25, cat: 'Attire' },
  { title: 'Confirm the day-of schedule with every vendor', offset: 21, cat: 'Planning', link: '/dayof' },
  { title: 'Final headcount to the venue and caterer', offset: 14, cat: 'Catering', link: '/guests' },
  { title: 'Print place cards, menus and the table plan', offset: 12, cat: 'Stationery', link: '/seating' },
  { title: 'Pay remaining vendor balances', offset: 10, cat: 'Budget', link: '/budget' },
  // Final week
  { title: 'Prepare tips and envelopes for vendors', offset: 5, cat: 'Budget' },
  { title: 'Pack for the honeymoon', offset: 3, cat: 'Honeymoon' },
  { title: 'Hand the emergency kit and timeline to the koumbaroi', offset: 2, cat: 'People', link: '/dayof' },
  { title: 'Rehearsal', offset: 1, cat: 'Planning' },
  // After
  { title: 'Send thank-you notes', offset: -21, cat: 'Guests', link: '/guests' },
  { title: 'Return rentals and settle final invoices', offset: -7, cat: 'Budget', link: '/budget' },
  { title: 'Review vendors and back up photos', offset: -45, cat: 'Vendors' },
];

export const GREEK_TASKS = [
  { title: 'Book the church and meet the priest', offset: 330, cat: 'Ceremony' },
  { title: 'Order the stefana (wedding crowns)', offset: 120, cat: 'Ceremony' },
  { title: 'Order the bomboniere (μπομπονιέρες)', offset: 110, cat: 'Décor' },
  { title: 'Order the lambades (wedding candles)', offset: 100, cat: 'Ceremony' },
  { title: 'Gather documents for the marriage licence (άδεια γάμου)', offset: 60, cat: 'Ceremony' },
  { title: 'Get the marriage licence from the town hall / Metropolis', offset: 30, cat: 'Ceremony' },
  { title: 'Plan the krevati (making the marital bed)', offset: 14, cat: 'Ceremony' },
  { title: 'Prepare the rice and koufeta trays for the church', offset: 3, cat: 'Ceremony' },
  { title: 'Register the marriage at the registry office (ληξιαρχείο)', offset: -14, cat: 'Ceremony' },
];

export const CIVIL_TASKS = [
  { title: 'Book the town hall / civil ceremony slot', offset: 300, cat: 'Ceremony' },
  { title: 'Submit documents for the civil marriage', offset: 60, cat: 'Ceremony' },
  { title: 'Choose readings and vows', offset: 45, cat: 'Ceremony' },
];

// Typical share of the total budget for each category (percent).
export const BUDGET_CATEGORIES = [
  { name: 'Venue', pct: 22, color: '#c0587e' },
  { name: 'Catering & drinks', pct: 26, color: '#d98a5f' },
  { name: 'Photography & video', pct: 11, color: '#6f8fb3' },
  { name: 'Flowers & décor', pct: 9, color: '#7aa37a' },
  { name: 'Music & entertainment', pct: 7, color: '#9b7bc4' },
  { name: 'Attire & beauty', pct: 8, color: '#d4a64a' },
  { name: 'Ceremony', pct: 3, color: '#8fb8b0' },
  { name: 'Stationery', pct: 2, color: '#b58aa5' },
  { name: 'Rings', pct: 4, color: '#c9a227' },
  { name: 'Transport', pct: 2, color: '#7c8a96' },
  { name: 'Favours & gifts', pct: 2, color: '#e3a0a8' },
  { name: 'Miscellaneous', pct: 4, color: '#a0a0a8' },
];
export const BUDGET_EXTRA = ['Honeymoon', 'Accommodation', 'Cake', 'Hair & makeup', 'Wedding planner', 'Rentals', 'Bachelor parties', 'Insurance'];

// Vendor categories with the fields you usually compare.
export const VENDOR_CATEGORIES = [
  { key: 'venue', name: 'Venues', icon: 'map', fields: [
    { key: 'capacity', label: 'Capacity', type: 'number' }, { key: 'location', label: 'Location' },
    { key: 'indoorOutdoor', label: 'Indoor / outdoor', type: 'select', options: ['Indoor', 'Outdoor', 'Both'] },
    { key: 'pricePerHead', label: 'Price per guest', type: 'money' }, { key: 'parking', label: 'Parking', type: 'bool' },
    { key: 'curfew', label: 'Music curfew' }, { key: 'catering', label: 'In-house catering', type: 'bool' }, { key: 'accommodation', label: 'Accommodation', type: 'bool' },
  ] },
  { key: 'catering', name: 'Catering', icon: 'menu_food', fields: [
    { key: 'pricePerHead', label: 'Price per guest', type: 'money' }, { key: 'minGuests', label: 'Minimum guests', type: 'number' },
    { key: 'style', label: 'Service style', type: 'select', options: ['Plated', 'Buffet', 'Family style', 'Cocktail', 'Food stations'] },
    { key: 'tasting', label: 'Free tasting', type: 'bool' }, { key: 'drinks', label: 'Drinks included', type: 'bool' }, { key: 'staff', label: 'Staff included', type: 'bool' },
    { key: 'dietary', label: 'Handles dietary needs', type: 'bool' }, { key: 'cake', label: 'Cake included', type: 'bool' },
  ] },
  { key: 'photo', name: 'Photo & video', icon: 'camera', fields: [
    { key: 'hours', label: 'Hours of coverage', type: 'number' }, { key: 'secondShooter', label: 'Second shooter', type: 'bool' },
    { key: 'video', label: 'Video included', type: 'bool' }, { key: 'album', label: 'Album included', type: 'bool' },
    { key: 'turnaround', label: 'Delivery time' }, { key: 'style', label: 'Style' },
  ] },
  { key: 'florist', name: 'Florists', icon: 'flower', fields: [
    { key: 'bouquet', label: 'Bridal bouquet', type: 'money' }, { key: 'centerpiece', label: 'Per centrepiece', type: 'money' },
    { key: 'churchDeco', label: 'Ceremony décor', type: 'bool' }, { key: 'setup', label: 'Setup & breakdown', type: 'bool' },
  ] },
  { key: 'music', name: 'Music & DJ', icon: 'music', fields: [
    { key: 'type', label: 'Type', type: 'select', options: ['DJ', 'Band', 'DJ + live', 'Orchestra', 'Traditional band'] },
    { key: 'hours', label: 'Hours', type: 'number' }, { key: 'equipment', label: 'Sound & lights included', type: 'bool' }, { key: 'ceremony', label: 'Plays the ceremony', type: 'bool' },
  ] },
  { key: 'cake', name: 'Cake & sweets', icon: 'cake', fields: [
    { key: 'pricePerSlice', label: 'Price per slice', type: 'money' }, { key: 'tiers', label: 'Tiers', type: 'number' }, { key: 'tasting', label: 'Tasting', type: 'bool' }, { key: 'delivery', label: 'Delivery included', type: 'bool' },
  ] },
  { key: 'beauty', name: 'Hair & makeup', icon: 'sparkle', fields: [
    { key: 'trial', label: 'Trial included', type: 'bool' }, { key: 'onsite', label: 'Comes on site', type: 'bool' }, { key: 'people', label: 'People covered', type: 'number' },
  ] },
  { key: 'attire', name: 'Attire', icon: 'heart', fields: [
    { key: 'alterations', label: 'Alterations included', type: 'bool' }, { key: 'leadTime', label: 'Lead time' },
  ] },
  { key: 'transport', name: 'Transport', icon: 'map', fields: [
    { key: 'vehicles', label: 'Vehicles', type: 'number' }, { key: 'hours', label: 'Hours', type: 'number' },
  ] },
  { key: 'rentals', name: 'Rentals & décor', icon: 'sparkle', fields: [
    { key: 'items', label: 'Items' }, { key: 'delivery', label: 'Delivery & setup', type: 'bool' },
  ] },
  { key: 'stationery', name: 'Stationery', icon: 'invite', fields: [
    { key: 'pricePerPiece', label: 'Price per invite', type: 'money' }, { key: 'samples', label: 'Free samples', type: 'bool' },
  ] },
];
export const VENDOR_STATUS = [
  { value: 'idea', label: 'Idea', chip: '' },
  { value: 'contacted', label: 'Contacted', chip: 'blue' },
  { value: 'meeting', label: 'Meeting set', chip: 'purple' },
  { value: 'quoted', label: 'Quote received', chip: 'orange' },
  { value: 'booked', label: 'Booked', chip: 'green' },
  { value: 'declined', label: 'Not chosen', chip: 'red' },
];

export const DIETARY = ['Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-free', 'Dairy-free', 'Nut allergy', 'Shellfish allergy', 'Egg allergy', 'Halal', 'Kosher', 'Low sodium', 'Diabetic', 'Fasting (νηστεία)', 'Child menu'];
export const DIET_TAGS = {
  Vegetarian: 'V', Vegan: 'VG', Pescatarian: 'P', 'Gluten-free': 'GF', 'Dairy-free': 'DF', 'Nut allergy': 'NF', 'Shellfish allergy': 'SF', 'Egg allergy': 'EF',
  Halal: 'H', Kosher: 'K', 'Low sodium': 'LS', Diabetic: 'D', 'Fasting (νηστεία)': 'F', 'Child menu': 'C',
};
export const GUEST_GROUPS = ['Family', 'Friends', 'Work', 'School', 'Neighbours', 'Plus-ones', 'Vendors'];
export const SIDES = [{ value: 'p1', label: 'Partner 1' }, { value: 'p2', label: 'Partner 2' }, { value: 'both', label: 'Both' }];

export const DAYOF = [
  { time: '09:00', title: 'Hair and makeup begins', who: 'Bride & bridesmaids', location: 'Bride’s home' },
  { time: '11:00', title: 'Photographer arrives (getting ready)', who: 'Photographer' },
  { time: '12:30', title: 'Florist delivers bouquets and buttonholes', who: 'Florist' },
  { time: '13:30', title: 'Groom gets ready with the koumbaros', who: 'Groom & koumbaros' },
  { time: '15:30', title: 'First look and couple portraits', who: 'Couple, photographer' },
  { time: '17:00', title: 'Guests arrive at the ceremony', who: 'Koumbaroi welcome guests', public: true },
  { time: '17:30', title: 'Ceremony', who: 'Everyone', public: true },
  { time: '18:30', title: 'Congratulations & family photos', who: 'Photographer, koumbaroi to gather families' },
  { time: '19:30', title: 'Cocktail hour', who: 'Caterer', public: true },
  { time: '20:30', title: 'Grand entrance and first dance', who: 'DJ / band', public: true },
  { time: '21:00', title: 'Dinner is served', who: 'Caterer', public: true },
  { time: '22:30', title: 'Cake cutting', who: 'Caterer, photographer', public: true },
  { time: '23:00', title: 'Party!', who: 'DJ / band', public: true },
  { time: '02:00', title: 'Last song & send-off', who: 'Everyone', public: true },
];
export const GREEK_DAYOF = [
  { time: '16:30', title: 'Koumbaros collects the stefana, lambades and rice', who: 'Koumbaros' },
  { time: '17:45', title: 'Stefana and the Dance of Isaiah', who: 'Priest, koumbaros', public: true },
  { time: '18:15', title: 'Rice throwing and bomboniere at the church exit', who: 'Koumbaroi', public: true },
];

export const NOTE_TEMPLATES = [
  { title: 'Emergency kit', body: 'Safety pins, sewing kit, plasters, painkillers, tissues, stain remover, deodorant, phone chargers, mints, hairpins, umbrella, cash for tips.' },
  { title: 'Vendor contacts for the day', body: 'Venue coordinator:\nCaterer:\nPhotographer:\nDJ / band:\nFlorist:\nTransport:' },
];

// Mood-board tags
export const INSPO_TAGS = ['Dress', 'Suit', 'Flowers', 'Décor', 'Tablescape', 'Cake', 'Hair & makeup', 'Venue', 'Stationery', 'Lighting', 'Favours', 'Photos'];

export const MUSIC_SECTIONS = [
  { key: 'processional', name: 'Processional', hint: 'Walking down the aisle' },
  { key: 'ceremony', name: 'Ceremony', hint: 'During the ceremony / signing' },
  { key: 'recessional', name: 'Recessional', hint: 'Leaving as a married couple' },
  { key: 'cocktail', name: 'Cocktail hour' },
  { key: 'entrance', name: 'Grand entrance' },
  { key: 'firstdance', name: 'First dance' },
  { key: 'parents', name: 'Parent dances' },
  { key: 'dinner', name: 'Dinner' },
  { key: 'cake', name: 'Cake cutting' },
  { key: 'party', name: 'Party' },
  { key: 'traditional', name: 'Traditional (Kalamatiano, Zeibekiko…)' },
  { key: 'last', name: 'Last song' },
  { key: 'requests', name: 'Guest requests', hint: 'Sent with RSVPs' },
  { key: 'donotplay', name: 'Do not play' },
];
