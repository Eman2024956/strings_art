export const translations = {
  ar: {
    dir: "rtl",
    appTitle: "استوديو فن الخيوط والمسامير",
    tagline: "حوّل صورك الشخصية إلى لوحات فنية واقعية باستخدام خيط واحد مستمر ومسامير مرقمة",
    step1_upload: "١. رفع الصورة",
    step2_adjust: "٢. القص والضبط",
    step3_parameters: "٣. خيارات التوليد",
    step4_generate: "٤. التوليد والمشاهدة",
    
    // Upload
    dragDropText: "اسحب الصورة وأفلتها هنا، أو اضغط للاختيار",
    supportedFormats: "يدعم JPG، PNG، WebP (حتى 15 ميجابايت)",
    uploading: "جاري رفع الصورة والتحقق...",
    changeImage: "تغيير الصورة",
    
    // Adjustments
    adjustTitle: "القص الدائري وتعديل التباين",
    adjustDesc: "قم بتحريك وتكبير وتدوير الصورة لتتوسط الوجه داخل الدائرة، ثم اضبط التباين للحصول على أفضل خطوط.",
    zoom: "التكبير",
    rotation: "التدوير (درجة)",
    brightness: "السطوع",
    contrast: "التباين",
    rotate90: "تدوير 90°",
    resetAdjust: "إعادة ضبط",
    
    // Presets
    presetTitle: "الإعدادات الجاهزة",
    presetFast: "معاينة سريعة (100 مسمار، 800 خط)",
    presetBalanced: "متوازن وموصى به (200 مسمار، 3000 خط)",
    presetMasterpiece: "لوحة فائقة الدقة (280 مسمار، 4500 خط)",
    presetCustom: "مخصص",
    
    // Parameters
    paramTitle: "إعدادات الخوارزمية واللوحة",
    nails: "عدد المسامير",
    nailsHelp: "المسامير الموزعة بانتظام على محيط الدائرة (50 - 400 مسمار)",
    steps: "الحد الأقصى للخطوط",
    stepsHelp: "عدد مرات مرور الخيط بين المسامير (100 - 8000 خط)",
    resolution: "دقة المعالجة الحسابية",
    resolutionHelp: "دقة شبكة البكسل أثناء الحساب (200، 300، أو 400 بكسل)",
    boardDiameter: "قطر اللوحة الفعلي (مم)",
    boardDiameterHelp: "القطر الحقيقي لدائرة المسامير بالملم (مثلاً 400 مم = 40 سم)",
    threadDarkness: "كثافة اسوداد الخيط",
    threadDarknessHelp: "معامل رسم برمجي يمثل تأثير التعتيم لكل خط، وليس مقياساً فيزيائياً لسماكة الخيط الحقيقي.",
    minGap: "أقل فرق بين المسامير",
    minGapHelp: "تجنب الخطوط شديدة القصر القريبة من حافة الدائرة",
    startNail: "مسمار البداية",
    allowancePct: "نسبة الخيط الاحتياطي (%)",
    allowanceHelp: "تغطية التفاف الخيط حول المسامير والعقد وبداية ونهاية العمل (افتراضي 15%)",
    generateButton: "بدء توليد فن الخيوط",
    
    // Generating
    generatingTitle: "جاري الحساب الهندسي للخيوط...",
    currentStep: "الخطوة الحالية",
    currentNail: "المسمار الحالي",
    cancelJob: "إلغاء العملية",
    cancelling: "جاري الإلغاء...",
    cancelledNotice: "تم إلغاء التوليد بناءً على طلبك.",
    
    // View modes
    viewMode: "وضع العرض",
    viewStringArt: "فن الخيوط",
    viewTarget: "الصورة المعالجة",
    viewOriginal: "الصورة الأصلية",
    viewSplit: "مقارنة جانبية",
    viewOverlay: "تراكب شفاف",
    toggleNails: "أرقام المسامير",
    zoomIn: "تكبير",
    zoomOut: "تصغير",
    fitScreen: "ملاءمة الشاشة",
    
    // Player
    playerTitle: "مشغل خطوات البناء والتنفيذ",
    play: "تشغيل",
    pause: "إيقاف مؤقت",
    stepPrev: "الخطوة السابقة",
    stepNext: "الخطوة التالية",
    resetPlayer: "إعادة للبداية",
    jumpEnd: "الذهاب للنهاية",
    speed: "السرعة",
    stepIndicator: "الخطوة {step} من {total}: المسمار {from} ➔ المسمار {to}",
    savedProgress: "تم حفظ تقدمك تلقائياً محلياً على هذا الجهاز.",
    
    // Exports
    exportTitle: "تحميل ملفات التنفيذ والطباعة",
    printWarning: "هام: اطبع القوالب بنسبة 100% / الحجم الفعلي (Actual Size) دون تصغير، وتأكد باستخدام مسطرة القياس (10 سم).",
    downloadBundle: "تحميل الحزمة الكاملة (ZIP)",
    downloadPng: "معاينة رقمية (PNG)",
    downloadSvg: "قالب المسامير الفعلي (SVG)",
    downloadPdfActual: "قالب بالحجم الفعلي 1:1 (PDF)",
    downloadPdfTiled: "قالب مجزأ لصفحات A4 مع مسطرة القياس (PDF)",
    downloadCsv: "تسلسل الخطوات (CSV للإكسل)",
    downloadJson: "بيانات التعليمات (JSON)",
    statsLines: "إجمالي الخطوط المنفذة",
    statsLengthRaw: "طول الخيط الهندسي",
    statsLengthAllowance: "طول الخيط مع الاحتياطي",
    stoppingReason: "سبب اكتمال المعالجة",
    
    // Stopping reasons
    reason_max_steps_reached: "تم الوصول للحد الأقصى للخطوط المطلوبة",
    reason_no_improvement: "لا يوجد خط إضافي يحسن التباين (اكتملت التفاصيل)",
    reason_cancelled: "تم الإلغاء بواسطة المستخدم",
    
    // Algorithm note
    algoNoteTitle: "كيف تعمل خوارزمية فن الخيوط؟",
    algoNoteText: "تبدأ الخوارزمية من خلفية بيضاء وتقيس في كل خطوة كل المسارات المتاحة من المسمار الحالي، وتختار المسار الذي يقلل مجموع مربعات الخطأ مع الصورة المرجعية مع مراعاة تشبع السواد. هذا بحث تقريبي (Greedy) ذكي وسريع لتكوين الصورة بخيط واحد متصل.",
    
    // Theme
    themeDark: "الوضع الليلي",
    themeLight: "الوضع النهاري",
    langToggle: "English"
  },
  en: {
    dir: "ltr",
    appTitle: "String Art Studio",
    tagline: "Turn portraits into real continuous-thread string art designs on a circular numbered board",
    step1_upload: "1. Upload",
    step2_adjust: "2. Crop & Adjust",
    step3_parameters: "3. Settings",
    step4_generate: "4. Generate & Preview",
    
    // Upload
    dragDropText: "Drag and drop your image here, or click to browse",
    supportedFormats: "Supports JPG, PNG, WebP (up to 15 MB)",
    uploading: "Uploading and validating...",
    changeImage: "Change Photo",
    
    // Adjustments
    adjustTitle: "Circular Crop & Tonal Adjustments",
    adjustDesc: "Pan, zoom, and rotate so the subject is centered in the circle, then tune contrast for crisp thread lines.",
    zoom: "Zoom",
    rotation: "Rotation (deg)",
    brightness: "Brightness",
    contrast: "Contrast",
    rotate90: "Rotate 90°",
    resetAdjust: "Reset",
    
    // Presets
    presetTitle: "Quality Presets",
    presetFast: "Fast Draft (100 nails, 800 lines)",
    presetBalanced: "Balanced Studio (200 nails, 3000 lines)",
    presetMasterpiece: "Masterpiece HD (280 nails, 4500 lines)",
    presetCustom: "Custom",
    
    // Parameters
    paramTitle: "Algorithm & Board Settings",
    nails: "Nail Count",
    nailsHelp: "Total nails evenly spaced around circular perimeter (50 - 400)",
    steps: "Maximum Thread Segments",
    stepsHelp: "Upper bound on line passes (100 - 8000 lines)",
    resolution: "Processing Resolution",
    resolutionHelp: "Internal computation grid (200, 300, or 400 px)",
    boardDiameter: "Board Diameter (mm)",
    boardDiameterHelp: "Physical diameter of nail circle in mm (e.g. 400 mm = 40 cm)",
    threadDarkness: "Thread Darkness Weight",
    threadDarknessHelp: "A mathematical rendering parameter representing opacity per pass, not physical thread gauge.",
    minGap: "Minimum Nail Gap",
    minGapHelp: "Prevents short chords hugging the circle perimeter",
    startNail: "Starting Nail",
    allowancePct: "Thread Reserve Allowance (%)",
    allowanceHelp: "Covers nail wraps, starting knots, and slack (default 15%)",
    generateButton: "Generate String Art",
    
    // Generating
    generatingTitle: "Calculating String Art Chords...",
    currentStep: "Current Step",
    currentNail: "Current Nail",
    cancelJob: "Cancel Generation",
    cancelling: "Cancelling...",
    cancelledNotice: "Generation was cancelled.",
    
    // View modes
    viewMode: "View Mode",
    viewStringArt: "String Art",
    viewTarget: "Processed Target",
    viewOriginal: "Original Photo",
    viewSplit: "Side-by-Side",
    viewOverlay: "Overlay",
    toggleNails: "Show Nails",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    fitScreen: "Fit to Screen",
    
    // Player
    playerTitle: "Physical Construction Player",
    play: "Play",
    pause: "Pause",
    stepPrev: "Previous Step",
    stepNext: "Next Step",
    resetPlayer: "Restart",
    jumpEnd: "End",
    speed: "Speed",
    stepIndicator: "Step {step} of {total}: Nail {from} ➔ Nail {to}",
    savedProgress: "Construction step saved locally on this browser.",
    
    // Exports
    exportTitle: "Download Fabrication Files",
    printWarning: "IMPORTANT: Print templates at 100% / Actual Size. Verify with the printed 10 cm test ruler before hammering.",
    downloadBundle: "Download All Files (ZIP Bundle)",
    downloadPng: "Preview Image (PNG)",
    downloadSvg: "Physical Nail Template (SVG)",
    downloadPdfActual: "1:1 Actual Size Template (PDF)",
    downloadPdfTiled: "Multi-Page A4 Tiled Template (PDF)",
    downloadCsv: "Nail Sequence (CSV for Excel)",
    downloadJson: "Instructions & Metadata (JSON)",
    statsLines: "Rendered Chords",
    statsLengthRaw: "Geometric Thread",
    statsLengthAllowance: "Thread with Reserve",
    stoppingReason: "Stopping Reason",
    
    // Stopping reasons
    reason_max_steps_reached: "Reached requested maximum line count",
    reason_no_improvement: "No further chords improve image contrast (saturated)",
    reason_cancelled: "Cancelled by user",
    
    // Algorithm note
    algoNoteTitle: "How the Algorithm Works",
    algoNoteText: "The algorithm starts from a white circular canvas and iteratively tests chords from the active nail to find the one that yields the greatest reduction in squared image error while accounting for black ink saturation. It produces one continuous physical thread path.",
    
    // Theme
    themeDark: "Dark Mode",
    themeLight: "Light Mode",
    langToggle: "العربية"
  }
};
