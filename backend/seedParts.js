import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Part from './models/Part.js';

dotenv.config();

const parts = [
  { name: "Semi-Synthetic Engine Oil (15W50) 2.5L Can", basePrice: 1050, gstRate: 18, stock: 50 },
  { name: "Fully Synthetic Engine Oil 15W50 (1L)", basePrice: 650, gstRate: 18, stock: 50 },
  { name: "Front Fork Oil (350 ml)", basePrice: 160, gstRate: 18, stock: 50 },
  { name: "Engine Oil Filter Element + O-Ring", basePrice: 95, gstRate: 18, stock: 50 },
  { name: "Air Filter Element (J-Series / BS6)", basePrice: 220, gstRate: 18, stock: 50 },
  { name: "Air Filter Element (Old UCE BS3/BS4)", basePrice: 190, gstRate: 18, stock: 50 },
  { name: "Himalayan 411/450 Air Filter", basePrice: 350, gstRate: 18, stock: 50 },
  { name: "Front Disc Brake Pads (Bybre / Brembo)", basePrice: 350, gstRate: 18, stock: 50 },
  { name: "Rear Disc Brake Pads", basePrice: 320, gstRate: 18, stock: 50 },
  { name: "Rear Brake Shoe (Drum Models)", basePrice: 260, gstRate: 18, stock: 50 },
  { name: "Bosch / NGK Spark Plug (Twinspark Set)", basePrice: 180, gstRate: 18, stock: 50 },
  { name: "J-Series Single Spark Plug", basePrice: 140, gstRate: 18, stock: 50 },
  { name: "Headlight Halogen Bulb (H4 12V 60/55W)", basePrice: 160, gstRate: 18, stock: 50 },
  { name: "Exide / Amaron 12V 14Ah Battery", basePrice: 2800, gstRate: 28, stock: 50 },
  { name: "Clutch Cable (Genuine RE)", basePrice: 140, gstRate: 18, stock: 50 },
  { name: "Accelerator / Throttle Cable", basePrice: 130, gstRate: 18, stock: 50 },
  { name: "Brake / Clutch Lever Handle", basePrice: 180, gstRate: 18, stock: 50 },
  { name: "Rolon Brass Chain & Sprocket Kit", basePrice: 2150, gstRate: 28, stock: 50 },
  { name: "Rolon Standard Chain Sprocket Kit", basePrice: 1950, gstRate: 28, stock: 50 },
  { name: "Clutch Plate Set (Friction Plates)", basePrice: 850, gstRate: 18, stock: 50 },
  { name: "Chain Lube & Cleaner Spray Combo (500ml)", basePrice: 280, gstRate: 18, stock: 50 }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Optional: await Part.deleteMany({}); // Uncomment if you want to clear existing parts first

    await Part.insertMany(parts);
    console.log(`${parts.length} parts added successfully!`);

    mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
  }
};

seedDB();
