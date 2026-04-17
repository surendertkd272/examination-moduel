/**
 * Seed real student data into Supabase.
 * Clears ALL existing students (cascades to exams) then inserts real data.
 *
 * Usage:
 *   node scripts/seed-students.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://zlnywbpqzfxfluhuslob.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_XHxM2j-Vynvlykc-pyW2YQ_B022wJ34';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

// ── Real student data from enrollment sheets ──────────────────────────────────
// Fields: name, class (grade number), phone, schedule (MWF/TThS), level, level_category
// level_category: "Advance" | "Intermediate" | "" (for Level 1 and Level 4)

function makeStudent(id, name, grade, phone, schedule, level, level_category = '') {
  return {
    unique_id: `EQUI-${String(id).padStart(4, '0')}`,
    profile: {
      unique_id: `EQUI-${String(id).padStart(4, '0')}`,
      name,
      class: `Grade ${grade}`,
      phone: phone || '',
      schedule,
      level_category,
      age: 0,
      dob: '',
      school: '',
    },
    background_questionnaire: {
      events_attended: false,
      medals_won: 0,
      objective: '',
      coach_rating: 0,
    },
    progression: {
      levels: [level],
      timeline_lock_status: false,
      last_exam_date: '',
    },
  };
}

const students = [
  // ── LEVEL 1 — Monday/Wednesday/Friday ─────────────────────────────────────
  makeStudent(1,  'Bani Agarwal',                   8,  '6239102505', 'MWF', 1),
  makeStudent(2,  'Amolika Kaushal',                11, '6307741904', 'MWF', 1),
  makeStudent(3,  'Mohammed Mustafa Mohiuddin',     7,  '9000024971', 'MWF', 1),
  makeStudent(4,  'Mohammed Saad Muzakkir',         7,  '9000024971', 'MWF', 1),
  makeStudent(5,  'Mohammed Iqbaluddin Mudassir',   7,  '9000024971', 'MWF', 1),
  makeStudent(6,  'Nihal Raman Bookya',             5,  '',           'MWF', 1),
  makeStudent(7,  'Hanvitha Raman Bookya',          9,  '9491399974', 'MWF', 1),
  makeStudent(8,  'Sara Fatema',                    8,  '9885741012', 'MWF', 1),
  makeStudent(9,  'Rudra Dev Yadav',                8,  '8466808457', 'MWF', 1),
  makeStudent(10, 'Ira Yadav',                      6,  '9866808457', 'MWF', 1),
  makeStudent(11, 'Vishnuth Gupta Malyala',         5,  '9666984228', 'MWF', 1),
  makeStudent(12, 'Syed Ammaur Quadri',             5,  '9000566406', 'MWF', 1),
  makeStudent(13, 'Yashika Sagar',                  6,  '7874977144', 'MWF', 1),
  makeStudent(14, 'Gautam Krishna',                 4,  '8885178200', 'MWF', 1),
  makeStudent(15, 'Siddharth Sagar',                5,  '7874977144', 'MWF', 1),
  makeStudent(16, 'Ayaan Ram Muppala',              4,  '7032262025', 'MWF', 1),
  makeStudent(17, 'Kiana Jain',                     5,  '9440807162', 'MWF', 1),
  makeStudent(18, 'Hafsa Quraishi',                 5,  '9885221444', 'MWF', 1),
  makeStudent(19, 'Umar Dheeraj Tolani',            6,  '9493277777', 'MWF', 1),
  makeStudent(20, 'Serah Zoha Mowla',               7,  '6897445486', 'MWF', 1),
  makeStudent(21, 'Nirvi Rao Myle',                 5,  '9550392345', 'MWF', 1),
  makeStudent(22, 'Avehal Kapur Natarajan',         8,  '9908793775', 'MWF', 1),
  makeStudent(23, 'Mahesh Bhavanam Reddy',          6,  '6509277774', 'MWF', 1),

  // ── LEVEL 1 — Tuesday/Thursday/Saturday ──────────────────────────────────
  makeStudent(24, 'Vaishnavi Sankineani',            6,  '9704305380', 'TThS', 1),
  makeStudent(25, 'Ananya Sankineani',               6,  '9704305380', 'TThS', 1),
  makeStudent(26, 'Kadamash K',                      8,  '9618551899', 'TThS', 1),

  // ── LEVEL 2 Advance — Tuesday/Thursday/Saturday ───────────────────────────
  makeStudent(27, 'Vedika Iyer',                     1,  '7670825725', 'TThS', 2, 'Advance'),
  makeStudent(28, 'Rishika Das Gupta',               11, '9399944493', 'TThS', 2, 'Advance'),
  makeStudent(29, 'Risha Madhavram',                 6,  '9948630989', 'TThS', 2, 'Advance'),
  makeStudent(30, 'Sritani Neerumalla',              9,  '9059061095', 'TThS', 2, 'Advance'),
  makeStudent(31, 'Lakshmi Kshetra',                 9,  '7093580350', 'TThS', 2, 'Advance'),
  makeStudent(32, 'Vidhya Sri',                      4,  '9440408512', 'TThS', 2, 'Advance'),
  makeStudent(33, 'SM Vivek',                        10, '9160090009', 'TThS', 2, 'Advance'),
  makeStudent(34, 'Sreethan Patel Byreddy',          6,  '8897908195', 'TThS', 2, 'Advance'),
  makeStudent(35, 'P Guna Kaushal',                  9,  '9985371414', 'TThS', 2, 'Advance'),
  makeStudent(36, 'Rajveer Bhalerao',                5,  '9009900699', 'TThS', 2, 'Advance'),
  makeStudent(37, 'KNS Vishwas',                     5,  '9948630989', 'TThS', 2, 'Advance'),
  makeStudent(38, 'Myra Tibrewaala',                 7,  '9396843777', 'TThS', 2, 'Advance'),
  makeStudent(39, 'M V Vihaan Vardhan',              4,  '9966132199', 'TThS', 2, 'Advance'),
  makeStudent(40, 'Aliyah Singh',                    4,  '7506755521', 'TThS', 2, 'Advance'),
  makeStudent(41, 'Hammasqadir Ali Khan',            6,  '9949929857', 'TThS', 2, 'Advance'),
  makeStudent(42, 'Viaan Karuvath',                  5,  '9848777582', 'TThS', 2, 'Advance'),

  // ── LEVEL 2 Intermediate — Tuesday/Thursday/Saturday ─────────────────────
  makeStudent(43, 'Swara Vujjini',                   3,  '8008083419', 'TThS', 2, 'Intermediate'),
  makeStudent(44, 'Sai Neerumalla',                  9,  '9059061095', 'TThS', 2, 'Intermediate'),
  makeStudent(45, 'Nishka G',                        7,  '9502087000', 'TThS', 2, 'Intermediate'),
  makeStudent(46, 'Samyuktha Dhiankar',              5,  '8096011999', 'TThS', 2, 'Intermediate'),
  makeStudent(47, 'Hridaan Thakwani',                5,  '9885813613', 'TThS', 2, 'Intermediate'),
  makeStudent(48, 'Anaya Jain',                      7,  '9052000411', 'TThS', 2, 'Intermediate'),
  makeStudent(49, 'Kaan',                            5,  '9358500826', 'TThS', 2, 'Intermediate'),
  makeStudent(50, 'Sai Kashalad Chakravarthy',       6,  '9034205686', 'TThS', 2, 'Intermediate'),
  makeStudent(51, 'Griha Jain',                      9,  '9505588886', 'TThS', 2, 'Intermediate'),
  makeStudent(52, 'Ishaan Yadav Kukuta',             6,  '9949708651', 'TThS', 2, 'Intermediate'),
  makeStudent(53, 'Krithika Shon',                   5,  '8328575094', 'TThS', 2, 'Intermediate'),
  makeStudent(54, 'Rudramba Rao Chrumilla',          4,  '9780405410', 'TThS', 2, 'Intermediate'),
  makeStudent(55, 'Danish Zayed',                    8,  '8297371668', 'TThS', 2, 'Intermediate'),
  makeStudent(56, 'Saroya Manaal',                   8,  '8297371668', 'TThS', 2, 'Intermediate'),
  makeStudent(57, 'Anay Pratik Shah',                4,  '7799482922', 'TThS', 2, 'Intermediate'),
  makeStudent(58, 'Myra Pratham',                    9,  '9515121147', 'TThS', 2, 'Intermediate'),
  makeStudent(59, 'Reeyaansh Gupta',                 8,  '9000083419', 'TThS', 2, 'Intermediate'),
  makeStudent(60, 'Veer Vined Ammanabolu',           8,  '9849176543', 'TThS', 2, 'Intermediate'),

  // ── LEVEL 2 Intermediate — Monday/Wednesday/Friday ────────────────────────
  makeStudent(61, 'Kaira Sehgal',                    4,  '9885997017', 'MWF', 2, 'Intermediate'),
  makeStudent(62, 'S V S Karthikeya',                6,  '9812299001', 'MWF', 2, 'Intermediate'),
  makeStudent(63, 'Arjuna Reddy',                    7,  '9000024915', 'MWF', 2, 'Intermediate'),
  makeStudent(64, 'Jiyaan Basheer Chandra',          9,  '9703101111', 'MWF', 2, 'Intermediate'),
  makeStudent(65, 'K Ravraj',                        4,  '9949996896', 'MWF', 2, 'Intermediate'),
  makeStudent(66, 'Revanth Attaturi',                6,  '9703060366', 'MWF', 2, 'Intermediate'),
  makeStudent(67, 'Talha M',                         9,  '9436204364', 'MWF', 2, 'Intermediate'),
  makeStudent(68, 'Rohini',                          9,  '9866183666', 'MWF', 2, 'Intermediate'),
  makeStudent(69, 'Vihaan Allam',                    9,  '9014878546', 'MWF', 2, 'Intermediate'),
  makeStudent(70, 'Krish Vhaan Rrachakonda',         6,  '9866634449', 'MWF', 2, 'Intermediate'),
  makeStudent(71, 'Ayaan Dugar',                     5,  '9866551008', 'MWF', 2, 'Intermediate'),
  makeStudent(72, 'Zowaina Baig',                    6,  '9866608261', 'MWF', 2, 'Intermediate'),
  makeStudent(73, 'Ansh Krovvidi',                   3,  '7337529111', 'MWF', 2, 'Intermediate'),
  makeStudent(74, 'Mohammed Saqib Khan',             9,  '9100090990', 'MWF', 2, 'Intermediate'),
  makeStudent(75, 'Anav M Dehilkar',                 7,  '9849582655', 'MWF', 2, 'Intermediate'),
  makeStudent(76, 'S Aarav',                         3,  '9676282025', 'MWF', 2, 'Intermediate'),
  makeStudent(77, 'Olive',                           5,  '9799519426', 'MWF', 2, 'Intermediate'),
  makeStudent(78, 'Aeria Agarwal',                   7,  '9676470585', 'MWF', 2, 'Intermediate'),
  makeStudent(79, 'Aini Yadav Botalboina',           6,  '9849046216', 'MWF', 2, 'Intermediate'),

  // ── LEVEL 3 Advance — Monday/Wednesday/Friday ─────────────────────────────
  makeStudent(80, 'Sana Rumalla',                    8,  '9908764438', 'MWF', 3, 'Advance'),
  makeStudent(81, 'Ganpati Nanika Chowdary',         7,  '9963156969', 'MWF', 3, 'Advance'),
  makeStudent(82, 'Anika Kabra',                     9,  '9990583653', 'MWF', 3, 'Advance'),
  makeStudent(83, 'J Sanvika',                       7,  '9949333711', 'MWF', 3, 'Advance'),
  makeStudent(84, 'Zerah Zoha Mowla',                7,  '7729958628', 'MWF', 3, 'Advance'),
  makeStudent(85, 'Sahasra Jilendra',                8,  '8897995600', 'MWF', 3, 'Advance'),
  makeStudent(86, 'Vhaan Merani',                    6,  '9908398763', 'MWF', 3, 'Advance'),
  makeStudent(87, 'Atharv Chandra Varma T',          9,  '9703589784', 'MWF', 3, 'Advance'),
  makeStudent(88, 'Idarth Seth',                     9,  '9849807073', 'MWF', 3, 'Advance'),
  makeStudent(89, 'Syed Moinudin Ali Khan',          7,  '9177711112', 'MWF', 3, 'Advance'),
  makeStudent(90, 'Krithikar Lengampalli',           6,  '9542115657', 'MWF', 3, 'Advance'),
  makeStudent(91, 'Theja Malakhli',                  8,  '9866884812', 'MWF', 3, 'Advance'),
  makeStudent(92, 'Munira Hussain',                  9,  '9652515794', 'MWF', 3, 'Advance'),
  makeStudent(93, 'Sathvik Chinnamasetty',           6,  '9482162013', 'MWF', 3, 'Advance'),
  makeStudent(94, 'Lokith Chinnamasetty',            6,  '9482162013', 'MWF', 3, 'Advance'),
  makeStudent(95, 'Amogh G',                         7,  '9052343767', 'MWF', 3, 'Advance'),
  makeStudent(96, 'Anagh B',                         7,  '9985234576', 'MWF', 3, 'Advance'),
  makeStudent(97, 'Hisham Abdul Hameed',             6,  '7093829263', 'MWF', 3, 'Advance'),
  makeStudent(98, 'Arav Shiran',                     8,  '9108114080', 'MWF', 3, 'Advance'),
  makeStudent(99, 'Riddhima K',                      6,  '9773527999', 'MWF', 3, 'Advance'),
  makeStudent(100,'Vansh Sharma',                    5,  '9649659016', 'MWF', 3, 'Advance'),
  makeStudent(101,'Prathyagra',                      6,  '9423162013', 'MWF', 3, 'Advance'),
  makeStudent(102,'Rishabh Kapoor',                  6,  '9482162013', 'MWF', 3, 'Advance'),
  makeStudent(103,'Akshaj Anand Tsama',              7,  '9177777124', 'MWF', 3, 'Advance'),
  makeStudent(104,'V Sadhvi',                        8,  '7093829263', 'MWF', 3, 'Advance'),
  makeStudent(105,'Aravhao Rao',                     5,  '9985899015', 'MWF', 3, 'Advance'),
  makeStudent(106,'Tanush Kumar',                    8,  '8008630872', 'MWF', 3, 'Advance'),

  // ── LEVEL 3 Advance — Tuesday/Thursday/Saturday ───────────────────────────
  makeStudent(107,'Syed Ali Abdul Razzaq',           5,  '9966970008', 'TThS', 3, 'Advance'),
  makeStudent(108,'Anay Reddy J',                    6,  '9963164183', 'TThS', 3, 'Advance'),
  makeStudent(109,'Saanvi Sri',                      3,  '9492025490', 'TThS', 3, 'Advance'),
  makeStudent(110,'Ansh Kapoor',                     5,  '9440033598', 'TThS', 3, 'Advance'),
  makeStudent(111,'Agasthya',                        8,  '9177727205', 'TThS', 3, 'Advance'),
  makeStudent(112,'Tanishka Banita',                 7,  '9885414000', 'TThS', 3, 'Advance'),
  makeStudent(113,'Venotshitha Reddy',               7,  '9849861159', 'TThS', 3, 'Advance'),
  makeStudent(114,'Nived Rao V',                     4,  '8008083419', 'TThS', 3, 'Advance'),

  // ── LEVEL 3 Intermediate — Tuesday/Thursday/Saturday ─────────────────────
  makeStudent(115,'Ananya D',                        6,  '8886802704', 'TThS', 3, 'Intermediate'),
  makeStudent(116,'Daanya Ali',                      5,  '8790994266', 'TThS', 3, 'Intermediate'),
  makeStudent(117,'RajVardhain Bantia',              5,  '8886802704', 'TThS', 3, 'Intermediate'),
  makeStudent(118,'Dhrithi Jain',                    5,  '',           'TThS', 3, 'Intermediate'),
  makeStudent(119,'Sreevatsuru Neerumalla',          5,  '9059061095', 'TThS', 3, 'Intermediate'),
  makeStudent(120,'Devashna Chowdhary Veluri',       6,  '8143025965', 'TThS', 3, 'Intermediate'),
  makeStudent(121,'Aarush Mandal',                   10, '9479571850', 'TThS', 3, 'Intermediate'),

  // ── LEVEL 4 — Monday/Wednesday/Friday ─────────────────────────────────────
  makeStudent(122,'Karthik Balram Nuthakki',         9,  '8688140142', 'MWF', 4),
  makeStudent(123,'Lipika Pallem',                   12, '9121678080', 'MWF', 4),
  makeStudent(124,'Keyura',                          11, '8500035209', 'MWF', 4),
  makeStudent(125,'Veda Seth',                       8,  '9849807073', 'MWF', 4),

  // ── LEVEL 4 — Tuesday/Thursday/Saturday ──────────────────────────────────
  makeStudent(126,'Yuvan Amogh',                     7,  '9449823638', 'TThS', 4),
  makeStudent(127,'Yashita Banta',                   10, '9885414000', 'TThS', 4),
  makeStudent(128,'Venya Nuthak',                    10, '9302502679', 'TThS', 4),
  makeStudent(129,'Preethi Pradhan Bali',            12, '9618111641', 'TThS', 4),
  makeStudent(130,'Shahzaad',                        4,  '9618111641', 'TThS', 4),
];

async function main() {
  console.log('Clearing existing students and exams...');

  // Delete all exams first (foreign key constraint)
  const { error: examDelErr } = await supabase.from('exams').delete().neq('id', '___never___');
  if (examDelErr) {
    console.error('  Exams delete error:', examDelErr.message);
  } else {
    console.log('  Exams cleared.');
  }

  // Delete all students
  const { error: stuDelErr } = await supabase.from('students').delete().neq('unique_id', '___never___');
  if (stuDelErr) {
    console.error('  Students delete error:', stuDelErr.message);
  } else {
    console.log('  Students cleared.');
  }

  // Insert real students in batches of 20
  console.log(`\nInserting ${students.length} real students...`);
  const batchSize = 20;
  let inserted = 0;
  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize);
    const { error } = await supabase.from('students').insert(
      batch.map(s => ({
        unique_id: s.unique_id,
        profile: s.profile,
        background_questionnaire: s.background_questionnaire,
        progression: s.progression,
      }))
    );
    if (error) {
      console.error(`  Batch ${i / batchSize + 1} error:`, error.message);
    } else {
      inserted += batch.length;
      console.log(`  Inserted ${inserted}/${students.length}...`);
    }
  }

  console.log('\nDone! Real student data is now live in the database.');
}

main().catch(console.error);
