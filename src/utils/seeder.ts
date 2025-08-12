import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../modules/user/user.model';
// Load environment variables
dotenv.config();

// Sample data for default users
const usersData = [

  ////////// Super Admin
  {
    name: 'SuperAdmin',
    email: 'a@gmail.com',
    password: '$2b$12$cxPF29g99duEaWshhIjW6.TXTEzCccwZaL8jil3gFvhMjogg4HxiW', // Hashed password
    profileImage: {
      imageUrl: "/uploads/users/user.png",
      
    },
    status: "active",
    role: "admin",
    subscriptionType: "free",
    isEmailVerified: true,
    isDeleted: false,
    isResetPassword: true,
    failedLoginAttempts: 0,
    stripe_customer_id: null,
    authProvider: "local",
    phoneNumber: "01700000000",
    address: "West NGong",
    isGoogleVerified: false,
    isAppleVerified: false,
    canMessage: true,
    companyLogoImage: []
  },

////////// Manager 1
  {
  conversation_restrict_with: [],
  name: "man1",
  email: "m1@gmail.com",
  profileImage: {
    imageUrl: "https://sheakh-bucket-express.s3.eu-north-1.amazonaws.com/sikring-camera/user/1753094870878-TestImage_Sheakh.png",
  },
  status: "active",
  role: "manager",
  password: "$2b$12$tm/ngsjgTkmubSP5lMfISOOVBuLvts9ri1uxAVlq7Wk/X140leFwK",
  fcmToken: "cOLKxnGSTQ-WEtJ7kw_q-I:APA91bEVLxsJBq1HO8-4KK5fXvOEUA7ngkkuibIYMKqAbGGcj7SprgjgC1iJqABdECc2rO2ey7d66-ytKunV2ccYoTUYnGQIprGBH-918rbU3zopH3FLwgM",
  subscriptionType: "free",
  isEmailVerified: true,
  isDeleted: false,
  isResetPassword: false,
  failedLoginAttempts: 0,
  stripe_customer_id: null,
  authProvider: "local",
  isGoogleVerified: false,
  isAppleVerified: false,
  phoneNumber: "01700000000",
  address: "Dhaka, Bangladesh",
  
  canMessage: true,
  companyLogoImage: []
},

////////// Manager 2
  {
  conversation_restrict_with: [],
  name: "man2",
  email: "m2@gmail.com",
  profileImage: {
    imageUrl: "/uploads/users/user.png",
    
  },
  status: "active",
  role: "manager",
  password: "$2b$12$kqVhLDJvVUJR2qSHZ/eJ/OYWCVUAX9ubU.JXjKzgGoVjqUU5iID0e",
  fcmToken: "cOLKxnGSTQ-WEtJ7kw_q-I:APA91bEVLxsJBq1HO8-4KK5fXvOEUA7ngkkuibIYMKqAbGGcj7SprgjgC1iJqABdECc2rO2ey7d66-ytKunV2ccYoTUYnGQIprGBH-918rbU3zopH3FLwgM",
  subscriptionType: "free",
  isEmailVerified: true,
  isDeleted: false,
  isResetPassword: false,
  failedLoginAttempts: 0,
  stripe_customer_id: null,
  authProvider: "local",
  phoneNumber: "01700000000",
  address: "Dhaka, Bangladesh",
  isGoogleVerified: false,
  isAppleVerified: false,
  
},

////////// User 2
{
  conversation_restrict_with: [],
  name: "User 2",
  email: "us2@gmail.com",
  profileImage: {
    imageUrl: "https://sheakh-bucket-express.s3.eu-north-1.amazonaws.com/sikring-camera/user/1754512884750-webp_1754512886366_1000000034.webp",
  },
  status: "active",
  role: "user",
  password: "$2b$12$vg2FrhHw9nNhBnUzEVl4YuqawJxpJi4N4OoXyvkw26birqH3U18Rm",
  fcmToken: "cOLKxnGSTQ-WEtJ7kw_q-I:APA91bEVLxsJBq1HO8-4KK5fXvOEUA7ngkkuibIYMKqAbGGcj7SprgjgC1iJqABdECc2rO2ey7d66-ytKunV2ccYoTUYnGQIprGBH-918rbU3zopH3FLwgM",
  subscriptionType: "free",
  isEmailVerified: true,
  isDeleted: false,
  phoneNumber: "01700000000",
  address: "Cus 1 Pro Address",
  isResetPassword: false,
  failedLoginAttempts: 0,
  stripe_customer_id: null,
  authProvider: "local",
  isGoogleVerified: false,
  isAppleVerified: false,
  
  canMessage: true,
  companyLogoImage: []
},

////////// User 1

{
  
  conversation_restrict_with: [],
  name: "user1",
  email: "us1@gmail.com",
  profileImage: {
    imageUrl: "/uploads/users/user.png",
    
  },
  status: "active",
  role: "user",
  password: "$2b$12$5/OH4UgBh1oovdSMmWOvO...xOFDGUrl8oMwe3c1PM6xCv7dDgxLi",
  fcmToken: "cOLKxnGSTQ-WEtJ7kw_q-I:APA91bEVLxsJBq1HO8-4KK5fXvOEUA7ngkkuibIYMKqAbGGcj7SprgjgC1iJqABdECc2rO2ey7d66-ytKunV2ccYoTUYnGQIprGBH-918rbU3zopH3FLwgM",
  subscriptionType: "free",
  isEmailVerified: true,
  isDeleted: false,
  isResetPassword: false,
  failedLoginAttempts: 0,
  stripe_customer_id: null,
  authProvider: "local",
  isGoogleVerified: false,
  isAppleVerified: false,
  phoneNumber: "01700000000",
  address: "Dhaka, Bangladesh",
}
  
];

// Function to drop the entire database
const dropDatabase = async () => {
  try {
    await mongoose.connection.dropDatabase();
    console.log('------------> Database dropped successfully! <------------');
  } catch (err) {
    console.error('Error dropping database:', err);
  }
};

// Function to seed users
const seedUsers = async () => {
  try {
    await User.deleteMany();
    await User.insertMany(usersData);
    console.log('Users seeded successfully!');
  } catch (err) {
    console.error('Error seeding users:', err);
  }
};

// Connect to MongoDB
const connectToDatabase = async () => {
  try {
    const dbUrl = process.env.MONGODB_URL;
    if (!dbUrl) throw new Error('MONGODB_URL not set in environment variables');

    await mongoose.connect(dbUrl);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit process with failure
  }
};

// Main function to seed the database
const seedDatabase = async () => {
  try {
    await connectToDatabase();
    await dropDatabase();
    await seedUsers();
    console.log('--------------> Database seeding completed <--------------');
  } catch (err) {
    console.error('Error seeding database:', err);
  } finally {
    mongoose.disconnect().then(() => console.log('Disconnected from MongoDB'));
  }
};

// Execute seeding
seedDatabase();
