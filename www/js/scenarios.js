/**
 * Vuel (فويل) - 54 Interactive Real-Life Roleplay Scenarios
 * Each scenario has a context-specific opening line (no generic greetings),
 * matching character/outfit, Arabic hints, and multi-turn prompts.
 */
(function () {
  const CATEGORIES = [
    { id: "all", labelAr: "الكل (54)" },
    { id: "daily", labelAr: "الحياة والتسوق" },
    { id: "food", labelAr: "الطعام والمطاعم" },
    { id: "travel", labelAr: "السفر والمواصلات" },
    { id: "work", labelAr: "العمل والمقابلات" },
    { id: "health", labelAr: "الصحة والطوارئ" },
    { id: "edu", labelAr: "التعليم والتقنية" },
    { id: "social", labelAr: "المجتمع والثقافة" }
  ];

  const SCENARIOS = [
    {
      id: "grocery_store",
      titleEn: "Grocery Store",
      titleAr: "البقالة",
      category: "daily",
      character: "owl",
      outfit: "shopkeeper",
      difficulty: "مبتدئ",
      emoji: "🛒",
      openingLine: "Welcome to Vuel's Market! Fresh apples and warm bread just arrived. What would you like to buy today?",
      openingLineAr: "مرحباً بك في متجر فويل! وصلت للتو تفاحات طازجة وخبز دافئ. ماذا تود أن تشتري اليوم؟",
      hints: ["I would like two apples and some bread, please.", "How much is the milk today?", "Where can I find fresh vegetables?"],
      followUps: [
        "Great choice! Would you like a paper bag, and are you paying by cash or card?",
        "Your total is six dollars and fifty cents. Do you need a receipt?"
      ]
    },
    {
      id: "kitchen_cooking",
      titleEn: "Kitchen & Cooking",
      titleAr: "المطبخ والطبخ",
      category: "food",
      character: "bear",
      outfit: "chef",
      difficulty: "مبتدئ",
      emoji: "🍳",
      openingLine: "Put on your apron! The pan is hot and the olive oil is ready. Which dish are we cooking together?",
      openingLineAr: "ارتدِ مريول الطبخ! المقلاة ساخنة وزيت الزيتون جاهز. أي طبق سنطبخه معاً؟",
      hints: ["Let's cook scrambled eggs with tomatoes.", "Can you pass me the salt and pepper?", "How long should we bake it in the oven?"],
      followUps: [
        "Smells amazing! Now chop the onions carefully and stir them for two minutes.",
        "Taste the sauce! Does it need a pinch of salt or a little lemon?"
      ]
    },
    {
      id: "job_interview",
      titleEn: "Job Interview",
      titleAr: "مقابلة عمل",
      category: "work",
      character: "owl",
      outfit: "suit",
      difficulty: "متوسط",
      emoji: "💼",
      openingLine: "Thank you for coming in on time. I read your resume with great interest—tell me about your proudest project.",
      openingLineAr: "شكراً لحضورك في الموعد. قرأت سيرتك الذاتية باهتمام؛ أخبرني عن أكثر مشروع تفخر به.",
      hints: ["I built a mobile app that helps students learn faster.", "My biggest strength is solving problems with my team.", "I have three years of experience in customer service."],
      followUps: [
        "Impressive! How do you handle tight deadlines when two tasks happen at once?",
        "Why do you want to join our company, and what salary range do you expect?"
      ]
    },
    {
      id: "airport_checkin",
      titleEn: "Airport Check-in",
      titleAr: "تسجيل الوصول بالمطار",
      category: "travel",
      character: "elephant",
      outfit: "traveler",
      difficulty: "مبتدئ",
      emoji: "✈️",
      openingLine: "Good morning! Flight 402 to London is now boarding soon. May I see your passport and check your luggage?",
      openingLineAr: "صباح الخير! رحلة 402 إلى لندن ستبدأ الصعود قريباً. هل لي برؤية جواز سفرك وفحص أمتعتك؟",
      hints: ["Here is my passport. I have one suitcase to check.", "Could I have a window seat, please?", "Which gate does my flight leave from?"],
      followUps: [
        "Your suitcase weighs eighteen kilos—perfect! Would you prefer a window or aisle seat?",
        "Here is your boarding pass. Proceed to Gate 14B twenty minutes before departure."
      ]
    },
    {
      id: "hospital_doctor",
      titleEn: "Hospital & Doctor",
      titleAr: "المستشفى والطبيب",
      category: "health",
      character: "owl",
      outfit: "doctor",
      difficulty: "متوسط",
      emoji: "🏥",
      openingLine: "Please have a seat in the clinic. What symptoms brought you here today, and when did they start?",
      openingLineAr: "تفضل بالجلوس في العيادة. ما الأعراض التي أحضرتك اليوم، ومتى بدأت؟",
      hints: ["I have had a sore throat and a mild fever since yesterday.", "My stomach hurts after eating.", "Do I need a prescription for medicine?"],
      followUps: [
        "Let me check your temperature. Have you taken any pain reliever yet?",
        "Rest well, drink warm water, and take this medicine twice a day after meals."
      ]
    },
    {
      id: "restaurant_order",
      titleEn: "Restaurant Dining",
      titleAr: "المطعم وطلب الطعام",
      category: "food",
      character: "bear",
      outfit: "chef",
      difficulty: "مبتدئ",
      emoji: "🍽️",
      openingLine: "Welcome to our bistro! Today's special is grilled chicken with herb rice. Are you ready to order, or need more time?",
      openingLineAr: "أهلاً بك في مطعمنا! طبق اليوم المميز هو دجاج مشوي مع أرز بالأعشاب. هل أنت جاهز للطلب؟",
      hints: ["I would like the grilled chicken and a fresh orange juice.", "Can I see the dessert menu, please?", "Excuse me, could we get the bill?"],
      followUps: [
        "Excellent choice! How spicy would you like it, and would you like a starter soup?",
        "Here is your meal—enjoy! Let me know when you are ready for the check."
      ]
    },
    {
      id: "coffee_shop",
      titleEn: "Coffee Shop",
      titleAr: "المقهى",
      category: "food",
      character: "owl",
      outfit: "shopkeeper",
      difficulty: "مبتدئ",
      emoji: "☕",
      openingLine: "The espresso machine is steaming! Would you like an iced latte, a cappuccino, or black coffee today?",
      openingLineAr: "آلة الإسبريسو جاهزة! هل تفضل لاتيه مثلج، كابتشينو، أم قهوة سوداء اليوم؟",
      hints: ["One medium iced latte with oat milk, please.", "Is there free Wi-Fi password here?", "I will take a chocolate muffin too."],
      followUps: [
        "Medium iced latte coming up! Would you like it for here or to go?",
        "What name should I write on the cup?"
      ]
    },
    {
      id: "hotel_checkin",
      titleEn: "Hotel Check-in",
      titleAr: "الاستقبال الفندقي",
      category: "travel",
      character: "elephant",
      outfit: "suit",
      difficulty: "مبتدئ",
      emoji: "🏨",
      openingLine: "Welcome to Horizon Grand Hotel! Do you have a reservation under your name for tonight?",
      openingLineAr: "أهلاً بك في فندق هورايزون! هل لديك حجز مسجل باسمك لليلة؟",
      hints: ["Yes, I booked a single room for three nights.", "Is breakfast included in my room rate?", "What time is check-out tomorrow?"],
      followUps: [
        "Found it! You are in room 508 overlooking the city. Breakfast starts at 7 AM.",
        "Here is your key card. The elevator is straight ahead on your right."
      ]
    },
    {
      id: "pharmacy",
      titleEn: "Pharmacy",
      titleAr: "الصيدلية",
      category: "health",
      character: "owl",
      outfit: "doctor",
      difficulty: "مبتدئ",
      emoji: "💊",
      openingLine: "Good afternoon at City Care Pharmacy! Are you picking up a prescription or looking for over-the-counter relief?",
      openingLineAr: "مساء الخير في صيدلية سيتي كير! هل تصرف وصفة طبية أم تبحث عن دواء دون وصفة؟",
      hints: ["I have a prescription from Dr. Sami.", "Do you have something for a headache?", "How many tablets should I take daily?"],
      followUps: [
        "Take one tablet every eight hours with food, and avoid driving if you feel sleepy.",
        "Would you also like vitamin C drops or a thermometer?"
      ]
    },
    {
      id: "bank_account",
      titleEn: "Opening a Bank Account",
      titleAr: "فتح حساب بنكي",
      category: "work",
      character: "elephant",
      outfit: "suit",
      difficulty: "متوسط",
      emoji: "🏦",
      openingLine: "Welcome to Meridian Bank. Would you like to open a savings account, a checking account, or transfer money?",
      openingLineAr: "أهلاً بك في بنك ميريديان. هل ترغب بفتح حساب توفير، حساب جارٍ، أم تحويل أموال؟",
      hints: ["I want to open a savings account with a debit card.", "What is the monthly fee for this account?", "Can I manage transfers from the mobile app?"],
      followUps: [
        "No monthly fees if you keep a minimum balance! Could you show me your ID card?",
        "Your account is active now, and your debit card will arrive in three business days."
      ]
    },
    {
      id: "clothes_shopping",
      titleEn: "Clothes Shopping",
      titleAr: "تسوق الملابس",
      category: "daily",
      character: "bear",
      outfit: "shopkeeper",
      difficulty: "مبتدئ",
      emoji: "👕",
      openingLine: "New autumn jackets are 20% off today! What size and color are you looking for?",
      openingLineAr: "السترات الخريفية الجديدة عليها خصم 20% اليوم! ما المقاس واللون الذي تبحث عنه؟",
      hints: ["Do you have this jacket in medium size?", "Where are the fitting rooms?", "Can I exchange it if it doesn't fit?"],
      followUps: [
        "The fitting rooms are right behind that mirror. Let me know if you need a larger size!",
        "That navy blue looks sharp on you! Would you like to pay at the counter?"
      ]
    },
    {
      id: "taxi_ride",
      titleEn: "Taxi & Ride-Hailing",
      titleAr: "سيارة الأجرة",
      category: "travel",
      character: "bear",
      outfit: "traveler",
      difficulty: "مبتدئ",
      emoji: "🚕",
      openingLine: "Hop in! Where are we heading today, and do you want me to take the highway or the scenic route?",
      openingLineAr: "اركب! إلى أين نتجه اليوم، وهل تفضل الطريق السريع أم الطريق السياحي؟",
      hints: ["Take me to the Central Train Station, please.", "Please drop me off at the main entrance.", "How long will the ride take with this traffic?"],
      followUps: [
        "Traffic is light today, so we will arrive in about twelve minutes.",
        "Here we are at the entrance! Watch out for cyclists when you open the door."
      ]
    },
    {
      id: "train_station",
      titleEn: "Train Station",
      titleAr: "محطة القطار",
      category: "travel",
      character: "owl",
      outfit: "traveler",
      difficulty: "مبتدئ",
      emoji: "🚆",
      openingLine: "Next express train departs in ten minutes! Are you buying a one-way or a round-trip ticket?",
      openingLineAr: "القطار السريع القادم ينطلق خلال عشر دقائق! هل تشتري تذكرة ذهاب فقط أم ذهاب وعودة؟",
      hints: ["One round-trip ticket to Manchester, please.", "Which platform does the 10:30 train leave from?", "Do I need to change trains on the way?"],
      followUps: [
        "No transfers needed—it is a direct train from Platform 3.",
        "Keep your ticket handy for the conductor after we depart."
      ]
    },
    {
      id: "bakery",
      titleEn: "Artisan Bakery",
      titleAr: "المخبز",
      category: "food",
      character: "bear",
      outfit: "chef",
      difficulty: "مبتدئ",
      emoji: "🥐",
      openingLine: "Smell those butter croissants fresh from the oven! Would you like sweet pastries or whole-grain bread?",
      openingLineAr: "اشمم رائحة الكرواسون الطازج من الفرن! هل تفضل المعجنات الحلوة أم خبز الحبوب الكاملة؟",
      hints: ["Two butter croissants and one loaf of bread, please.", "Are these cookies nut-free?", "Can you heat the croissant for me?"],
      followUps: [
        "Yes, those cookies are completely nut-free! Let me warm up your croissants.",
        "Packed in a box for you—have a sweet morning!"
      ]
    },
    {
      id: "dentist_clinic",
      titleEn: "Dentist Appointment",
      titleAr: "عيادة الأسنان",
      category: "health",
      character: "elephant",
      outfit: "doctor",
      difficulty: "متوسط",
      emoji: "🦷",
      openingLine: "Welcome to Bright Smile Dental. Are you here for a routine cleaning or is a specific tooth bothering you?",
      openingLineAr: "أهلاً بك في عيادة الأسنان. هل أتيت لتنظيف روتيني أم أن هناك ضرساً يؤلمك؟",
      hints: ["My back tooth hurts when I drink cold water.", "I haven't had a check-up in a year.", "Will I need an X-ray today?"],
      followUps: [
        "Open wide so I can take a quick look—it might just be a small cavity.",
        "All done! Avoid very cold drinks for twenty-four hours."
      ]
    },
    {
      id: "tech_support",
      titleEn: "IT & Tech Support",
      titleAr: "الدعم الفني",
      category: "edu",
      character: "owl",
      outfit: "tech",
      difficulty: "متوسط",
      emoji: "💻",
      openingLine: "Tech Support desk speaking! Are you having trouble with your Wi-Fi connection, password reset, or software update?",
      openingLineAr: "مكتب الدعم الفني معك! هل تواجه مشكلة في الواي فاي، إعادة تعيين كلمة المرور، أم تحديث النظام؟",
      hints: ["My laptop won't connect to the office Wi-Fi.", "I forgot my account password.", "The app keeps freezing after the update."],
      followUps: [
        "Try restarting your network adapter and clearing the cache. Did an error code appear?",
        "Your account is unlocked now! Let me know if it runs smoothly."
      ]
    },
    {
      id: "university_campus",
      titleEn: "University Campus",
      titleAr: "الحرم الجامعي",
      category: "edu",
      character: "owl",
      outfit: "default",
      difficulty: "متوسط",
      emoji: "🎓",
      openingLine: "Welcome to orientation day! Which major are you studying, and do you need help finding your lecture hall?",
      openingLineAr: "مرحباً بك في يوم التوجيه الجامعي! ما التخصص الذي تدرسه، وهل تحتاج مساعدة للوصول لقاعة المحاضرات؟",
      hints: ["I am studying computer science.", "Where is the student registration office?", "When does the first lecture start?"],
      followUps: [
        "Computer Science is in Building C, second floor! Have you picked up your student ID card?",
        "Make sure to join the coding club booth near the main library."
      ]
    },
    {
      id: "library",
      titleEn: "Public Library",
      titleAr: "المكتبة العامة",
      category: "edu",
      character: "elephant",
      outfit: "default",
      difficulty: "مبتدئ",
      emoji: "📚",
      openingLine: "Shh—welcome to the Central Library! Are you looking to borrow a book or reserve a quiet study room?",
      openingLineAr: "مرحباً بك في المكتبة المركزية! هل تود استعارة كتاب أم حجز غرفة دراسة هادئة؟",
      hints: ["I want to borrow books about history.", "How long can I keep a borrowed book?", "Where are the quiet study desks?"],
      followUps: [
        "You can keep books for two weeks and renew them online anytime.",
        "Study desks with power outlets are on the third floor."
      ]
    },
    {
      id: "gym_fitness",
      titleEn: "Gym & Fitness",
      titleAr: "النادي الرياضي",
      category: "health",
      character: "bear",
      outfit: "default",
      difficulty: "مبتدئ",
      emoji: "🏋️",
      openingLine: "Ready to crush your fitness goals? Are you signing up for a monthly membership or booking a personal trainer?",
      openingLineAr: "مستعد لتحقيق أهدافك الرياضية؟ هل تود الاشتراك الشهري أم حجز مدرب شخصي؟",
      hints: ["I want a three-month membership.", "What time does the gym close?", "Do you have beginner cardio classes?"],
      followUps: [
        "Cardio classes run every evening at 6 PM. Let's give you a quick tour of the weights area!",
        "Remember to bring a towel and water bottle for your first session."
      ]
    },
    {
      id: "post_office",
      titleEn: "Post Office",
      titleAr: "مكتب البريد",
      category: "daily",
      character: "owl",
      outfit: "shopkeeper",
      difficulty: "مبتدئ",
      emoji: "📦",
      openingLine: "Next in line, please! Are you sending this parcel internationally or by local express mail?",
      openingLineAr: "التالي من فضلك! هل ترسل هذا الطرد دولياً أم عبر البريد السريع المحلي؟",
      hints: ["I want to send this package to Dubai.", "How many days will delivery take?", "Does this include a tracking number?"],
      followUps: [
        "Express shipping takes three business days and includes full tracking.",
        "Please write the recipient's phone number clearly on the label."
      ]
    },
    {
      id: "hair_salon",
      titleEn: "Barber & Hair Salon",
      titleAr: "صالون الحلاقة",
      category: "daily",
      character: "bear",
      outfit: "shopkeeper",
      difficulty: "مبتدئ",
      emoji: "💈",
      openingLine: "Have a seat in the chair! Just a quick trim today, or are we trying a completely new hairstyle?",
      openingLineAr: "اجلس على الكرسي! هل هو تشذيب سريع اليوم أم سنجرب قصة شعر جديدة تماماً؟",
      hints: ["Just a short trim on the sides, please.", "Keep the top a little longer.", "Can you trim my beard as well?"],
      followUps: [
        "Got it—short on the sides and textured on top! How does the length look in the mirror?",
        "Looking sharp! Would you like some styling wax before you head out?"
      ]
    },
    {
      id: "car_rental",
      titleEn: "Car Rental Desk",
      titleAr: "تأجير السيارات",
      category: "travel",
      character: "elephant",
      outfit: "suit",
      difficulty: "متوسط",
      emoji: "🚗",
      openingLine: "Welcome to DriveEasy Rentals! Do you prefer an economy compact car or an SUV for your trip?",
      openingLineAr: "أهلاً بك في تأجير السيارات! هل تفضل سيارة اقتصادية صغيرة أم سيارة عائلية لرحلتك؟",
      hints: ["An automatic economy car with full insurance, please.", "Is mileage unlimited?", "Here is my driver's license."],
      followUps: [
        "Unlimited mileage is included! Please return it with a full tank of gas.",
        "Your silver sedan is parked in spot B4—safe travels!"
      ]
    },
    {
      id: "car_mechanic",
      titleEn: "Car Repair Workshop",
      titleAr: "ورشة تصليح السيارات",
      category: "daily",
      character: "bear",
      outfit: "shopkeeper",
      difficulty: "متوسط",
      emoji: "🔧",
      openingLine: "Pop the hood! What strange sound is the engine making, or did a warning light turn on?",
      openingLineAr: "افتح غطاء المحرك! ما الصوت الغريب الذي يصدره المحرك، أم أن ضوء تحذير قد ظهر؟",
      hints: ["The check-engine light came on this morning.", "My brakes are making a squeaking noise.", "How much will the repair cost?"],
      followUps: [
        "Let me plug in the diagnostic scanner—looks like a worn brake pad.",
        "We can replace it in two hours for eighty dollars including labor."
      ]
    },
    {
      id: "electronics_store",
      titleEn: "Electronics Store",
      titleAr: "متجر الإلكترونيات",
      category: "daily",
      character: "owl",
      outfit: "tech",
      difficulty: "متوسط",
      emoji: "📱",
      openingLine: "Looking for an upgrade? Tell me whether you need a phone for photography, gaming, or long battery life.",
      openingLineAr: "تبحث عن ترقية؟ أخبرني هل تحتاج الهاتف للتصوير، الألعاب، أم لعمر بطارية طويل؟",
      hints: ["I need a smartphone with a great camera and fast charging.", "Does it come with a two-year warranty?", "Can I compare these two models?"],
      followUps: [
        "This model has a 50MP sensor and charges to 80% in twenty minutes.",
        "We also offer a screen protector installation for free today."
      ]
    },
    {
      id: "rent_apartment",
      titleEn: "Renting an Apartment",
      titleAr: "استئجار شقة",
      category: "daily",
      character: "elephant",
      outfit: "suit",
      difficulty: "متوسط",
      emoji: "🏢",
      openingLine: "Here is the sunny two-bedroom apartment! Notice the balcony view—what questions do you have about the lease?",
      openingLineAr: "هذه هي الشقة المشمسة ذات الغرفتين! لاحظ إطلالة الشرفة؛ ما أسئلتك حول عقد الإيجار؟",
      hints: ["Are water and electricity included in the rent?", "How much is the security deposit?", "Is parking available for residents?"],
      followUps: [
        "Water is included, and you get one covered parking spot underground.",
        "The standard contract is one year with a one-month refundable deposit."
      ]
    },
    {
      id: "police_lost_found",
      titleEn: "Lost & Found Police Report",
      titleAr: "الشرطة والمفقودات",
      category: "health",
      character: "owl",
      outfit: "suit",
      difficulty: "متوسط",
      emoji: "🚓",
      openingLine: "Don't worry, we are here to help. Exactly when and where did you notice your item was missing?",
      openingLineAr: "لا تقلق، نحن هنا للمساعدة. متى وأين بالتحديد لاحظت فقدان أغراضك؟",
      hints: ["I lost my black wallet near the metro station.", "My passport and two bank cards were inside.", "Can I get a copy of the report?"],
      followUps: [
        "Let's write down the exact description so our patrol officers can check lost items.",
        "Here is your reference number—call your bank immediately to freeze the cards."
      ]
    },
    {
      id: "immigration_customs",
      titleEn: "Immigration & Customs",
      titleAr: "الجوازات والجمارك",
      category: "travel",
      character: "elephant",
      outfit: "suit",
      difficulty: "متوسط",
      emoji: "🛂",
      openingLine: "Passport please. What is the purpose of your visit, and how many days will you be staying?",
      openingLineAr: "جواز السفر من فضلك. ما الغرض من زيارتك، وكم يوماً ستقيم؟",
      hints: ["I am here for tourism for ten days.", "I am attending a tech conference.", "I am staying at the Horizon Hotel."],
      followUps: [
        "Do you have a return ticket booked, and anything to declare at customs?",
        "Everything looks in order—welcome and enjoy your stay!"
      ]
    },
    {
      id: "supermarket_checkout",
      titleEn: "Supermarket Checkout",
      titleAr: "صندوق الدفع بالمتجر",
      category: "daily",
      character: "bear",
      outfit: "shopkeeper",
      difficulty: "مبتدئ",
      emoji: "🧾",
      openingLine: "Did you find everything you needed? Do you have our loyalty membership card to scan for points?",
      openingLineAr: "هل وجدت كل ما تحتاجه؟ هل لديك بطاقة الولاء لمسحها وكسب النقاط؟",
      hints: ["Yes, here is my loyalty card.", "I forgot to weigh the bananas!", "I will tap to pay with my phone."],
      followUps: [
        "No problem, I can weigh them right here on the scale.",
        "Payment approved! Have a wonderful day."
      ]
    },
    {
      id: "street_directions",
      titleEn: "Asking for Directions",
      titleAr: "السؤال عن الاتجاهات",
      category: "travel",
      character: "owl",
      outfit: "traveler",
      difficulty: "مبتدئ",
      emoji: "🗺️",
      openingLine: "You look like you're checking your map! Which landmark or street are you trying to reach?",
      openingLineAr: "يبدو أنك تتفقد خريطتك! ما المعلم أو الشارع الذي تحاول الوصول إليه؟",
      hints: ["Excuse me, how do I get to the National Museum?", "Is it within walking distance?", "Should I turn left at the traffic light?"],
      followUps: [
        "Walk straight for two blocks, turn right at the fountain, and you will see it!",
        "It takes only five minutes on foot."
      ]
    },
    {
      id: "making_friends",
      titleEn: "Making New Friends",
      titleAr: "تكوين صداقات جديدة",
      category: "social",
      character: "bear",
      outfit: "default",
      difficulty: "مبتدئ",
      emoji: "🤝",
      openingLine: "Hey, I love your jacket! I just moved to this neighborhood—what do you usually do for fun on weekends?",
      openingLineAr: "مرحباً، أعجبتني سترتك! انتقلت لهذا الحي للتو؛ ماذا تفعل عادة للمتعة في عطلة نهاية الأسبوع؟",
      hints: ["I love playing football and trying new cafes.", "Nice to meet you! Where are you from?", "Let's grab coffee sometime this week."],
      followUps: [
        "Awesome! There is a great football pitch near the park—we play every Saturday.",
        "Let's exchange numbers so we can hang out soon!"
      ]
    },
    {
      id: "customer_service_call",
      titleEn: "Customer Service Call",
      titleAr: "مكالمة خدمة العملاء",
      category: "work",
      character: "owl",
      outfit: "tech",
      difficulty: "متوسط",
      emoji: "📞",
      openingLine: "Thank you for calling SwiftCare Support. May I have your order number so I can track your issue?",
      openingLineAr: "شكراً لاتصالك بخدمة العملاء. هل يمكنني الحصول على رقم طلبك لمتابعة المشكلة؟",
      hints: ["My order number is 88412, and it hasn't arrived yet.", "Can you update my delivery address?", "I was charged twice on my bill."],
      followUps: [
        "I see the delay at our regional hub—I will upgrade your shipping to priority for free.",
        "You will receive an SMS confirmation within five minutes."
      ]
    },
    {
      id: "team_standup",
      titleEn: "Daily Team Standup",
      titleAr: "اجتماع الفريق اليومي",
      category: "work",
      character: "owl",
      outfit: "suit",
      difficulty: "متقدم",
      emoji: "📊",
      openingLine: "Good morning team! Let's start our 10-minute standup—what did you ship yesterday and any blockers today?",
      openingLineAr: "صباح الخير يا فريق! لنبدأ اجتماعنا السريع؛ ما الذي أنجزته أمس وهل هناك أي عوائق اليوم؟",
      hints: ["Yesterday I finished the API integration; today I am writing unit tests.", "I am blocked waiting for the design assets.", "Everything is on track for Friday's release."],
      followUps: [
        "Thanks for the update! Let's sync right after this call to clear that blocker.",
        "Great velocity this sprint—keep it up!"
      ]
    },
    {
      id: "salary_negotiation",
      titleEn: "Salary Negotiation",
      titleAr: "التفاوض على الراتب",
      category: "work",
      character: "elephant",
      outfit: "suit",
      difficulty: "متقدم",
      emoji: "💰",
      openingLine: "We are thrilled to offer you the Senior Specialist role! Let's discuss the compensation package together.",
      openingLineAr: "يسعدنا تقديم عرض العمل لك! لنناقش تفاصيل حزمة الراتب والمزايا معاً.",
      hints: ["Thank you! Based on my experience, I was hoping for 15% higher.", "Does the package include health insurance and remote days?", "Is there an annual performance bonus?"],
      followUps: [
        "We value your skills—we can meet halfway on the base salary and add two remote days.",
        "Let me send the revised offer letter for your review this afternoon."
      ]
    },
    {
      id: "startup_pitch",
      titleEn: "Startup Investor Pitch",
      titleAr: "عرض مشروع ناشئ",
      category: "work",
      character: "owl",
      outfit: "royal",
      difficulty: "متقدم",
      emoji: "🚀",
      openingLine: "You have two minutes with our investment panel! What problem does your startup solve, and why now?",
      openingLineAr: "لديك دقيقتان أمام لجنة المستثمرين! ما المشكلة التي يحلها مشروعك الناشئ، ولماذا الآن؟",
      hints: ["We help students master languages through live AI roleplay.", "Our active users grew 40% month over month.", "We are raising seed funding to scale globally."],
      followUps: [
        "Compelling traction! What is your customer acquisition cost and retention rate?",
        "Impressive vision—let's schedule a deeper due-diligence meeting next Tuesday."
      ]
    },
    {
      id: "coding_interview",
      titleEn: "Software Coding Interview",
      titleAr: "مقابلة برمجة تقنية",
      category: "edu",
      character: "owl",
      outfit: "tech",
      difficulty: "متقدم",
      emoji: "🧑‍💻",
      openingLine: "Let's dive into system design: how would you build an offline-first mobile app that syncs cleanly on weak networks?",
      openingLineAr: "لنبدأ بتصميم الأنظمة: كيف تبني تطبيقاً يعمل بدون إنترنت ويزامن بسلاسة على الشبكات الضعيفة؟",
      hints: ["I would store state locally in IndexedDB and stream lightweight JSON.", "We can retry failed requests with exponential backoff.", "Caching assets locally ensures instant startup."],
      followUps: [
        "Solid architecture! How would you handle conflict resolution if two edits collide?",
        "Great explanation—now let's look at time complexity for search."
      ]
    },
    {
      id: "travel_agency",
      titleEn: "Travel Agency Planning",
      titleAr: "وكالة السفر والسياحة",
      category: "travel",
      character: "elephant",
      outfit: "traveler",
      difficulty: "مبتدئ",
      emoji: "🌴",
      openingLine: "Ready for an unforgettable vacation? Do you dream of sunny beaches, snowy mountains, or historic cities?",
      openingLineAr: "مستعد لعطلة لا تُنسى؟ هل تحلم بشواطئ مشمسة، جبال ثلجية، أم مدن تاريخية؟",
      hints: ["I want a five-day family trip to Istanbul.", "What is included in this holiday package?", "Are airport transfers included?"],
      followUps: [
        "Great pick! Our package includes flights, a 4-star hotel, and guided city tours.",
        "Shall I lock in the early-bird discount for next month?"
      ]
    },
    {
      id: "cinema_tickets",
      titleEn: "Cinema Box Office",
      titleAr: "السينما وحجز التذاكر",
      category: "social",
      character: "bear",
      outfit: "shopkeeper",
      difficulty: "مبتدئ",
      emoji: "🎬",
      openingLine: "Welcome to Starlight Cinema! The 7:30 IMAX sci-fi movie has seats in the middle row—how many tickets?",
      openingLineAr: "أهلاً بك في سينما ستارلايت! عرض السابعة والنصف IMAX تتوفر فيه مقاعد بالمنتصف؛ كم تذكرة تريد؟",
      hints: ["Two tickets in row G and one large popcorn, please.", "Does the movie have Arabic subtitles?", "Which screen hall is it in?"],
      followUps: [
        "Yes, it has crisp subtitles! Hall 4 is just down the corridor on your left.",
        "Enjoy the show—trailers start in five minutes!"
      ]
    },
    {
      id: "museum_tour",
      titleEn: "Museum Guided Tour",
      titleAr: "جولة في المتحف",
      category: "social",
      character: "elephant",
      outfit: "default",
      difficulty: "متوسط",
      emoji: "🏛️",
      openingLine: "Welcome to the Ancient History Wing! This bronze astrolabe is 900 years old—would you like an audio guide?",
      openingLineAr: "أهلاً بكم في جناح التاريخ القديم! هذا الإسطرلاب البرونزي عمره 900 عام؛ هل تود دليلاً صوتياً؟",
      hints: ["Yes, in Arabic or clear English, please.", "Are visitors allowed to take photos without flash?", "Where is the Islamic calligraphy exhibition?"],
      followUps: [
        "Photos without flash are welcome! The calligraphy gallery is upstairs.",
        "Don't miss the manuscript hall—it closes at 5 PM."
      ]
    },
    {
      id: "bookstore",
      titleEn: "Independent Bookstore",
      titleAr: "مكتبة الكتب",
      category: "edu",
      character: "owl",
      outfit: "default",
      difficulty: "مبتدئ",
      emoji: "📖",
      openingLine: "Nothing beats the smell of new books! Are you hunting for a gripping novel, self-improvement, or tech guides?",
      openingLineAr: "لا شيء يضاهي رائحة الكتب الجديدة! هل تبحث عن رواية مشوقة، تطوير ذات، أم كتب تقنية؟",
      hints: ["Can you recommend an easy English novel for learners?", "Do you have any books on productivity?", "Could you gift-wrap this book for me?"],
      followUps: [
        "I recommend 'The Old Man and the Sea'—short sentences and timeless storytelling!",
        "I will wrap it with a ribbon right away."
      ]
    },
    {
      id: "pet_vet",
      titleEn: "Pet Store & Vet Clinic",
      titleAr: "متجر الحيوانات والبيطري",
      category: "health",
      character: "bear",
      outfit: "doctor",
      difficulty: "مبتدئ",
      emoji: "🐾",
      openingLine: "Aww, look at that fluffy cat! Is she here for her annual vaccination or a nutrition check?",
      openingLineAr: "يا لها من قطة لطيفة! هل هي هنا لتطعيمها السنوي أم لفحص التغذية؟",
      hints: ["She needs her annual vaccine and some healthy cat food.", "She hasn't been eating much since Monday.", "How often should I brush her fur?"],
      followUps: [
        "Her heartbeat sounds strong! Switch to wet food for two days and keep fresh water nearby.",
        "Here is a treat for being such a brave kitty!"
      ]
    },
    {
      id: "weather_talk",
      titleEn: "Weather Small Talk",
      titleAr: "الحديث عن الطقس",
      category: "social",
      character: "owl",
      outfit: "default",
      difficulty: "مبتدئ",
      emoji: "🌦️",
      openingLine: "What a sudden breeze! The forecast said sunny skies, yet dark clouds are rolling in—did you bring an umbrella?",
      openingLineAr: "يا له من نسيم مفاجئ! النشرة توقعت سماءً صافية لكن الغيوم تتجمع؛ هل أحضرت مظلة؟",
      hints: ["No, I forgot my umbrella at home!", "I actually love rainy weather.", "Do you think it will clear up by afternoon?"],
      followUps: [
        "Hopefully just a passing shower! At least it cools down the humid heat.",
        "Let's wait under the awning for a few minutes."
      ]
    },
    {
      id: "birthday_party",
      titleEn: "Birthday Celebration",
      titleAr: "حفلة عيد ميلاد",
      category: "social",
      character: "bear",
      outfit: "royal",
      difficulty: "مبتدئ",
      emoji: "🎂",
      openingLine: "Surprise! The balloons are up and everyone is cheering—thank you so much for coming to my birthday party!",
      openingLineAr: "مفاجأة! البالونات معلقة والجميع يحتفل؛ شكراً جزيلاً لحضورك حفل عيد ميلادي!",
      hints: ["Happy birthday! I brought a small gift for you.", "This chocolate cake looks delicious!", "How do you know the birthday host?"],
      followUps: [
        "You shouldn't have! Let's light the candles and cut the cake together.",
        "Make sure you try the mango juice too!"
      ]
    },
    {
      id: "wedding_reception",
      titleEn: "Wedding Reception",
      titleAr: "حفل زفاف",
      category: "social",
      character: "elephant",
      outfit: "suit",
      difficulty: "متوسط",
      emoji: "💐",
      openingLine: "What an elegant evening! Have you congratulated the bride and groom yet, or are you heading to your table?",
      openingLineAr: "يا لها من أمسية أنيقة! هل هنأت العروسين بعد أم أنك متجه إلى طاولتك؟",
      hints: ["Congratulations to the lovely couple! Wishing them a lifetime of joy.", "The floral decorations are stunning.", "Which table number are we seated at?"],
      followUps: [
        "We are at Table 6 near the stage! Dinner is about to be served.",
        "Let's take a group photo before the speeches start."
      ]
    },
    {
      id: "neighbor_intro",
      titleEn: "Meeting Your Neighbor",
      titleAr: "التعرف على الجيران",
      category: "social",
      character: "bear",
      outfit: "default",
      difficulty: "مبتدئ",
      emoji: "🏡",
      openingLine: "Hi neighbor! I live right next door in apartment 4B—here are some homemade dates to welcome you to the building!",
      openingLineAr: "أهلاً يا جاري! أسكن في الشقة المجاورة 4B؛ إليك بعض التمر المنزلي ترحيباً بك في البناية!",
      hints: ["Thank you so much, that is very kind of you!", "How is the neighborhood around here?", "Let me know if you ever need anything."],
      followUps: [
        "It's very peaceful here, and the grocery store down the street stays open late.",
        "Feel free to knock anytime!"
      ]
    },
    {
      id: "complaint_refund",
      titleEn: "Product Complaint & Refund",
      titleAr: "تقديم شكوى واسترداد",
      category: "work",
      character: "owl",
      outfit: "suit",
      difficulty: "متوسط",
      emoji: "🔄",
      openingLine: "I apologize for the inconvenience at the returns counter. Can you show me the defect and your original receipt?",
      openingLineAr: "أعتذر عن الإزعاج في قسم الاسترجاع. هل يمكنك أن تريني العيب والفاتورة الأصلية؟",
      hints: ["The zipper broke on the very first day.", "I would like a full refund to my card.", "Can I exchange it for a brand-new one?"],
      followUps: [
        "That is clearly a manufacturing defect. Would you prefer an instant replacement or full refund?",
        "Your refund has been processed and will appear within two days."
      ]
    },
    {
      id: "online_delivery",
      titleEn: "Food & Parcel Delivery",
      titleAr: "توصيل الطلبات",
      category: "daily",
      character: "bear",
      outfit: "traveler",
      difficulty: "مبتدئ",
      emoji: "🛵",
      openingLine: "Delivery at the gate! I am outside the blue building—is your apartment on the third floor?",
      openingLineAr: "المندوب عند البوابة! أنا خارج المبنى الأزرق؛ هل شقتك في الطابق الثالث؟",
      hints: ["Yes, take the elevator to floor 3, door 12.", "Please leave the bag with the security guard.", "Thank you for the fast delivery!"],
      followUps: [
        "Heading up now! Could you confirm the 4-digit delivery PIN code?",
        "Delivered! Enjoy your meal."
      ]
    },
    {
      id: "park_picnic",
      titleEn: "Public Park & Picnic",
      titleAr: "الحديقة العامة والنزهة",
      category: "social",
      character: "elephant",
      outfit: "traveler",
      difficulty: "مبتدئ",
      emoji: "🌳",
      openingLine: "What a peaceful spot under the oak tree! Spread out the picnic blanket—who brought the sandwiches and lemonade?",
      openingLineAr: "يا له من مكان هادئ تحت شجرة البلوط! افرش بساط النزهة؛ من أحضر السندويشات وعصير الليمون؟",
      hints: ["I brought fresh lemonade and fruit salad!", "Let's go for a walk around the lake later.", "Look at the ducks swimming over there!"],
      followUps: [
        "This lemonade is so refreshing! Shall we rent bicycles after lunch?",
        "Just watch out for the playful squirrels eyeing our snacks!"
      ]
    },
    {
      id: "art_gallery",
      titleEn: "Contemporary Art Gallery",
      titleAr: "معرض الفنون",
      category: "social",
      character: "owl",
      outfit: "royal",
      difficulty: "متقدم",
      emoji: "🎨",
      openingLine: "Notice how this abstract painting uses bold cyan strokes to evoke motion. What emotion does it spark for you?",
      openingLineAr: "لاحظ كيف تستخدم هذه اللوحة التجريدية ضربات السيان الجريئة لإبراز الحركة. ما الشعور الذي تثيره لديك؟",
      hints: ["It feels energetic and futuristic, like a neon city.", "Who is the artist behind this collection?", "I prefer classic landscape paintings."],
      followUps: [
        "Interesting perspective! The artist painted it during a monsoon in Tokyo.",
        "Be sure to visit the sculpture room around the corner."
      ]
    },
    {
      id: "photo_studio",
      titleEn: "Photography Studio",
      titleAr: "استوديو التصوير",
      category: "work",
      character: "bear",
      outfit: "tech",
      difficulty: "متوسط",
      emoji: "📸",
      openingLine: "The studio lights are set! Are we shooting formal LinkedIn headshots or a passport photo today?",
      openingLineAr: "إضاءة الاستوديو جاهزة! هل سنلتقط صوراً رسمية للعمل أم صورة لجواز السفر اليوم؟",
      hints: ["I need a professional headshot for my LinkedIn profile.", "Should I smile or keep a neutral expression?", "When will the edited photos be ready?"],
      followUps: [
        "Turn your shoulders slightly left and give a confident, natural smile!",
        "That frame looks crisp! I will email the high-res files tonight."
      ]
    },
    {
      id: "volunteer_center",
      titleEn: "Community Volunteer Center",
      titleAr: "مركز التطوع المجتمعي",
      category: "social",
      character: "elephant",
      outfit: "shopkeeper",
      difficulty: "متوسط",
      emoji: "🌍",
      openingLine: "Welcome to Green Earth Volunteers! Would you like to help plant trees or organize food boxes this Saturday?",
      openingLineAr: "مرحباً بك في متطوعي الأرض الخضراء! هل تفضل المساعدة في زراعة الأشجار أم تنظيم سلال الطعام هذا السبت؟",
      hints: ["I would love to help plant trees in the park!", "What tools or clothes should I bring?", "How many hours is the volunteer shift?"],
      followUps: [
        "Bring sturdy shoes and a hat—we provide gloves, shovels, and water!",
        "The shift runs from 8 AM to noon—thank you for making a difference!"
      ]
    },
    {
      id: "study_group",
      titleEn: "Exam Study Group",
      titleAr: "مجموعة الدراسة",
      category: "edu",
      character: "owl",
      outfit: "default",
      difficulty: "متوسط",
      emoji: "📝",
      openingLine: "Final exams are next week! Which topic feels toughest for you right now—let's break it down together.",
      openingLineAr: "الاختبارات النهائية الأسبوع القادم! أي موضوع يبدو الأصعب بالنسبة لك الآن؛ لنبسطه معاً.",
      hints: ["I struggle with English grammar tenses.", "Can we quiz each other using flashcards?", "Let's take a five-minute break after this chapter."],
      followUps: [
        "Great plan! Let's review Present Perfect vs Past Simple with three quick examples.",
        "You nailed two out of three—your confidence is growing fast!"
      ]
    },
    {
      id: "hotel_room_service",
      titleEn: "Hotel Room Service",
      titleAr: "خدمة الغرف الفندقية",
      category: "food",
      character: "bear",
      outfit: "chef",
      difficulty: "مبتدئ",
      emoji: "🛎️",
      openingLine: "Room Service speaking! You're calling from Room 508—what hot meal or extra towels can we send up?",
      openingLineAr: "خدمة الغرف تتحدث! تتصل من الغرفة 508؛ ما الوجبة الساخنة أو المناشف الإضافية التي نرسلها لك؟",
      hints: ["Could you send a club sandwich and mint tea?", "Please bring two extra pillows.", "How long will room service take?"],
      followUps: [
        "Your club sandwich and hot mint tea will arrive in fifteen minutes.",
        "Should we charge it to your room bill?"
      ]
    },
    {
      id: "airport_security",
      titleEn: "Airport Security Check",
      titleAr: "أمن المطار",
      category: "travel",
      character: "elephant",
      outfit: "traveler",
      difficulty: "متوسط",
      emoji: "🛃",
      openingLine: "Step forward please! Place your laptop, liquids, and metal items inside a separate plastic tray.",
      openingLineAr: "تقدم من فضلك! ضع الحاسوب المحمول والسوائل والأغراض المعدنية في صينية بلاستيكية منفصلة.",
      hints: ["Should I take off my belt and watch?", "Is a 100ml perfume bottle allowed?", "My laptop is already in the tray."],
      followUps: [
        "Yes, 100ml or under is fine inside a clear bag. Step through the scanner slowly.",
        "All clear! Collect your belongings and have a pleasant flight."
      ]
    },
    {
      id: "emergency_911",
      titleEn: "Emergency Urgent Help",
      titleAr: "نداء طوارئ عاجل",
      category: "health",
      character: "owl",
      outfit: "doctor",
      difficulty: "متوسط",
      emoji: "🚑",
      openingLine: "Emergency dispatch! Stay calm and tell me your exact location and what medical or safety help you need.",
      openingLineAr: "مركز الطوارئ! حافظ على هدوئك وأخبرني بموقعك الدقيق ونوع المساعدة الطبية أو الأمنية المطلوبة.",
      hints: ["Someone fainted near Central Park Gate 2!", "Please send an ambulance immediately.", "He is breathing, and I am staying beside him."],
      followUps: [
        "An ambulance is dispatched and four minutes away. Keep the area clear and don't move him.",
        "Stay on the line with me until the paramedics arrive."
      ]
    }
  ];

  function getById(id) {
    return SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
  }

  window.VuelScenarios = {
    CATEGORIES,
    SCENARIOS,
    getById
  };
})();
