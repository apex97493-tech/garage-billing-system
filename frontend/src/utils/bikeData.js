/**
 * Multi-Brand Motorcycle Data & Workshop Presets
 * Covers all major domestic, international, superbike, custom, and EV two-wheelers.
 */

export const WORKSHOP_TYPES = [
  {
    id: 'custom_modifier',
    name: 'Custom Bike Builder & Modification Studio',
    desc: 'Cafe Racers, Bobbers, Scramblers, Custom Metal Fabrication & Paint'
  },
  {
    id: 'multi_brand_service',
    name: 'Multi-Brand Motorcycle Service & Repair Center',
    desc: 'Routine Service, Oil Change, Engine Overhaul, Brake & Chain Maintenance'
  },
  {
    id: 'superbike_performance',
    name: 'Superbike & High-Performance Garage',
    desc: 'ECU Remapping, Dyno Tuning, Racing Exhausts, Suspension Tuning'
  },
  {
    id: 'ev_workshop',
    name: 'Electric 2-Wheeler & EV Service Center',
    desc: 'Battery Diagnostics, Motor Hub Overhaul, Controller Check & Rewiring'
  },
  {
    id: 'detailing_paint',
    name: 'Detailing, Paint & Custom Wrap Studio',
    desc: 'Ceramic Coating, PPF Wrap, Candy Paint Jobs & Powder Coating'
  }
];

export const MOTORCYCLE_BRANDS = [
  {
    brand: 'Royal Enfield',
    models: [
      'Continental GT 650', 'Interceptor 650', 'Himalayan 450', 'Hunter 350', 
      'Classic 350', 'Bullet 350', 'Meteor 350', 'Super Meteor 650', 
      'Guerrilla 450', 'Shotgun 650', 'Scram 411', 'Classic 500 / Bullet 500', 
      'Thunderbird 350 / 500', 'Continental GT 535'
    ]
  },
  {
    brand: 'KTM & Husqvarna',
    models: [
      'Duke 390', 'Duke 250', 'Duke 200', 'RC 390', 'RC 200', 
      '390 Adventure', '250 Adventure', 'Svartpilen 401', 'Vitpilen 250', '890 Duke R'
    ]
  },
  {
    brand: 'Yamaha',
    models: [
      'YZF-R15 V4 / V3', 'MT-15 V2', 'FZ-S Fi / FZ-X', 'Aerox 155', 
      'RayZR 125', 'Fascino 125', 'RD350 (2-Stroke Classic)', 'RX100 / RX135', 'MT-03 / R3', 'FZ-25'
    ]
  },
  {
    brand: 'Honda',
    models: [
      'Hness CB350 / CB350RS', 'CB300R', 'CB300F', 'CBR 650R', 
      'Hornet 2.0', 'X-Blade', 'Unicorn 160', 'SP 125 / Shine', 
      'Activa 6G / 125', 'Dio 125', 'Transalp XL750', 'Africa Twin'
    ]
  },
  {
    brand: 'Bajaj & Triumph',
    models: [
      'Triumph Speed 400', 'Triumph Scrambler 400X', 'Dominar 400 / 250', 
      'Pulsar NS400Z', 'Pulsar NS200', 'Pulsar RS200', 'Pulsar N250 / N160', 
      'Pulsar 150 / 220F', 'Avenger Cruise 220', 'Chetak EV'
    ]
  },
  {
    brand: 'TVS',
    models: [
      'Apache RR 310', 'Apache RTR 310', 'Apache RTR 200 4V', 'Apache RTR 160 4V', 
      'Ronin 225', 'Raider 125', 'Ntorq 125 / Race XP', 'Jupiter 125 / 110', 'iQube Electric'
    ]
  },
  {
    brand: 'Suzuki',
    models: [
      'Hayabusa GSX1300R', 'GSX-8R / V-Strom 800DE', 'V-Strom SX 250', 
      'Gixxer SF 250 / Gixxer 150', 'Access 125', 'Burgman Street 125', 'Avenis 125'
    ]
  },
  {
    brand: 'Kawasaki',
    models: [
      'Ninja ZX-10R', 'Ninja ZX-6R', 'Ninja ZX-4R', 'Ninja 650', 'Ninja 500 / 400 / 300', 
      'Z900', 'Z650', 'Versys 650', 'Eliminator 450', 'Vulcan S 650'
    ]
  },
  {
    brand: 'Harley-Davidson & Triumph',
    models: [
      'Harley X440', 'Iron 883', 'Forty-Eight', 'Street 750', 'Fat Boy 114', 
      'Pan America 1250', 'Triumph Bonneville T120 / T100', 'Triumph Street Triple 765', 'Triumph Tiger 900'
    ]
  },
  {
    brand: 'BMW & Ducati',
    models: [
      'BMW G 310 R', 'BMW G 310 GS', 'BMW S 1000 RR', 'BMW R 1250 GS / 1300 GS', 
      'Ducati Monster 937', 'Ducati Panigale V2 / V4', 'Ducati Scrambler 800', 'Ducati Multistrada V4'
    ]
  },
  {
    brand: 'Hero MotoCorp',
    models: [
      'Mavrick 440', 'Karizma XMR 210', 'Xpulse 200 4V / 200T', 'Xtreme 160R / 125R', 
      'Splendor Plus / XTEC', 'HF Deluxe', 'Glamour 125', 'Destini 125'
    ]
  },
  {
    brand: 'Jawa & Yezdi',
    models: [
      'Jawa 42 / 42 Bobber', 'Jawa 350 / Classic', 'Jawa Perak (Bobber)', 
      'Yezdi Roadster', 'Yezdi Scrambler', 'Yezdi Adventure'
    ]
  },
  {
    brand: 'Electric (EV) Two-Wheelers',
    models: [
      'Ather 450X / 450 Apex / Rizta', 'Ola S1 Pro / S1 Air / S1 X', 
      'TVS iQube ST / S', 'Bajaj Chetak Premium', 'Revolt RV400', 
      'Ultraviolette F77 Mach 2', 'River Indie', 'Simple One'
    ]
  },
  {
    brand: 'Custom / Bespoke',
    models: [
      'Handcrafted Hardtail Chopper', 'Custom Bobber Conversion', 
      'Bespoke Cafe Racer Build', 'Scrambler Flat-Tracker', 
      'Vintage 2-Stroke Restomod', 'Custom Drag / Track Bike'
    ]
  }
];

export const SERVICE_JOB_TYPES = [
  'General Periodic Service & Tuning',
  'Full Bespoke Custom Build',
  'Cafe Racer Conversion',
  'Bobber / Chopper Conversion',
  'Scrambler / Adventure Build',
  'Major Engine Overhaul & Rebuild',
  'Accident Repair & Structural Claim',
  'ECU Remap, Dyno & Exhaust Tune',
  'Custom Candy / Metallic Paint Job',
  'Complete Frame Powder Coating',
  'Brake System Overhaul & ABS Bleed',
  'Suspension & Fork Revalve / Seal',
  'Ceramic Coating & Paint Protection',
  'Electrical Diagnostics & Rewiring',
  'EV Battery & Motor Diagnostics'
];
