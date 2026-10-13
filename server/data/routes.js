import { stationByCode } from "./stationData.js";

// Builds a polyline of coordinates for a train's route (station-to-station)
export const buildRoutePolyline = (routeCodes) => {
  const polyline = [];
  routeCodes.forEach((code) => {
    const s = stationByCode(code);
    if (s) polyline.push([s.lat, s.lng]);
  });
  return polyline;
};

// Mock geo-fencing data: rivers, lakes, mountains near stations
export const geoFeatures = {
  rivers: [
    { name: "Ganges", near: ["NDLS", "CNB", "DDU", "BHU", "ALD"], lat: 25.61, lng: 83.07 },
    { name: "Yamuna", near: ["NDLS", "ALD"], lat: 28.5, lng: 77.2 },
    { name: "Godavari", near: ["SC"], lat: 17.0, lng: 79.5 },
    { name: "Krishna", near: ["SC"], lat: 16.5, lng: 80.0 },
    { name: "Mahanadi", near: ["BBS"], lat: 20.3, lng: 85.8 },
    { name: "Hooghly", near: ["HWH"], lat: 22.5, lng: 88.3 },
    { name: "Narmada", near: ["ST"], lat: 21.8, lng: 73.0 },
    { name: "Cauvery", near: ["MYS", "CBE"], lat: 12.4, lng: 76.6 },
  ],
  lakes: [
    { name: "Dal Lake", near: [], lat: 34.1, lng: 74.9 },
    { name: "Chilika Lake", near: ["BBS"], lat: 19.7, lng: 85.3 },
    { name: "Pulicat Lake", near: ["MAS"], lat: 13.5, lng: 80.2 },
    { name: "Vembanad Lake", near: ["ERS"], lat: 9.6, lng: 76.4 },
  ],
  mountains: [
    { name: "Western Ghats", near: ["PUNE", "CBE", "MYS"], lat: 17.0, lng: 73.5 },
    { name: "Himalayas", near: ["NJP", "GHY"], lat: 27.0, lng: 88.0 },
    { name: "Aravalli Range", near: ["JP", "AJMER"], lat: 26.0, lng: 74.0 },
    { name: "Nilgiri Hills", near: ["CBE"], lat: 11.4, lng: 76.7 },
  ],
};

// Mock attractions, food, hotels, medical, atm modules per station
export const travelGuides = {
  NDLS: {
    attractions: ["India Gate", "Red Fort", "Qutub Minar", "Akshardham Temple", "Lotus Temple"],
    food: ["Chole Bhature", "Paranthe Wali Gali", "Butter Chicken", "Kathi Roll"],
    hotels: ["The Lalit", "Taj Palace", "Hotel Royal Plaza"],
    medical: ["AIIMS Delhi", "Safdarjung Hospital"],
    atm: ["SBI ATM", "HDFC ATM", "ICICI ATM"],
    transport: ["Metro", "DTC Bus", "Auto Rickshaw", "Ola/Uber"],
    tips: ["Use Delhi Metro for fast travel", "Visit Connaught Place for shopping"],
  },
  HWH: {
    attractions: ["Howrah Bridge", "Victoria Memorial", "Dakshineswar Temple", "Indian Museum"],
    food: ["Rosogolla", "Kathi Roll", "Fish Curry", "Mishti Doi"],
    hotels: ["The Oberoi Grand", "Hotel Polo", "Hyatt Regency"],
    medical: ["Apollo Hospital", "AMRI Hospital"],
    atm: ["State Bank", "Axis Bank"],
    transport: ["Metro", "Tram", "Taxi", "Ferry"],
    tips: ["Try the yellow ambassador taxis", "Visit Princep Ghat for sunset"],
  },
  CSMT: {
    attractions: ["Gateway of India", "Elephanta Caves", "Marine Drive", "Chhatrapati Shivaji Terminus"],
    food: ["Vada Pav", "Pav Bhaji", "Bhel Puri", "Iranian Chai"],
    hotels: ["Taj Mahal Palace", "The Trident", "ITC Grand Central"],
    medical: ["Lilavati Hospital", "KEM Hospital"],
    atm: ["ICICI", "HDFC"],
    transport: ["Local Train", "Metro", "Bus", "Taxi"],
    tips: ["Avoid local trains during peak hours", "Visit Marine Drive at night"],
  },
  MAS: {
    attractions: ["Marina Beach", "Kapaleeshwarar Temple", "Fort St. George", "Valluvar Kottam"],
    food: ["Idli Sambar", "Dosa", "Filter Coffee", "Chettinad Chicken"],
    hotels: ["The Leela Palace", "ITC Grand Chola", "Radisson Blu"],
    medical: ["Apollo Hospitals", "MIOT Hospital"],
    atm: ["Indian Bank", "ICICI"],
    transport: ["Metro", "MRTS", "Bus", "Auto"],
    tips: ["Try the Marina Beach at dawn", "Visit Mylapore for temples"],
  },
  SBC: {
    attractions: ["Lalbagh Botanical Garden", "Cubbon Park", "Bangalore Palace", "ISKCON Temple"],
    food: ["Masala Dosa", "Bisi Bele Bath", "Filter Coffee", "Kori Rotti"],
    hotels: ["Taj West End", "The Oberoi", "ITC Windsor"],
    medical: ["Fortis Hospital", "Manipal Hospital"],
    atm: ["Canara Bank", "HDFC"],
    transport: ["Metro", "BMTC Bus", "Auto", "Cab"],
    tips: ["Use Bengaluru Metro to avoid traffic", "Visit Nandi Hills for sunrise"],
  },
  BPL: {
    attractions: ["Taj-ul-Masajid", "Van Vihar", "Bhimbetka Caves", "Upper Lake"],
    food: ["Poha Jalebi", "Bhopali Gosht", "Seekh Kebab"],
    hotels: ["Jehan Numa Palace", "Courtyard Marriott", "Hotel Lake View"],
    medical: ["Bansal Hospital", "Apollo Hospitals"],
    atm: ["Union Bank", "SBI"],
    transport: ["Bus", "Auto", "Cab"],
    tips: ["Visit Upper Lake for boating", "Try Bhopali street food"],
  },
  ADI: {
    attractions: ["Sabarmati Ashram", "Kankaria Lake", "Adalaj Stepwell", "Akshardham"],
    food: ["Dhokla", "Khandvi", "Thepla", "Fafda Jalebi"],
    hotels: ["ITC Narmada", "The Ummed", "Crowne Plaza"],
    medical: ["Apollo Hospital", "CIMS Hospital"],
    atm: ["Bank of Baroda", "HDFC"],
    transport: ["BRTS", "Metro", "Auto", "Cab"],
    tips: ["Visit Sabarmati riverfront", "Try the Kankaria lake carnival"],
  },
  PUNE: {
    attractions: ["Shaniwar Wada", "Aga Khan Palace", "Sinhagad Fort", "Osho Ashram"],
    food: ["Misal Pav", "Puran Poli", "Bakarwadi", "Vada Pav"],
    hotels: ["The Conrad", "Hyatt Pune", "JW Marriott"],
    medical: ["Ruby Hall Clinic", "Jehangir Hospital"],
    atm: ["ICICI", "HDFC"],
    transport: ["PMT Bus", "Metro", "Auto", "Cab"],
    tips: ["Try the famous Misal Pav", "Visit Sinhagad for trekking"],
  },
  JP: {
    attractions: ["Hawa Mahal", "Amber Fort", "City Palace", "Jantar Mantar"],
    food: ["Dal Baati Churma", "Ghevar", "Laal Maas", "Pyaz Kachori"],
    hotels: ["Rambagh Palace", "ITC Rajputana", "Fairmont"],
    medical: ["SMS Hospital", "Fortis Hospital"],
    atm: ["Bank of Rajasthan", "HDFC"],
    transport: ["Bus", "Auto", "Cab", "Tuk-tuk"],
    tips: ["Visit Amber Fort at sunset", "Explore the Pink City markets"],
  },
};

export const nextStation = (route, currentIndex) => {
  if (currentIndex < route.length - 1) return stationByCode(route[currentIndex + 1]);
  return null;
};

// Travel companion data: weather, safety, emergency
export const companionData = {
  weather: {
    NDLS: { temp: 24, humidity: 55, wind: 12, condition: "Partly Cloudy", rain: 10 },
    HWH: { temp: 28, humidity: 78, wind: 8, condition: "Humid", rain: 20 },
    CSMT: { temp: 30, humidity: 82, wind: 15, condition: "Rainy", rain: 60 },
    SBC: { temp: 26, humidity: 60, wind: 10, condition: "Clear", rain: 5 },
    MAS: { temp: 31, humidity: 80, wind: 18, condition: "Humid", rain: 25 },
    BPL: { temp: 27, humidity: 58, wind: 9, condition: "Clear", rain: 8 },
    ADI: { temp: 29, humidity: 65, wind: 11, condition: "Sunny", rain: 5 },
    PUNE: { temp: 25, humidity: 55, wind: 14, condition: "Clear", rain: 3 },
    JP: { temp: 28, humidity: 48, wind: 13, condition: "Sunny", rain: 0 },
    KGP: { temp: 30, humidity: 75, wind: 9, condition: "Humid", rain: 15 },
    GAYA: { temp: 29, humidity: 70, wind: 7, condition: "Partly Cloudy", rain: 12 },
    DDU: { temp: 28, humidity: 72, wind: 8, condition: "Humid", rain: 18 },
    CNB: { temp: 27, humidity: 68, wind: 10, condition: "Clear", rain: 6 },
    GWL: { temp: 26, humidity: 55, wind: 9, condition: "Clear", rain: 4 },
    JHS: { temp: 27, humidity: 60, wind: 10, condition: "Partly Cloudy", rain: 7 },
    ST: { temp: 31, humidity: 78, wind: 16, condition: "Rainy", rain: 55 },
    KOTA: { temp: 29, humidity: 52, wind: 12, condition: "Sunny", rain: 2 },
    PNBE: { temp: 28, humidity: 75, wind: 8, condition: "Humid", rain: 16 },
    SC: { temp: 30, humidity: 65, wind: 13, condition: "Partly Cloudy", rain: 10 },
    NJP: { temp: 24, humidity: 72, wind: 6, condition: "Cloudy", rain: 30 },
    CDG: { temp: 23, humidity: 50, wind: 11, condition: "Clear", rain: 5 },
    ASR: { temp: 22, humidity: 48, wind: 10, condition: "Clear", rain: 3 },
    ERS: { temp: 29, humidity: 85, wind: 14, condition: "Rainy", rain: 70 },
    CBE: { temp: 28, humidity: 65, wind: 12, condition: "Partly Cloudy", rain: 15 },
    MYS: { temp: 25, humidity: 62, wind: 9, condition: "Clear", rain: 8 },
    BBS: { temp: 30, humidity: 76, wind: 12, condition: "Humid", rain: 20 },
    ALD: { temp: 28, humidity: 70, wind: 8, condition: "Partly Cloudy", rain: 12 },
    BHU: { temp: 28, humidity: 72, wind: 7, condition: "Humid", rain: 14 },
    LKO: { temp: 27, humidity: 65, wind: 9, condition: "Clear", rain: 6 },
  },
  safety: {
    helpline: "139",
    womenHelpline: "182",
    cyber: "1930",
    railwayControl: "044 2533 4380",
    notes: [
      "Keep belongings close in crowded stations",
      "Use official railway helpline 139 for assistance",
      "Download the RailMadad app for quick complaints",
      "Avoid accepting food from strangers",
    ],
  },
  emergency: {
    police: "100",
    ambulance: "108",
    fire: "101",
    railway: "139",
  },
};
