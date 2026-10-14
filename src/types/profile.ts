export interface UserSurveyProfile {
  // Core Demographics
  age: string;
  gender: string;
  country: string;
  stateProvince: string;
  postalCode: string;

  // Household & Lifestyle
  householdIncome: string;
  householdSize: string;
  maritalStatus: string;
  homeOwnership: string;
  childrenDependents: string;

  // Professional & Education
  employmentStatus: string;
  occupationCategory: string;
  educationLevel: string;

  // Assets & Mobility
  vehicleOwnership: string;
  primaryVehicleType: string;

  // Consumer Habits & Tech
  technologyDevices: string;
  shoppingCategories: string;
  travelFrequency: string;
  hobbiesInterests: string;
  financialProducts: string;
  mediaStreamingHabits: string;

  // Additional custom attributes provided by user
  customAttributes?: Record<string, string>;
}

export const INITIAL_USER_PROFILE: UserSurveyProfile = {
  age: '',
  gender: '',
  country: '',
  stateProvince: '',
  postalCode: '',
  householdIncome: '',
  householdSize: '',
  maritalStatus: '',
  homeOwnership: '',
  childrenDependents: '',
  employmentStatus: '',
  occupationCategory: '',
  educationLevel: '',
  vehicleOwnership: '',
  primaryVehicleType: '',
  technologyDevices: '',
  shoppingCategories: '',
  travelFrequency: '',
  hobbiesInterests: '',
  financialProducts: '',
  mediaStreamingHabits: '',
  customAttributes: {},
};

export const PROFILE_CATEGORIES = [
  {
    id: 'demographics',
    title: 'Core Demographics',
    fields: [
      { key: 'age', label: 'Age', placeholder: 'e.g. 24' },
      { key: 'gender', label: 'Gender', placeholder: 'e.g. Male / Female / Non-binary' },
      { key: 'country', label: 'Country', placeholder: 'e.g. United States, Bangladesh' },
      { key: 'stateProvince', label: 'State / Province / Region', placeholder: 'e.g. California, Dhaka' },
      { key: 'postalCode', label: 'ZIP / Postal Code', placeholder: 'e.g. 94105, 1205' },
    ],
  },
  {
    id: 'professional',
    title: 'Employment & Education',
    fields: [
      { key: 'employmentStatus', label: 'Employment Status', placeholder: 'e.g. Employed full-time, Student, Self-employed' },
      { key: 'occupationCategory', label: 'Occupation / Industry', placeholder: 'e.g. Software Engineer, Marketing, Education' },
      { key: 'educationLevel', label: 'Education Level', placeholder: 'e.g. Bachelor\'s degree, High school' },
      { key: 'householdIncome', label: 'Household Income', placeholder: 'e.g. $50,000 - $75,000 / year' },
    ],
  },
  {
    id: 'household',
    title: 'Household & Family',
    fields: [
      { key: 'householdSize', label: 'Household Size', placeholder: 'e.g. 3 people' },
      { key: 'maritalStatus', label: 'Marital Status', placeholder: 'e.g. Single, Married' },
      { key: 'homeOwnership', label: 'Homeownership', placeholder: 'e.g. Own home, Rent apartment' },
      { key: 'childrenDependents', label: 'Children / Dependents', placeholder: 'e.g. None, 1 child under 18' },
    ],
  },
  {
    id: 'vehicles_travel',
    title: 'Mobility & Travel',
    fields: [
      { key: 'vehicleOwnership', label: 'Vehicle Ownership', placeholder: 'e.g. Own, Lease, None' },
      { key: 'primaryVehicleType', label: 'Primary Vehicle Type', placeholder: 'e.g. Sedan, SUV, Motorcycle, None' },
      { key: 'travelFrequency', label: 'Travel Frequency', placeholder: 'e.g. 1-2 flights/year for leisure' },
    ],
  },
  {
    id: 'tech_lifestyle',
    title: 'Technology & Habits',
    fields: [
      { key: 'technologyDevices', label: 'Devices Owned', placeholder: 'e.g. iPhone, Windows Laptop, iPad, Smart TV' },
      { key: 'shoppingCategories', label: 'Frequent Purchases', placeholder: 'e.g. Groceries, Electronics, Apparel' },
      { key: 'financialProducts', label: 'Financial Products', placeholder: 'e.g. Checking account, Credit cards, Stocks' },
      { key: 'mediaStreamingHabits', label: 'Streaming Services', placeholder: 'e.g. Netflix, YouTube Premium, Spotify' },
      { key: 'hobbiesInterests', label: 'Hobbies & Interests', placeholder: 'e.g. Gaming, Fitness, Photography' },
    ],
  },
] as const;
