// Safsf's trainer program uses a few moves the main library doesn't have. They are added as
// built-in exercises (ids "sf.."). Photos come from free-exercise-db (public domain) and are
// served from the app itself (public/ex/), so their media paths start with "ex/".
// `desc` carries the trainer's own cue in Arabic.
export const SF_EX = [
  { id: 'sf01', n: "child's pose", bp: 'back', eq: 'body weight', tg: 'lower back', mg: 'lower back', sm: ['glutes', 'lats'],
    st: ['Kneel on the floor with your knees apart and big toes touching.', 'Sit back toward your heels and walk your hands forward on the floor.', 'Move back with your whole back, not by pushing with your hands.', 'Hold 20–30 seconds, breathing slowly into your back.'],
    desc: 'افتحي الفخذين زي الفيديو، وارجعي لورا بضهرك كله مش بإيديكي. ٣ مجموعات × ١٠ عدات، ثبات ٢٠–٣٠ ثانية.',
    img: 'ex/sf01.jpg', gif: 'ex/sf01.gif' },
  { id: 'sf02', n: 'shoulder dislocations (stick)', bp: 'shoulders', eq: 'body weight', tg: 'delts', mg: 'shoulders', sm: ['chest', 'upper back'],
    st: ['Hold a stick or band wide with both hands in front of your hips.', 'Keeping your arms straight, lift it over your head and take it behind you.', 'Only go as far back as you comfortably can, then return the same way.', 'Bring your grip a little closer over time.'],
    desc: 'امسكي العصاية من الطرفين وارجعي بإيدك لورا. مش لازم تنزلي لآخر لورا — انزلي على قد ما تقدري وزودي شوية شوية. ٣ × ١٢.',
    img: 'ex/sf02.jpg', gif: 'ex/sf02.gif' },
  { id: 'sf03', n: 'wrist rock backs', bp: 'lower arms', eq: 'body weight', tg: 'forearms', mg: 'wrist flexors', sm: ['wrists'],
    st: ['Get on hands and knees, shoulders over wrists, hips over knees.', 'Turn your hands so the fingers point back toward your knees, as far as is comfortable.', 'Keep your palms on the floor and slowly rock your hips back, then return.'],
    desc: 'الكتف والفخذ والركبة زاوية ٩٠. اقلبي الرسغ العكس على قد ما تقدري، واتحركي لورا بوسطك وارجعي والرسغ ثابت على الأرض. ٣ × ١٠.',
    img: 'ex/sf03.jpg', gif: 'ex/sf03.gif' },
  { id: 'sf04', n: 'front & side shoulder stretch', bp: 'shoulders', eq: 'body weight', tg: 'delts', mg: 'front delts', sm: ['chest', 'biceps'],
    st: ['Stand tall or sit on a stool without a backrest.', 'Take your arms behind your back and hold your hands, wrists or elbows.', 'Gently draw your arms back until you feel the front of the shoulders stretch.', 'Hold 20 seconds, then repeat.'],
    desc: 'ضعي ذراعك خلف جسمك وامسكي الكوع أو الساعد أو الإيد التانية حسب مرونتك، واسحبي للخلف. ٣ × ٥، ثبات ٢٠ ثانية.',
    img: 'ex/sf04.jpg', gif: 'ex/sf04.gif' },
  { id: 'sf05', n: 'ankle mobilization (knee to wall)', bp: 'lower legs', eq: 'body weight', tg: 'calves', mg: 'ankles', sm: ['calves'],
    st: ['Half-kneel: front foot flat on the floor, back knee down behind you.', 'Hold your front foot with your hands and lift your chest.', 'Press your front knee forward over your toes without letting the heel lift.', 'Hold 10 seconds and return. Do both sides.'],
    desc: 'حطي رجلك كلها على الأرض والركبة التانية وراكي، اطلعي بصدرك واضغطي على فخدك لقدام من غير ما الكعب يرتفع. ٣ مجموعات كل ناحية × ١٠، ثبات ١٠ ثواني.' },
  { id: 'sf06', n: 'around the worlds (side-lying)', bp: 'back', eq: 'body weight', tg: 'upper back', mg: 'thoracic spine', sm: ['shoulders', 'chest'],
    st: ['Lie on your side with your top knee bent and resting on a raised support.', 'Reach your top arm forward, then sweep it overhead and around behind you in a big circle.', 'Let your chest and upper back rotate with the arm; keep the knee down.', 'Do all reps, then switch sides.'],
    desc: 'نامي على جنبك وثبتي رجلك اللي فوق على حاجة عالية، وحركي كتفك اللي فوق حركة دائرية مع صدرك. ٣ × ١٢.' },
  { id: 'sf07', n: 'dynamic 90/90 stretch', bp: 'upper legs', eq: 'body weight', tg: 'glutes', mg: 'hips', sm: ['adductors', 'abductors'],
    st: ['Sit on the floor with both knees bent to 90°, one leg in front, one to the side.', 'Keep your chest tall and hands behind you for support.', 'Rotate both knees to the other side so the legs switch positions.', 'Move slowly and keep switching.'],
    desc: 'زي الفيديو بالظبط. ٣ مجموعات × ١٠ عدات.' },
  { id: 'sf08', n: 'side plank leg raises', bp: 'waist', eq: 'body weight', tg: 'abs', mg: 'obliques', sm: ['glutes', 'abductors'],
    st: ['Start in a forearm plank with your body in a straight line.', 'Without letting your hips drop or twist, lift one leg out to the side.', 'Lower it with control and repeat; switch legs.'],
    desc: 'ثبتي الوسط في وضع البلانك وارفعي رجلك للجنب وانزلي ببطء. ٣ × ١٠–١٢.' }
]

// The trainer's YouTube demos for the post-workout stretches (from the SST stretching PDF).
export const SF_VIDEOS = {
  1167: 'https://www.youtube.com/watch?v=rT7rgXQtDcI',
  1271: 'https://www.youtube.com/watch?v=oXok7JXjGzk',
  1346: 'https://www.youtube.com/shorts/Y4pOwYzyTuI',
  '0690': 'https://www.youtube.com/watch?v=SwjO2mmeOOA',
  sf04: 'https://www.youtube.com/watch?v=RCTxFmr07P4',
  '0669': 'https://www.youtube.com/watch?v=C5pbKkESTtA',
  '0643': 'https://www.youtube.com/watch?v=5U_L-YJTxpc',
  1355: 'https://www.youtube.com/watch?v=7a1XqHpsVF0',
  1585: 'https://www.youtube.com/watch?v=Jku6PwFGBGk',
  1564: 'https://www.youtube.com/watch?v=gH8js7uRU2M',
  1494: 'https://www.youtube.com/watch?v=OrxjCE_tJ3k',
  1377: 'https://www.youtube.com/watch?v=2gqQcHJ9JEw'
}

// Trainer cues for library exercises in her plan (Arabic, shown under the animation).
export const SF_NOTES = {
  1167: 'قفي بين جدارين والذراعين مرفوعين حوالي ١٢٠ درجة، وخدي خطوة صغيرة لقدام لحد ما تحسي بالشد في الصدر. ٣ × ٥، ثبات ٢٠ ثانية.',
  1271: 'نفس الحركة بس الذراعين على مستوى الكتف تقريبا (الجزء السفلي من الصدر). ٣ × ٥، ثبات ٢٠ ثانية.',
  1346: 'امسكي طرف الحائط بإيدك، انزلي اسكوات ولفي جسمك شوية. كرري الناحية التانية. ٣ × ٥، ثبات ٢٠ ثانية.',
  '0690': 'اجلسي على كرسي والقدمين مفتوحين شوية، وانحني لتحت ناحية الأرض حسب مرونتك. ٣ × ٥، ثبات ٢٠ ثانية.',
  '0669': 'لفي ذراعيكي حول جسمك ومدي كتافك لقدام. ٣ × ٥، ثبات ٢٠ ثانية.',
  '0643': 'ارفعي الذراع والكوع جنب ودنك، وبالإيد التانية اسحبي الكوع لورا شوية. ٣ × ٥، ثبات ٢٠ ثانية.',
  1355: 'قفي جنب الحائط، ارفعي ذراعك ٩٠ درجة والكوع مفرود، ولفي جسمك للناحية العكسية (الباي). ٣ × ٥، ثبات ٢٠ ثانية.',
  1585: 'خطوة لقدام والركبة الأمامية مفرودة، وانحني لقدام وإيديكي عند القدم (الجلوتس وخلفية الفخذ). ٣ × ٥، ثبات ٢٠ ثانية.',
  1564: 'ركبة على الأرض والتانية ٩٠ درجة، وادفعي لقدام لحد ما تحسي بالشد في الفخذ الأمامي. ٣ × ٥، ثبات ٢٠ ثانية.',
  1494: 'اجلسي وضمي باطن القدمين لبعض، واضغطي بكوعك على الفخذ من جوه. زودي المدى بالتدريج. ٣ × ٥، ثبات ٢٠ ثانية.',
  1377: 'الركبة مفرودة وانزلي بالكعب لتحت على قد ما تقدري (على درجة سلم أو بإيدك على الحائط). ٣ × ٥، ثبات ٢٠ ثانية.',
  '0168': 'تكنيك HOLD: اثبتي ثانية في آخر الحركة.',
  3636: 'سبرينتر ني: ارفعي الركبة لفوق بسرعة وانتي واقفة (كل رجل). ٣ × ٢٠–٣٠ ثانية.',
  '0624': 'وول سيت: ضهرك على الحائط والركب ٩٠ درجة واثبتي (من غير مارش).',
  '0685': 'جري ومشي على المشاية: الجري في Z2 والمشي للراحة في Z1.',
  3666: 'جري ومشي على المشاية: الجري في Z2 والمشي للراحة في Z1.',
  2138: 'عجلة: ٥ دقايق Z2 تسخين، بعدين الفترات، و٥ دقايق Z2 في الآخر.'
}
