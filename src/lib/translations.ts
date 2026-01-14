// Bilingual translations - Georgian (ka) first, English (en) second
// All text is displayed in both languages simultaneously

export const t = {
  // Common
  common: {
    appName: { ka: 'SmartCheckin.ge', en: 'SmartCheckin.ge' },
    loading: { ka: 'იტვირთება...', en: 'Loading...' },
    save: { ka: 'შენახვა', en: 'Save' },
    cancel: { ka: 'გაუქმება', en: 'Cancel' },
    delete: { ka: 'წაშლა', en: 'Delete' },
    edit: { ka: 'რედაქტირება', en: 'Edit' },
    add: { ka: 'დამატება', en: 'Add' },
    search: { ka: 'ძებნა', en: 'Search' },
    filter: { ka: 'ფილტრი', en: 'Filter' },
    actions: { ka: 'მოქმედებები', en: 'Actions' },
    yes: { ka: 'დიახ', en: 'Yes' },
    no: { ka: 'არა', en: 'No' },
    back: { ka: 'უკან', en: 'Back' },
    next: { ka: 'შემდეგი', en: 'Next' },
    submit: { ka: 'გაგზავნა', en: 'Submit' },
    close: { ka: 'დახურვა', en: 'Close' },
    required: { ka: 'სავალდებულო', en: 'Required' },
    optional: { ka: 'არასავალდებულო', en: 'Optional' },
    success: { ka: 'წარმატება', en: 'Success' },
    error: { ka: 'შეცდომა', en: 'Error' },
    warning: { ka: 'გაფრთხილება', en: 'Warning' },
  },

  // Authentication
  auth: {
    login: { ka: 'შესვლა', en: 'Login' },
    logout: { ka: 'გასვლა', en: 'Logout' },
    email: { ka: 'ელ.ფოსტა', en: 'Email' },
    password: { ka: 'პაროლი', en: 'Password' },
    loginButton: { ka: 'სისტემაში შესვლა', en: 'Sign In' },
    invalidCredentials: { ka: 'არასწორი მონაცემები', en: 'Invalid credentials' },
    adminLogin: { ka: 'ადმინისტრატორის შესვლა', en: 'Admin Login' },
    ownerLogin: { ka: 'მფლობელის შესვლა', en: 'Owner Login' },
  },

  // Navigation
  nav: {
    dashboard: { ka: 'მთავარი', en: 'Dashboard' },
    apartments: { ka: 'ბინები', en: 'Apartments' },
    reservations: { ka: 'დაჯავშნები', en: 'Reservations' },
    guests: { ka: 'სტუმრები', en: 'Guests' },
    owners: { ka: 'მფლობელები', en: 'Owners' },
    settings: { ka: 'პარამეტრები', en: 'Settings' },
    locks: { ka: 'საკეტები', en: 'Smart Locks' },
    monitoring: { ka: 'მონიტორინგი', en: 'Monitoring' },
  },

  // Dashboard
  dashboard: {
    welcome: { ka: 'მოგესალმებით', en: 'Welcome' },
    overview: { ka: 'მიმოხილვა', en: 'Overview' },
    totalApartments: { ka: 'სულ ბინები', en: 'Total Apartments' },
    totalReservations: { ka: 'სულ დაჯავშნები', en: 'Total Reservations' },
    activeGuests: { ka: 'აქტიური სტუმრები', en: 'Active Guests' },
    pendingCheckins: { ka: 'მოლოდინში', en: 'Pending Check-ins' },
    todayCheckins: { ka: 'დღევანდელი შემოსვლები', en: "Today's Check-ins" },
    todayCheckouts: { ka: 'დღევანდელი გასვლები', en: "Today's Check-outs" },
    recentActivity: { ka: 'ბოლო აქტივობა', en: 'Recent Activity' },
  },

  // Apartments
  apartments: {
    title: { ka: 'ბინები', en: 'Apartments' },
    addApartment: { ka: 'ბინის დამატება', en: 'Add Apartment' },
    editApartment: { ka: 'ბინის რედაქტირება', en: 'Edit Apartment' },
    name: { ka: 'დასახელება', en: 'Name' },
    address: { ka: 'მისამართი', en: 'Address' },
    description: { ka: 'აღწერა', en: 'Description' },
    icalUrl: { ka: 'iCal ბმული', en: 'iCal URL' },
    icalUrlHelp: { ka: 'Airbnb/Booking.com კალენდრის ბმული', en: 'Airbnb/Booking.com calendar link' },
    status: { ka: 'სტატუსი', en: 'Status' },
    active: { ka: 'აქტიური', en: 'Active' },
    inactive: { ka: 'არააქტიური', en: 'Inactive' },
    smartLock: { ka: 'ჭკვიანი საკეტი', en: 'Smart Lock' },
    noLock: { ka: 'საკეტი არ არის', en: 'No lock connected' },
    connectLock: { ka: 'საკეტის დაკავშირება', en: 'Connect Lock' },
    lastSync: { ka: 'ბოლო სინქრონიზაცია', en: 'Last Sync' },
    syncNow: { ka: 'სინქრონიზაცია', en: 'Sync Now' },
  },

  // Reservations
  reservations: {
    title: { ka: 'დაჯავშნები', en: 'Reservations' },
    addReservation: { ka: 'დაჯავშნის დამატება', en: 'Add Reservation' },
    editReservation: { ka: 'დაჯავშნის რედაქტირება', en: 'Edit Reservation' },
    guestName: { ka: 'სტუმრის სახელი', en: 'Guest Name' },
    guestEmail: { ka: 'სტუმრის ელ.ფოსტა', en: 'Guest Email' },
    guestPhone: { ka: 'სტუმრის ტელეფონი', en: 'Guest Phone' },
    checkIn: { ka: 'შემოსვლა', en: 'Check-in' },
    checkOut: { ka: 'გასვლა', en: 'Check-out' },
    source: { ka: 'წყარო', en: 'Source' },
    manual: { ka: 'ხელით', en: 'Manual' },
    airbnb: { ka: 'Airbnb', en: 'Airbnb' },
    booking: { ka: 'Booking.com', en: 'Booking.com' },
    status: { ka: 'სტატუსი', en: 'Status' },
    pending: { ka: 'მოლოდინში', en: 'Pending' },
    checkedIn: { ka: 'შემოსული', en: 'Checked In' },
    completed: { ka: 'დასრულებული', en: 'Completed' },
    cancelled: { ka: 'გაუქმებული', en: 'Cancelled' },
    sendCheckinLink: { ka: 'ბმულის გაგზავნა', en: 'Send Check-in Link' },
    viewDetails: { ka: 'დეტალები', en: 'View Details' },
    notes: { ka: 'შენიშვნები', en: 'Notes' },
  },

  // Owners
  owners: {
    title: { ka: 'მფლობელები', en: 'Owners' },
    addOwner: { ka: 'მფლობელის დამატება', en: 'Add Owner' },
    editOwner: { ka: 'მფლობელის რედაქტირება', en: 'Edit Owner' },
    name: { ka: 'სახელი', en: 'Name' },
    email: { ka: 'ელ.ფოსტა', en: 'Email' },
    phone: { ka: 'ტელეფონი', en: 'Phone' },
    depositEnabled: { ka: 'დეპოზიტი ჩართულია', en: 'Deposit Enabled' },
    depositAmount: { ka: 'დეპოზიტის თანხა', en: 'Deposit Amount' },
    apartmentsCount: { ka: 'ბინების რაოდენობა', en: 'Apartments Count' },
  },

  // Guest Check-in
  guest: {
    welcomeTitle: { ka: 'კეთილი იყოს თქვენი მობრძანება', en: 'Welcome' },
    welcomeSubtitle: { ka: 'გთხოვთ დაასრულოთ რეგისტრაცია', en: 'Please complete your check-in' },

    // Steps
    step1: { ka: 'ნაბიჯი 1', en: 'Step 1' },
    step2: { ka: 'ნაბიჯი 2', en: 'Step 2' },
    step3: { ka: 'ნაბიჯი 3', en: 'Step 3' },
    step4: { ka: 'ნაბიჯი 4', en: 'Step 4' },

    // Passport Upload
    uploadPassport: { ka: 'პასპორტის ატვირთვა', en: 'Upload Passport' },
    uploadPassportDesc: { ka: 'გთხოვთ ატვირთოთ თქვენი პასპორტის ფოტო', en: 'Please upload a photo of your passport' },
    dragDropFiles: { ka: 'გადმოიტანეთ ფაილები ან დააწკაპუნეთ', en: 'Drag & drop files or click to browse' },
    supportedFormats: { ka: 'მხარდაჭერილი ფორმატები: JPG, PNG, PDF', en: 'Supported formats: JPG, PNG, PDF' },
    maxFileSize: { ka: 'მაქსიმალური ზომა: 10MB', en: 'Maximum size: 10MB' },
    uploadedFiles: { ka: 'ატვირთული ფაილები', en: 'Uploaded Files' },
    removeFile: { ka: 'წაშლა', en: 'Remove' },

    // Consent
    consent: { ka: 'თანხმობა', en: 'Consent' },
    consentTitle: { ka: 'პირადი მონაცემების დამუშავება', en: 'Data Processing Consent' },
    consentText: {
      ka: 'მე ვადასტურებ, რომ წავიკითხე და ვეთანხმები პირადი მონაცემების დამუშავების პირობებს. ჩემი პასპორტის მონაცემები შეინახება საქართველოს კანონმდებლობის შესაბამისად.',
      en: 'I confirm that I have read and agree to the personal data processing terms. My passport data will be stored in accordance with Georgian legislation.',
    },
    agreeConsent: { ka: 'ვეთანხმები', en: 'I Agree' },

    // Deposit
    deposit: { ka: 'დეპოზიტი', en: 'Deposit' },
    depositRequired: { ka: 'საჭიროა დეპოზიტის გადახდა', en: 'Deposit payment required' },
    depositAmount: { ka: 'დეპოზიტის თანხა', en: 'Deposit Amount' },
    depositInfo: { ka: 'დეპოზიტი დაგიბრუნდებათ გასვლის შემდეგ', en: 'Deposit will be refunded after check-out' },
    payDeposit: { ka: 'დეპოზიტის გადახდა', en: 'Pay Deposit' },
    depositPaid: { ka: 'დეპოზიტი გადახდილია', en: 'Deposit Paid' },

    // Success
    checkInComplete: { ka: 'რეგისტრაცია დასრულებულია', en: 'Check-in Complete' },
    accessCode: { ka: 'წვდომის კოდი', en: 'Access Code' },
    accessCodeInfo: { ka: 'გამოიყენეთ ეს კოდი კარის გასახსნელად', en: 'Use this code to unlock the door' },
    validFrom: { ka: 'მოქმედია', en: 'Valid from' },
    validUntil: { ka: 'მოქმედებს', en: 'Valid until' },
    apartmentInfo: { ka: 'ბინის ინფორმაცია', en: 'Apartment Information' },
    address: { ka: 'მისამართი', en: 'Address' },

    // Errors
    invalidLink: { ka: 'არასწორი ბმული', en: 'Invalid Link' },
    linkExpired: { ka: 'ბმულს ვადა გაუვიდა', en: 'Link has expired' },
    reservationNotFound: { ka: 'დაჯავშნა ვერ მოიძებნა', en: 'Reservation not found' },
    uploadError: { ka: 'ატვირთვის შეცდომა', en: 'Upload error' },
    paymentError: { ka: 'გადახდის შეცდომა', en: 'Payment error' },
  },

  // Smart Locks
  locks: {
    title: { ka: 'ჭკვიანი საკეტები', en: 'Smart Locks' },
    connectTTLock: { ka: 'TTLock-ის დაკავშირება', en: 'Connect TTLock' },
    lockName: { ka: 'საკეტის სახელი', en: 'Lock Name' },
    lockId: { ka: 'საკეტის ID', en: 'Lock ID' },
    status: { ka: 'სტატუსი', en: 'Status' },
    online: { ka: 'ონლაინ', en: 'Online' },
    offline: { ka: 'ოფლაინ', en: 'Offline' },
    battery: { ka: 'ბატარეა', en: 'Battery' },
    generateCode: { ka: 'კოდის გენერაცია', en: 'Generate Code' },
    viewCodes: { ka: 'კოდების ნახვა', en: 'View Codes' },
    disconnect: { ka: 'გათიშვა', en: 'Disconnect' },
  },

  // Settings
  settings: {
    title: { ka: 'პარამეტრები', en: 'Settings' },
    profile: { ka: 'პროფილი', en: 'Profile' },
    depositSettings: { ka: 'დეპოზიტის პარამეტრები', en: 'Deposit Settings' },
    enableDeposit: { ka: 'დეპოზიტის ჩართვა', en: 'Enable Deposit' },
    depositAmount: { ka: 'დეპოზიტის თანხა (GEL)', en: 'Deposit Amount (GEL)' },
    notifications: { ka: 'შეტყობინებები', en: 'Notifications' },
    whatsappEnabled: { ka: 'WhatsApp შეტყობინებები', en: 'WhatsApp Notifications' },
    saveChanges: { ka: 'ცვლილებების შენახვა', en: 'Save Changes' },
  },

  // Admin
  admin: {
    systemOverview: { ka: 'სისტემის მიმოხილვა', en: 'System Overview' },
    totalOwners: { ka: 'სულ მფლობელები', en: 'Total Owners' },
    totalApartments: { ka: 'სულ ბინები', en: 'Total Apartments' },
    totalReservations: { ka: 'სულ დაჯავშნები', en: 'Total Reservations' },
    activeLocks: { ka: 'აქტიური საკეტები', en: 'Active Locks' },
    systemLogs: { ka: 'სისტემის ლოგები', en: 'System Logs' },
  },

  // Errors and Messages
  messages: {
    savedSuccessfully: { ka: 'წარმატებით შეინახა', en: 'Saved successfully' },
    deletedSuccessfully: { ka: 'წარმატებით წაიშალა', en: 'Deleted successfully' },
    errorOccurred: { ka: 'მოხდა შეცდომა', en: 'An error occurred' },
    confirmDelete: { ka: 'დარწმუნებული ხართ რომ გსურთ წაშლა?', en: 'Are you sure you want to delete?' },
    noDataFound: { ka: 'მონაცემები ვერ მოიძებნა', en: 'No data found' },
    connectionError: { ka: 'კავშირის შეცდომა', en: 'Connection error' },
    sessionExpired: { ka: 'სესია ამოიწურა', en: 'Session expired' },
    unauthorized: { ka: 'არაავტორიზებული წვდომა', en: 'Unauthorized access' },
  },
}

// Helper function to get both languages
export function bilingualText(key: { ka: string; en: string }): { ka: string; en: string } {
  return key
}

// Helper component props type
export type BilingualText = { ka: string; en: string }
