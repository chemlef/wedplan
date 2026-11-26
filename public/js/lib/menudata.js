// Dish ideas. Tags: V vegetarian, VG vegan, GF gluten-free, DF dairy-free, NF nut-free, FI fish, SH shellfish, M meat, EF egg-free.
export const COURSES = ['Canapés', 'Starter', 'Soup', 'Salad', 'Main', 'Side', 'Dessert', 'Wedding cake', 'Late-night', 'Drinks', 'Kids'];
export const STYLES = ['Greek', 'Mediterranean', 'Italian', 'Classic', 'Modern', 'Plant-based'];

const D = (name, course, styles, tags, desc) => ({ name, course, styles, tags, desc });
export const DISHES = [
  D('Mini spanakopita triangles', 'Canapés', ['Greek'], ['V', 'NF'], 'Spinach and feta in crisp filo'),
  D('Tirokafteri on toasted pita', 'Canapés', ['Greek'], ['V', 'NF', 'EF'], 'Spicy whipped feta'),
  D('Dolmadakia', 'Canapés', ['Greek', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Vine leaves with herbed rice and lemon'),
  D('Shrimp saganaki skewers', 'Canapés', ['Greek', 'Mediterranean'], ['SH', 'GF', 'NF', 'EF'], 'Tomato, ouzo and feta glaze'),
  D('Beef carpaccio crostini', 'Canapés', ['Italian', 'Modern'], ['M', 'NF', 'DF', 'EF'], 'Rocket, parmesan shavings, truffle oil'),
  D('Smoked salmon blinis', 'Canapés', ['Classic'], ['FI', 'NF'], 'Crème fraîche and dill'),
  D('Caprese skewers', 'Canapés', ['Italian'], ['V', 'GF', 'NF', 'EF'], 'Cherry tomato, mozzarella, basil'),
  D('Stuffed mushrooms', 'Canapés', ['Classic', 'Plant-based'], ['VG', 'V', 'DF', 'NF', 'EF'], 'Herbed breadcrumbs and garlic'),
  D('Grilled halloumi with watermelon', 'Canapés', ['Mediterranean', 'Modern'], ['V', 'GF', 'NF', 'EF'], 'Mint and lime'),
  D('Falafel bites with tahini', 'Canapés', ['Mediterranean', 'Plant-based'], ['VG', 'V', 'DF', 'NF', 'EF'], 'Herb falafel, lemon tahini'),

  D('Greek meze platter', 'Starter', ['Greek'], ['V', 'NF'], 'Tzatziki, melitzanosalata, fava, olives, pita'),
  D('Grilled octopus', 'Starter', ['Greek', 'Mediterranean'], ['SH', 'GF', 'DF', 'NF', 'EF'], 'Santorini fava and caper salsa'),
  D('Burrata with heirloom tomatoes', 'Starter', ['Italian', 'Modern'], ['V', 'GF', 'NF', 'EF'], 'Basil oil and aged balsamic'),
  D('Beef tartare', 'Starter', ['Modern', 'Classic'], ['M', 'DF', 'NF'], 'Capers, shallot, quail egg'),
  D('Tuna tataki', 'Starter', ['Modern'], ['FI', 'DF', 'NF', 'EF'], 'Sesame crust, citrus ponzu'),
  D('Roasted beetroot & goat cheese', 'Starter', ['Modern', 'Classic'], ['V', 'GF', 'EF'], 'Candied walnuts, rocket'),
  D('Gemista', 'Starter', ['Greek', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Tomatoes and peppers stuffed with herbed rice'),
  D('Risotto ai funghi (starter)', 'Starter', ['Italian'], ['V', 'GF', 'NF', 'EF'], 'Wild mushrooms and parmesan'),

  D('Avgolemono', 'Soup', ['Greek'], ['GF', 'NF', 'M'], 'Chicken, rice, egg-lemon sauce'),
  D('Roasted tomato & basil soup', 'Soup', ['Mediterranean', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Served with crostini'),
  D('Velouté of wild mushrooms', 'Soup', ['Classic'], ['V', 'GF', 'NF', 'EF'], 'Truffle cream'),
  D('Chilled gazpacho', 'Soup', ['Mediterranean', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Summer weddings'),

  D('Horiatiki (Greek salad)', 'Salad', ['Greek'], ['V', 'GF', 'NF', 'EF'], 'Tomato, cucumber, feta, olives, oregano'),
  D('Cretan dakos', 'Salad', ['Greek'], ['V', 'NF', 'EF'], 'Barley rusk, tomato, mizithra'),
  D('Green salad with figs & prosciutto', 'Salad', ['Mediterranean', 'Italian'], ['M', 'GF', 'DF', 'EF'], 'Balsamic, walnuts'),
  D('Quinoa, pomegranate & herb salad', 'Salad', ['Modern', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Lemon dressing'),
  D('Caesar salad', 'Salad', ['Classic'], ['NF', 'FI'], 'Romaine, parmesan, croutons'),

  D('Slow-roasted lamb kleftiko', 'Main', ['Greek'], ['M', 'GF', 'DF', 'NF', 'EF'], 'Lemon potatoes, oregano'),
  D('Beef tenderloin', 'Main', ['Classic', 'Modern'], ['M', 'GF', 'NF', 'EF'], 'Potato gratin, red wine jus'),
  D('Chicken breast with lemon & thyme', 'Main', ['Mediterranean', 'Classic'], ['M', 'GF', 'DF', 'NF', 'EF'], 'Roast vegetables'),
  D('Pork tenderloin with mavrodaphne', 'Main', ['Greek', 'Modern'], ['M', 'GF', 'DF', 'NF', 'EF'], 'Sweet wine reduction, celeriac purée'),
  D('Sea bass fillet', 'Main', ['Mediterranean', 'Greek'], ['FI', 'GF', 'DF', 'NF', 'EF'], 'Lemon-olive oil, wild greens'),
  D('Salmon with herb crust', 'Main', ['Classic', 'Modern'], ['FI', 'NF', 'EF'], 'Asparagus, beurre blanc'),
  D('Lobster linguine', 'Main', ['Italian', 'Mediterranean'], ['SH', 'DF', 'NF', 'EF'], 'Cherry tomato, chilli, basil'),
  D('Moussaka (vegetarian or classic)', 'Main', ['Greek'], ['V', 'NF'], 'Aubergine, potato, béchamel'),
  D('Wild mushroom risotto', 'Main', ['Italian', 'Classic'], ['V', 'GF', 'NF', 'EF'], 'Parmesan, truffle'),
  D('Stuffed aubergine (imam bayildi)', 'Main', ['Greek', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Tomato, onion, olive oil'),
  D('Roasted cauliflower steak', 'Main', ['Modern', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Tahini, pomegranate, herbs'),
  D('Vegetable Wellington', 'Main', ['Classic', 'Plant-based'], ['VG', 'V', 'DF', 'NF'], 'Mushroom, spinach, chestnut'),
  D('Orzo with seafood (giouvetsi)', 'Main', ['Greek'], ['SH', 'FI', 'NF', 'EF'], 'Tomato, shrimp, mussels'),

  D('Lemon roast potatoes', 'Side', ['Greek'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], ''),
  D('Grilled seasonal vegetables', 'Side', ['Mediterranean', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], ''),
  D('Truffle mashed potatoes', 'Side', ['Classic'], ['V', 'GF', 'NF', 'EF'], ''),
  D('Wild rice pilaf', 'Side', ['Classic'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], ''),

  D('Galaktoboureko', 'Dessert', ['Greek'], ['V', 'NF'], 'Semolina custard in filo, syrup'),
  D('Baklava', 'Dessert', ['Greek'], ['V', 'EF'], 'Walnuts, honey, cinnamon'),
  D('Greek yogurt panna cotta', 'Dessert', ['Greek', 'Modern'], ['V', 'GF', 'NF', 'EF'], 'Thyme honey, figs'),
  D('Tiramisu', 'Dessert', ['Italian'], ['V', 'NF'], ''),
  D('Chocolate fondant', 'Dessert', ['Classic'], ['V', 'NF'], 'Vanilla ice cream'),
  D('Fresh fruit platter', 'Dessert', ['Mediterranean', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Seasonal fruit'),
  D('Dark chocolate mousse (vegan)', 'Dessert', ['Modern', 'Plant-based'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Aquafaba, sea salt'),
  D('Loukoumades', 'Dessert', ['Greek'], ['V', 'DF', 'EF'], 'Honey puffs, cinnamon'),

  D('Vanilla & berry wedding cake', 'Wedding cake', ['Classic'], ['V', 'NF'], 'Mascarpone cream, fresh berries'),
  D('Lemon & elderflower cake', 'Wedding cake', ['Modern'], ['V', 'NF'], 'Light sponge, elderflower syrup'),
  D('Chocolate & salted caramel cake', 'Wedding cake', ['Modern'], ['V'], ''),
  D('Pistachio & rose cake', 'Wedding cake', ['Mediterranean'], ['V'], ''),

  D('Mini souvlaki wraps', 'Late-night', ['Greek'], ['M', 'NF', 'EF'], 'Pork gyros, tzatziki'),
  D('Bougatsa with cinnamon', 'Late-night', ['Greek'], ['V', 'NF'], 'Sweet custard pie'),
  D('Sliders bar', 'Late-night', ['Classic', 'Modern'], ['M', 'NF'], ''),
  D('Margherita pizza squares', 'Late-night', ['Italian'], ['V', 'NF', 'EF'], ''),

  D('Signature cocktail', 'Drinks', ['Modern'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'Named after the couple'),
  D('Greek wines (Assyrtiko & Agiorgitiko)', 'Drinks', ['Greek'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], ''),
  D('Prosecco toast', 'Drinks', ['Italian', 'Classic'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], ''),
  D('Lemonade & mocktails', 'Drinks', ['Classic'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], 'For kids and non-drinkers'),
  D('Tsipouro & ouzo bar', 'Drinks', ['Greek'], ['VG', 'V', 'GF', 'DF', 'NF', 'EF'], ''),

  D('Chicken nuggets & fries', 'Kids', ['Classic'], ['M', 'NF', 'DF'], ''),
  D('Pasta with tomato sauce', 'Kids', ['Italian'], ['VG', 'V', 'DF', 'NF', 'EF'], ''),
  D('Mini pastitsio', 'Kids', ['Greek'], ['M', 'NF'], ''),
];

// What a guest's restriction requires of a dish.
export function fits(tags, restriction) {
  const t = new Set(tags || []);
  switch (restriction) {
    case 'Vegetarian': return t.has('V') || t.has('VG');
    case 'Vegan': return t.has('VG');
    case 'Pescatarian': return t.has('V') || t.has('VG') || t.has('FI') || t.has('SH') ? !t.has('M') : false;
    case 'Gluten-free': return t.has('GF');
    case 'Dairy-free': return t.has('DF') || t.has('VG');
    case 'Nut allergy': return t.has('NF');
    case 'Shellfish allergy': return !t.has('SH');
    case 'Egg allergy': return t.has('EF') || t.has('VG');
    case 'Halal': case 'Kosher': return !t.has('M') || t.has(restriction === 'Halal' ? 'H' : 'K');
    case 'Fasting (νηστεία)': return t.has('VG') || (t.has('SH') && !t.has('M') && !t.has('FI'));
    default: return true;
  }
}
export const TAG_LABELS = { V: 'Vegetarian', VG: 'Vegan', GF: 'Gluten-free', DF: 'Dairy-free', NF: 'Nut-free', EF: 'Egg-free', FI: 'Fish', SH: 'Shellfish', M: 'Meat', H: 'Halal', K: 'Kosher' };
