/* ==========================================================================
   AL Rehab Medical Lab — Data Layer
   كل البيانات القابلة للتعديل في مكان واحد (بدون الحاجة لأي سيرفر)
   ========================================================================== */
window.LAB = window.LAB || {};

/* --------------------------------------------------------------------------
   1) بيانات المعمل والتواصل
   -------------------------------------------------------------------------- */
LAB.config = {
  nameAr: 'معامل الرحاب',
  nameEn: 'AL Rehab Medical Lab',
  fullAr: 'معامل الرحاب للتحاليل الطبية',
  fullEn: 'AL Rehab Medical Lab',
  sloganAr: 'صحتك تاجك',
  sloganEn: 'Your Health Is Your Crown',

  phone: '201067571874',              // رقم واتساب/الهاتف بصيغة دولية بدون +
  phoneDisplay: '0106 757 1874',
  sandanhourPhone: '201024370715',    // رقم واتساب فرع سندنهور (زر «تواصل مع فرع سندنهور»)
  landline: '',
  email: 'info@alrehablab.com',       // ✏️ عدّل الإيميل الرسمي هنا
  replyTime: 'نرد على الرسائل خلال 24 ساعة',

  /* ---- الفيدباك ----
     whatsapp  : يرسل الرسالة مباشرة إلى واتساب المعمل (يعمل فوراً بدون أي إعداد)
     formspree : يحتاج تسجيل مجاني على formspree.io ثم وضع الـ ID هنا
                 (شكل الرابط: https://formspree.io/f/xxxxxxx)
     email     : يفتح برنامج البريد على جهاز الزائر برسالة جاهزة
  */
  formspreeId: 'xvkkbjgp',             // Formspree endpoint: https://formspree.io/f/xvkkbjgp
  feedbackEmail: 'info@alrehablab.com',
  feedbackPrefChannel: 'direct',     // القناة المفضلة: direct (Formspree) | whatsapp | email

  hours: 'يومياً من 8:00 صباحاً حتى 11:00 مساءً',
  whatsappChannel: 'https://www.whatsapp.com/channel/0029VaGPkWY7dmeabVb6Ci3n',

  socials: {
    facebook: 'https://www.facebook.com/1alrehablab/',
    instagram: 'https://www.instagram.com/al_rehab_lab',
    youtube: 'https://www.youtube.com/@1alrehablab'
  },

  branches: [
    {
      id: 'sandanhour',
      ar: 'فرع سندنهور — بلبيس',
      en: 'Sandanhour Branch — Belbeis',
      addressAr: 'سندنهور، مركز بلبيس، محافظة الشرقية',
      addressEn: 'Sandanhour, Belbeis, Sharqia',
      map: 'https://maps.google.com/?q=Sandanhour+Belbeis',
      phone: '201067571874'
    },
    {
      id: 'tenth',
      ar: 'فرع العاشر من رمضان',
      en: '10th of Ramadan Branch',
      addressAr: 'جهاز مدينة العاشر من رمضان — محافظة الشرقية',
      addressEn: '10th of Ramadan City, Sharqia',
      map: 'https://maps.app.goo.gl/G1QKeu4Vuesri1fH8',
      phone: '201067571874'
    }
  ],

  stats: [
    { value: '+25', ar: 'سنة خبرة في التحاليل الطبية', en: 'Years of lab experience' },
    { value: '+120', ar: 'نوع تحليل متاح', en: 'Test types available' },
    { value: '+45', ar: 'جهة وشركة متعاقدة', en: 'Corporate partners' }
  ]
};

/* --------------------------------------------------------------------------
   2) دليل التحاليل وشروط الفحص
   category: fasting | routine | hormones | chronic | vitamins | immunity | women
   -------------------------------------------------------------------------- */
LAB.tests = [
  { id: 1, ar: 'صورة دم كاملة (CBC)', en: 'Complete Blood Count (CBC)', category: 'routine', ruleAr: 'لا يتطلب صيام — يمكن إجراؤه في أي وقت', ruleEn: 'No fasting needed', icon: '🩸', price: '150' },
  { id: 2, ar: 'تحليل السكر الصائم (FBS)', en: 'Fasting Blood Sugar (FBS)', category: 'fasting', ruleAr: 'صيام 8 – 12 ساعة مع السماح بشرب الماء', ruleEn: 'Fast 8–12 hours, water allowed', icon: '🧪', price: '80' },
  { id: 3, ar: 'السكر التراكمي (HbA1c)', en: 'HbA1c', category: 'chronic', ruleAr: 'لا يتطلب صيام — يعكس متوسط السكر لـ 3 شهور', ruleEn: 'No fasting — reflects 3-month average', icon: '📊', price: '120' },
  { id: 4, ar: 'سكر عشوائي (RBS)', en: 'Random Blood Sugar', category: 'routine', ruleAr: 'لا يتطلب صيام — يُفضل معه تسجيل وقت آخر وجبة', ruleEn: 'No fasting — note last meal time', icon: '🍬', price: '60' },
  { id: 5, ar: 'السكر بعد ساعتين (2h PP)', en: '2-Hour Post Prandial', category: 'chronic', ruleAr: 'يُسحب بعد ساعتين بالضبط من بداية الأكل', ruleEn: 'Sample taken exactly 2h after meal', icon: '⏱️', price: '70' },
  { id: 6, ar: 'وظائف كبد كاملة (Liver Profile)', en: 'Liver Function Tests', category: 'fasting', ruleAr: 'صيام 6 – 8 ساعات', ruleEn: 'Fast 6–8 hours', icon: '🫀', price: '250' },
  { id: 7, ar: 'وظائف كلى (Kidney Profile)', en: 'Kidney Function Tests', category: 'routine', ruleAr: 'لا يتطلب صيام — يُفضل شرب ماء جيد قبل السحب', ruleEn: 'No fasting — stay well hydrated', icon: '💧', price: '200' },
  { id: 8, ar: 'دهون كاملة (Lipid Profile)', en: 'Lipid Profile', category: 'fasting', ruleAr: 'صيام 9 – 12 ساعة ضروري', ruleEn: 'Fast 9–12 hours (required)', icon: '🥑', price: '180' },
  { id: 9, ar: 'فيتامين د3 (Vitamin D3)', en: 'Vitamin D3', category: 'vitamins', ruleAr: 'لا يتطلب صيام', ruleEn: 'No fasting', icon: '☀️', price: '350' },
  { id: 10, ar: 'فيتامين ب12 (Vitamin B12)', en: 'Vitamin B12', category: 'vitamins', ruleAr: 'صيام 2 – 4 ساعات مستحسن', ruleEn: 'Preferred fast 2–4 hours', icon: '⚡', price: '280' },
  { id: 11, ar: 'الحديد والفيريتين (Iron & Ferritin)', en: 'Iron & Ferritin', category: 'vitamins', ruleAr: 'يُفضل السحب صباحاً وبعد صيام 8 ساعات', ruleEn: 'Morning sample, prefer 8h fast', icon: '🧲', price: '300' },
  { id: 12, ar: 'الغدة الدرقية (TSH, T3, T4)', en: 'Thyroid Profile (TSH/T3/T4)', category: 'hormones', ruleAr: 'لا يتطلب صيام — يُفضل صباحاً قبل جرعة العلاج', ruleEn: 'No fasting — morning, before medication', icon: '🦋', price: '280' },
  { id: 13, ar: 'هرمون الحمل (Beta HCG)', en: 'Beta HCG (Pregnancy)', category: 'women', ruleAr: 'لا يتطلب صيام', ruleEn: 'No fasting', icon: '🤰', price: '120' },
  { id: 14, ar: 'تحليل هرمونات الذكورة (Testosterone)', en: 'Testosterone', category: 'hormones', ruleAr: 'يُفضل السحب صباحاً بين 8 – 10 صباحاً', ruleEn: 'Morning sample 8–10 AM', icon: '⚗️', price: '320' },
  { id: 15, ar: 'البرولاكتين (Prolactin)', en: 'Prolactin', category: 'hormones', ruleAr: 'صيام 3 ساعات وتجنب الإجهاد قبل السحب', ruleEn: 'Fast 3h, avoid stress', icon: '🧬', price: '250' },
  { id: 16, ar: 'تحليل حمل للدم (Anaemia Profile)', en: 'Anaemia Profile', category: 'women', ruleAr: 'لا يتطلب صيام', ruleEn: 'No fasting', icon: '💗', price: '240' },
  { id: 17, ar: 'CRP / ESR (مؤشرات الالتهاب)', en: 'CRP / ESR', category: 'immunity', ruleAr: 'لا يتطلب صيام', ruleEn: 'No fasting', icon: '🛡️', price: '160' },
  { id: 18, ar: 'تحليل الغدة الدرقية للحوامل (API)', en: 'Thyroid — Pregnancy Panel', category: 'women', ruleAr: 'لا يتطلب صيام', ruleEn: 'No fasting', icon: '👶', price: '330' },
  { id: 19, ar: 'تحليل فيتامين ك والكالسيوم (Calcium & Vit K)', en: 'Calcium & Vitamin K', category: 'vitamins', ruleAr: 'صيام 6 ساعات مستحسن', ruleEn: 'Preferred 6h fast', icon: '🦴', price: '290' },
  { id: 20, ar: 'وظائف الغدة الدرقية الكاملة (Comprehensive)', en: 'Comprehensive Thyroid Panel', category: 'hormones', ruleAr: 'لا يتطلب صيام', ruleEn: 'No fasting', icon: '🔬', price: '450' },
  { id: 21, ar: 'تحليل بول كامل (Urine Analysis)', en: 'Urine Analysis', category: 'routine', ruleAr: 'يُفضل عينة بول صباحي أول', ruleEn: 'Prefer first morning sample', icon: '🧯', price: '70' },
  { id: 22, ar: 'سائل منوي — تحليل دوامة (Semen Analysis)', en: 'Semen Analysis', category: 'routine', ruleAr: 'امتناع 3 – 5 أيام قبل التحليل', ruleEn: 'Abstain 3–5 days before', icon: '🧫', price: '150' },
  { id: 23, ar: 'صيام مطلوب — تحليل نشاط الكبد (Ammonia)', en: 'Ammonia Test', category: 'fasting', ruleAr: 'صيام 8 ساعات + عدم التدخين', ruleEn: 'Fast 8h, no smoking', icon: '🚭', price: '300' },
  { id: 24, ar: 'تحليل الحمض النووي (PCR)', en: 'PCR Test', category: 'immunity', ruleAr: 'لا يتطلب صيام', ruleEn: 'No fasting', icon: '🧬', price: '550' }
];

LAB.testCategories = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'fasting', ar: 'يتطلب صيام', en: 'Fasting' },
  { id: 'routine', ar: 'لا يتطلب صيام', en: 'No fasting' },
  { id: 'chronic', ar: 'السكري ومتابعته', en: 'Diabetes' },
  { id: 'hormones', ar: 'الهرمونات', en: 'Hormones' },
  { id: 'vitamins', ar: 'الفيتامينات', en: 'Vitamins' },
  { id: 'women', ar: 'المرأة والحمل', en: 'Women' },
  { id: 'immunity', ar: 'المناعة والالتهاب', en: 'Immunity' }
];

/* --------------------------------------------------------------------------
   3) النصائح والإرشادات الطبية
   -------------------------------------------------------------------------- */
LAB.tips = [
  {
    id: 1, category: 'fasting', icon: '⏳',
    ar: { title: 'أهمية الصيام الدقيق قبل فحوصات الدهون والسكر', text: 'الصيام من 8 إلى 12 ساعة يضمن خلو الدم من جزيئات الدهون والسكريات الممتصة حديثاً، مما يمنح الطبيب قراءات صحيحة يمكن الاعتماد عليها في التشخيص.', note: 'الماء الصافي مسموح تماماً أثناء الصيام، وقبل أي تحليل اسأل عن عدد الساعات المطلوبة.' },
    en: { title: 'Why accurate fasting matters before sugar & lipid tests', text: 'Fasting for 8–12 hours keeps recently absorbed fats and sugars out of the blood, giving your doctor readings that are reliable for diagnosis.', note: 'Plain water is fully allowed during fasting — always ask for the exact fasting window.' }
  },
  {
    id: 2, category: 'chronic', icon: '📈',
    ar: { title: 'السكر التراكمي (HbA1c) كل 3 شهور', text: 'الهيموجلوبين السكري يعكس متوسط مستوى الجلوكوز في دمك على مدار 90 يوماً، لذلك هو المؤشر الأصدق لالتزام الخطة العلاجية.', note: 'النسبة المستهدفة لمعظم مرضى السكري أقل من 7% حسب رأي الطبيب.' },
    en: { title: 'HbA1c every 3 months', text: 'HbA1c reflects your average blood glucose over 90 days, making it the most honest indicator of how your treatment plan is working.', note: 'The usual target for most patients is below 7%, as advised by your doctor.' }
  },
  {
    id: 3, category: 'vitamins', icon: '☀️',
    ar: { title: 'فيتامين (د) والإجهاد الخامل', text: 'نقص فيتامين D يسبب خمولاً مستمراً وتقلبات مزاجية وضعفاً في المناعة وآلاماً في العضلات، ويُكتشف مبكراً بفحص بسيط.', note: 'يُفضل فحص دوري سنوي لكبار السن والحوامل وأصحاب العمل المكتبي.' },
    en: { title: 'Vitamin D and constant fatigue', text: 'Low vitamin D causes persistent fatigue, mood swings, weaker immunity and muscle aches — all easy to detect with a simple blood test.', note: 'An annual check is recommended for older adults, pregnant women and office workers.' }
  },
  {
    id: 4, category: 'women', icon: '🤰',
    ar: { title: 'فحوصات الحمل: مجموعات عشوائية أم صيام؟', text: 'بعض تحاليل الحمل تُطلب مع صيام وأخرى لا، لذلك من الأفضل حضورك على معدة خفيفة مع شرب ماء جيد، وتحديد التحاليل المطلوبة قبل الحضور علمياً.', note: 'احصلي على قائمة التحاليل من طبيبتك قبل الزيارة لتجنب تكرار السحب.' },
    en: { title: 'Pregnancy panels: fasting or not?', text: 'Some pregnancy tests require fasting and others do not. Arrive lightly fed and well hydrated, and confirm the exact list with your doctor beforehand.', note: 'Bring the full test list from your doctor to avoid a repeat draw.' }
  },
  {
    id: 5, category: 'fasting', icon: '☕',
    ar: { title: 'القهوة والشاي قبل التحليل', text: 'المشروبات المنبهة قد ترفع ضغط الدم مؤقتاً وتؤثر في بعض قراءات السكر، كما أن السكر والحليب فيها يكسر الصيام.', note: 'إذا كان التحليل يتطلب صياماً، اكتفِ بالماء فقط حتى ينسحب سحب العينة.' },
    en: { title: 'Coffee and tea before a test', text: 'Caffeine drinks can temporarily raise blood pressure and affect some glucose readings — and sugar or milk breaks your fast.', note: 'If fasting is required, stick to plain water until the sample is collected.' }
  },
  {
    id: 6, category: 'chronic', icon: '🩺',
    ar: { title: 'قبل فحص الضغط والسكر: لا تُجهد نفسك', text: 'الصعود بالسلم والانفعال والتدخين قبل القياس يرفع القراءة مؤقتاً. اجلس واسترح 5 دقائق على الأقل قبل السحب أو القياس.', note: 'أبلغ فريق التمريض بكل الأدوية التي تتناولها قبل السحب.' },
    en: { title: 'Before a BP or sugar check: rest first', text: 'Climbing stairs, stress or smoking right before a reading pushes it up temporarily. Sit and rest for at least 5 minutes first.', note: 'Tell the nurse about every medication you take before the sample is drawn.' }
  }
];

LAB.tipCategories = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'fasting', ar: 'الصيام والتحاليل', en: 'Fasting' },
  { id: 'chronic', ar: 'السكري والضغط', en: 'Diabetes & BP' },
  { id: 'women', ar: 'المرأة والحمل', en: 'Women & Pregnancy' },
  { id: 'vitamins', ar: 'الفيتامينات والمناعة', en: 'Vitamins & Immunity' }
];

/* --------------------------------------------------------------------------
   4) معرض تصاميم التوعية
   🔎 استبدل image برابط لوحة التوعية الخاصة بك، وthumb رابط نسخة مصغرة
   -------------------------------------------------------------------------- */
LAB.designs = [
  { id: 1, ar: 'أهمية فحص الفيتامينات الدوري', en: 'Why regular vitamin screening matters', category: 'vitamins',
    catAr: 'نصائح توعية', catEn: 'Awareness',
    descAr: 'بوستر يوضح علامات نقص فيتامين د والحديد وكيفية الوقاية والفحص المبكر.',
    descEn: 'Signs of vitamin D and iron deficiency and how to prevent them.',
    image: 'assets/posters/vitamins.jpg' },
  { id: 2, ar: 'قواعد الصيام قبل التحاليل', en: 'Fasting rules before blood tests', category: 'fasting',
    catAr: 'إرشادات المعمل', catEn: 'Lab guidance',
    descAr: 'ساعات الصيام المطلوبة لكل نوع تحليل، والمشروبات المسموحة أثناء الصيام.',
    descEn: 'The fasting window for each test type and which drinks are allowed.',
    image: 'assets/posters/fasting.jpg' },
  { id: 3, ar: 'خدمة السحب المنزلي', en: 'Home sample collection', category: 'services',
    catAr: 'خدماتنا', catEn: 'Services',
    descAr: 'كيفية طلب زيارة تمريض على باب المنزل لكبار السن والحالات الخاصة.',
    descEn: 'How to request a home nursing visit for older adults and special cases.',
    image: 'assets/posters/home-visit.jpg' },
  { id: 4, ar: 'السكر التراكمي: مرآة الـ 3 شهور', en: 'HbA1c: your 3-month mirror', category: 'chronic',
    catAr: 'السكري', catEn: 'Diabetes',
    descAr: 'بوستر يشرح ما هو الهيموجلوبين السكري وكيف يقرأه المريض مع طبيبه.',
    descEn: 'What HbA1c means and how to read it with your doctor.',
    image: 'assets/posters/hba1c.jpg' },
  { id: 5, ar: 'فحوصات الحمل الأساسية', en: 'Pregnancy screening panel', category: 'women',
    catAr: 'المرأة والحمل', catEn: 'Women',
    descAr: 'التحاليل الأساسية المطلوبة للتحقق من الحمل ومتابعته في الأشهر الأولى.',
    descEn: 'Essential tests for confirming and monitoring early pregnancy.',
    image: 'assets/posters/pregnancy.jpg' },
  { id: 6, ar: 'الأمان والتعقيم في المعمل', en: 'Safety and sterilisation in the lab', category: 'services',
    catAr: 'إرشادات المعمل', catEn: 'Lab guidance',
    descAr: 'خطوات التعقيم وسحب العينات بإبرة واحدة دون ألم أو تلوث.',
    descEn: 'Sterilisation steps and single-use needle technique for a safe draw.',
    image: 'assets/posters/safety.jpg' }
];

/* --------------------------------------------------------------------------
   5) الجهات والمؤسسات المتعاقدة
   -------------------------------------------------------------------------- */
LAB.contracts = [
  { id: 1, ar: 'جهاز مدينة العاشر من رمضان', en: '10th of Ramadan City Authority', group: 'government',
    detailAr: 'خصم للحاملين للكارنيه والبطاقات الرسمية الخاصة بالجهاز.', detailEn: 'Special discount for employees with an official authority ID.',
    discount: '10%', mark: '🏛️' },
  { id: 2, ar: 'المنطقة الصناعية — الشركات والمصانع', en: 'Industrial Zone — Companies & Factories', group: 'corporate',
    detailAr: 'خصم 20% للعاملين وأسرهم على كل التحاليل والفحوصات.', detailEn: '20% off all tests for employees and their families.',
    discount: '20%', mark: '🏭' },
  { id: 3, ar: 'نادي العاشر من رمضان الرياضي', en: '10th of Ramadan Sports Club', group: 'club',
    detailAr: 'خصم 25% للأعضاء والارساليات الرياضية والفحوصات الدورية.', detailEn: '25% off for members plus athletic periodic panels.',
    discount: '25%', mark: '⚽' },
  { id: 4, ar: 'المصالح الحكومية والأجهزة التنفيذية', en: 'Government Services & Executive Bodies', group: 'government',
    detailAr: 'تعاقدات موحدة لفحوصات العاملين وفق اشتراطات الجهة.', detailEn: 'Structured staff-screening agreements per authority requirements.',
    discount: 'خصم خاص', mark: '🏢' }
];

LAB.contractGroups = [
  { id: 'all', ar: 'الكل', en: 'All' },
  { id: 'government', ar: 'الجهات الحكومية', en: 'Government' },
  { id: 'corporate', ar: 'الشركات والمصانع', en: 'Corporate' },
  { id: 'club', ar: 'النوادي والرياضة', en: 'Clubs' }
];

/* --------------------------------------------------------------------------
   6) الأسئلة الشائعة
   -------------------------------------------------------------------------- */
LAB.faq = [
  { ar: { q: 'هل يمكنني الحضور بدون صيام؟', a: 'نعم، أكثر من نصف التحاليل لا تتطلب صياماً مثل صورة الدم الكاملة ووظائف الكلى والهرمونات. ابحث عن اسم التحليل في دليل التحاليل لمعرفة الشروط الدقيقة قبل الحضور.' },
    en: { q: 'Can I come without fasting?', a: 'Yes. Most tests — like CBC, kidney function and hormones — need no fasting. Search the test name in our test guide to check the exact conditions first.' } },
  { ar: { q: 'كم يستغرق ظهور النتيجة؟', a: 'نتائج التحاليل العادية تظهر في نفس اليوم أو خلال 24 ساعة، أما التحاليل المتخصصة والزراعات فتستغرق من يومين إلى 5 أيام. يُبلغ الزائر بالوقت المتوقع عند السحب.' },
    en: { q: 'How long do results take?', a: 'Routine results are ready the same day or within 24 hours. Specialised tests and cultures take 2–5 days. The expected time is confirmed at collection.' } },
  { ar: { q: 'هل خدمة السحب المنزلي متاحة في كل المناطق؟', a: 'الخدمة متاحة داخل بلبيس وسندنهور والعاشر من رمضان وما حولها. أرسل عنوانك على واتساب وسنؤكد لك التغطية والموعد المتاح.' },
    en: { q: 'Is home collection available everywhere?', a: 'We cover Belbeis, Sandanhour, 10th of Ramadan City and nearby areas. Send your address on WhatsApp and we will confirm coverage and timing.' } },
  { ar: { q: 'هل بياناتي ومشاركتي للرأي سرية؟', a: 'بالتأكيد. نموذج الآراء والشكاوى يتيح لك الإرسال بشكل مجهول تماماً، والاسم والهاتف اختياريان فقط إذا رغبت في متابعة الرد معك.' },
    en: { q: 'Is my feedback confidential?', a: 'Absolutely. The feedback form can be submitted fully anonymously — name and phone are optional, only if you want us to follow up with you.' } },
  { ar: { q: 'هل يوجد خصم للشركات والأسر؟', a: 'نعم. لدينا تعاقدات مع جهات حكومية وشركات المنطقة الصناعية ونوادي رياضية بنسب خصم تصل إلى 25% للعاملين وأسرهم. راجع صفحة التعاقدات أو تواصل معنا.' },
    en: { q: 'Are there corporate or family discounts?', a: 'Yes. We have agreements with government bodies, industrial-zone companies and sports clubs offering up to 25% off for employees and families. See the contracts page.' } }
];
