import { Children, cloneElement, isValidElement, useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  useBuildWorkforcePathway,
  useExtractProfileSkills,
  useGetWorkforceDashboard,
  useMatchWorkforceRoles,
  useRefreshWorkforceSignals,
  getGetWorkforceDashboardQueryKey,
} from '@workspace/api-client-react';
import CareerChatPage from './pages/career-chat';
import { skillReferenceSources } from './lib/skill-references';
import type {
  CareerMatch,
  LearnerProfile,
  LearningPathway,
  WorkforceDashboard,
} from '@workspace/api-client-react';
import {
  ArrowRight, BookOpen, Check, ExternalLink,
  FileText, Globe2, HeartHandshake, LoaderCircle, RefreshCw, Sparkles,
  Target, TrendingUp, Upload,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';

const queryClient = new QueryClient();
const PROFILE_KEY = 'matchykan-profile';
const PATHWAY_KEY = 'matchykan-pathway';
const PROGRESS_KEY = 'matchykan-progress';
const profileSkillChoices = [
  'Artificial Intelligence', 'Data Analytics', 'Cybersecurity', 'Cloud Computing',
  'Embedded Systems', 'Industrial Automation', 'Renewable Energy',
  'Communication Skills', 'Software Development', 'Project Management',
];
const defaultProfile: LearnerProfile = {
  experience: '',
  interests: 'AI & Data',
  skills: ['Data Analytics', 'Communication Skills', 'Software Development'],
  sdgs: [4, 8, 9],
  scenario: 'moderate',
};

const navItems = [
  { href: '/', label: 'Home', bm: 'Utama' },
  { href: '/profile', label: 'Profile', bm: 'Profil' },
  { href: '/radar', label: 'Skills Radar', bm: 'Radar Kemahiran' },
  { href: '/matches', label: 'Career Matches', bm: 'Padanan Kerjaya' },
  { href: '/pathway', label: 'Learning Path', bm: 'Laluan Belajar' },
  { href: '/sdg', label: 'SDG Impact', bm: 'Impak SDG' },
];

const bmCopy: Record<string, string> = {
  'Get started': 'Mula',
  'The future of work, made personal': 'Masa depan pekerjaan, untuk anda',
  'Your future.': 'Masa depan anda.',
  'Your match.': 'Padanan anda.',
  'A practical guide from the skills you have today to the roles you could explore next. See why a role may fit, what you might learn, and how your choices connect to a more sustainable future.': 'Panduan praktikal untuk menghubungkan kemahiran anda hari ini dengan peranan yang boleh diterokai seterusnya. Ketahui sebab sesuatu peranan mungkin sesuai, perkara yang boleh dipelajari dan kaitan pilihan anda dengan masa depan yang lebih mampan.',
  'You choose the direction. Suggestions are not hiring decisions or job guarantees.': 'Anda menentukan hala tuju. Cadangan ini bukan keputusan pengambilan pekerja atau jaminan pekerjaan.',
  'Discover my future': 'Terokai masa depan saya',
  'Explore future skills': 'Terokai kemahiran masa depan',
  'Explore MatchyKan': 'Terokai MatchyKan',
  'Discover future skills': 'Kenali kemahiran masa depan',
  'Explore signals, evidence and possible changes.': 'Terokai isyarat, bukti dan kemungkinan perubahan.',
  'Understand your fit': 'Fahami kesesuaian anda',
  'Compare skill overlap and areas to build.': 'Bandingkan kemahiran yang sepadan dan bidang untuk diperkukuh.',
  'Choose your next steps': 'Pilih langkah seterusnya',
  'Make a learning plan at your own pace.': 'Bina pelan pembelajaran mengikut rentak anda.',
  'Connect to impact': 'Hubungkan dengan impak',
  'Explore how work can relate to the SDGs.': 'Terokai kaitan pekerjaan dengan Matlamat Pembangunan Mampan (SDG).',
  'A clear route, at your pace': 'Laluan yang jelas, mengikut rentak anda',
  "From today's skills to": 'Daripada kemahiran hari ini kepada',
  "tomorrow's options.": 'pilihan hari esok.',
  'Start with what you know. Explore what may be next.': 'Mulakan dengan perkara yang anda tahu. Terokai kemungkinan seterusnya.',
  'Build your profile': 'Bina profil anda',
  '01 · Discover': '01 · Kenali',
  'Understand your starting point': 'Fahami titik permulaan anda',
  'Share skills, experience and interests. A CV is optional; you can also enter skills yourself.': 'Kongsi kemahiran, pengalaman dan minat. CV adalah pilihan; anda juga boleh memasukkan kemahiran sendiri.',
  'Build profile': 'Bina profil',
  '02 · Explore': '02 · Terokai',
  'Compare possible futures': 'Bandingkan kemungkinan masa depan',
  'Read the signals and their evidence. Change scenarios to explore different assumptions.': 'Teliti isyarat dan buktinya. Tukar senario untuk meneroka andaian yang berbeza.',
  'View radar': 'Lihat radar',
  '03 · Prepare': '03 · Bersedia',
  'Make a practical plan': 'Bina pelan yang praktikal',
  'Compare possible roles, identify learning gaps and follow steps you choose.': 'Bandingkan peranan yang mungkin sesuai, kenal pasti jurang pembelajaran dan ikuti langkah pilihan anda.',
  'Find matches': 'Cari padanan',
  'Malaysia workforce overview': 'Gambaran tenaga kerja Malaysia',
  'Signals to': 'Isyarat untuk',
  'explore.': 'diterokai.',
  'Open skills radar': 'Buka radar kemahiran',
  'Loading workforce signals…': 'Sedang memuatkan isyarat tenaga kerja…',
  'A moment while the latest information is prepared.': 'Sila tunggu sementara maklumat terkini disediakan.',
  'Could not load': 'Tidak dapat dimuatkan',
  'Workforce signals are unavailable right now.': 'Isyarat tenaga kerja tidak tersedia buat masa ini.',
  'Your profile stays in this browser. Try loading the public signals again.': 'Profil anda kekal dalam pelayar ini. Cuba muatkan isyarat awam sekali lagi.',
  'Try again': 'Cuba lagi',
  'No signals are available yet.': 'Belum ada isyarat yang tersedia.',
  'Refresh the feed or return later. We will not fill gaps with invented live statistics.': 'Muat semula suapan atau kembali kemudian. Kami tidak akan mengisi kekosongan dengan statistik langsung yang direka.',
  'Refresh signals': 'Muat semula isyarat',
  'mentions': 'sebutan',
  'Worth knowing:': 'Perkara penting:',
  'This is illustrative demo data, not a measured labour-market forecast.': 'Ini ialah data demo ilustrasi, bukan ramalan pasaran kerja yang diukur.',
  'This view uses a refreshed public RSS sample.': 'Paparan ini menggunakan sampel RSS awam yang telah dikemas kini.',
  'Signals may be incomplete and reflect the limits of their sources. They are for exploration, not a promise of employment.': 'Isyarat mungkin tidak lengkap dan tertakluk pada batas sumbernya. Gunakannya untuk penerokaan, bukan sebagai janji pekerjaan.',
  'A guide, not a verdict': 'Panduan, bukan keputusan muktamad',
  'Keep your choices yours.': 'Pilihan tetap di tangan anda.',
  'MatchyKan helps you explore options and prepare questions. A score is an estimate of skill overlap, not a measure of your worth, employability or future outcome.': 'MatchyKan membantu anda meneroka pilihan dan menyediakan soalan. Skor ialah anggaran pertindihan kemahiran, bukan ukuran nilai diri, kebolehpasaran atau hasil masa depan anda.',
  'See how matches work': 'Ketahui cara padanan berfungsi',
  'Small steps count': 'Langkah kecil tetap bermakna',
  'Start where you are.': 'Mulakan dari tempat anda berada.',
  'Your profile and learning progress are saved in this browser. You can change your interests, remove skills or take a different direction whenever you like.': 'Profil dan kemajuan pembelajaran anda disimpan dalam pelayar ini. Anda boleh menukar minat, membuang kemahiran atau memilih hala tuju lain pada bila-bila masa.',
  'Set up your profile': 'Sediakan profil anda',
  '01 / Your starting point': '01 / Titik permulaan anda',
  'Tell us about': 'Kongsikan tentang',
  'you.': 'diri anda.',
  'A few details help us explain possible role matches. Share only what feels useful.': 'Beberapa maklumat membantu kami menerangkan padanan peranan yang mungkin sesuai. Kongsi perkara yang anda rasa berguna sahaja.',
  'Optional profile': 'Profil pilihan',
  'Your profile': 'Profil anda',
  'Name (optional)': 'Nama (pilihan)',
  'How should we address you?': 'Apakah nama panggilan pilihan anda?',
  'AI & Data': 'AI dan Data',
  'Engineering & Automation': 'Kejuruteraan dan Automasi',
  'Sustainability & Clean Energy': 'Kemampanan dan Tenaga Bersih',
  'Cybersecurity': 'Keselamatan Siber',
  'Digital Product & UX': 'Produk Digital dan UX',
  'Current stage': 'Peringkat semasa',
  'Choose a stage': 'Pilih peringkat',
  'Final-year student': 'Pelajar tahun akhir',
  'Fresh graduate': 'Graduan baharu',
  'Early-career professional': 'Profesional awal kerjaya',
  'TVET learner': 'Pelajar TVET',
  'Career explorer': 'Peneroka kerjaya',
  'Areas you are curious about': 'Bidang yang menarik minat anda',
  'Still exploring': 'Masih meneroka',
  'Skills you already use': 'Kemahiran yang sudah anda gunakan',
  'For example: Excel, communication, Python': 'Contohnya: Excel, komunikasi, Python',
  'Separate skills with commas. Include coursework, projects, volunteering or work experience.': 'Pisahkan kemahiran dengan koma. Sertakan tugasan kursus, projek, kerja sukarela atau pengalaman kerja.',
  'Projects or experience (optional)': 'Projek atau pengalaman (pilihan)',
  'A class project, internship, club activity…': 'Projek kelas, latihan industri, aktiviti kelab…',
  'Future scenario': 'Senario masa depan',
  'Slight change': 'Perubahan kecil',
  'Moderate change': 'Perubahan sederhana',
  'Scenario assumptions are exploratory, not predictions.': 'Andaian senario ini untuk penerokaan, bukan ramalan.',
  'Learning time / week': 'Masa belajar / minggu',
  '2 hours': '2 jam',
  '4 hours': '4 jam',
  '6 hours': '6 jam',
  '10 hours': '10 jam',
  'hours': 'jam',
  'Goals you care about': 'Matlamat yang penting bagi anda',
  'Saved in this browser': 'Disimpan dalam pelayar ini',
  'Save profile': 'Simpan profil',
  'Find possible matches': 'Cari padanan yang mungkin',
  'We could not prepare matches right now. Please try again.': 'Padanan tidak dapat disediakan buat masa ini. Sila cuba lagi.',
  'Optional CV skill extraction': 'Pengekstrakan kemahiran CV pilihan',
  'Review skills from a document.': 'Semak kemahiran daripada dokumen.',
  'You can skip this and type skills yourself. A CV is only sent for skill extraction after you choose a file and give consent.': 'Anda boleh langkau langkah ini dan taip kemahiran sendiri. CV hanya dihantar untuk pengekstrakan kemahiran selepas anda memilih fail dan memberikan persetujuan.',
  'Choose PDF, DOCX or TXT': 'Pilih PDF, DOCX atau TXT',
  'Maximum file size: 5 MB. No other file types are accepted.': 'Saiz fail maksimum: 5 MB. Jenis fail lain tidak diterima.',
  'I consent to sending text extracted from this CV to Runpod’s Qwen3-8B model for skill extraction. MatchyKan does not store the file or extracted text; Runpod processes the text under its own policies.': 'Saya bersetuju teks yang diekstrak daripada CV ini dihantar kepada model Qwen3-8B Runpod untuk mengekstrak kemahiran. MatchyKan tidak menyimpan fail atau teks yang diekstrak; Runpod memproses teks mengikut dasarnya sendiri.',
  'AI suggestions from your CV. Review each suggestion before adding it. MatchyKan does not save the file or extracted text.': 'Cadangan AI daripada CV anda. Semak setiap cadangan sebelum menambahkannya. MatchyKan tidak menyimpan fail atau teks yang diekstrak.',
  'No catalogue skills were identified. You can add skills manually.': 'Tiada kemahiran dalam katalog dikenal pasti. Anda boleh menambah kemahiran secara manual.',
  'Reviewing document…': 'Sedang menyemak dokumen…',
  'Recognise skills': 'Kenal pasti kemahiran',
  'No file chosen': 'Tiada fail dipilih',
  'Please select a PDF, DOCX or TXT file no larger than 5 MB.': 'Sila pilih fail PDF, DOCX atau TXT yang tidak melebihi 5 MB.',
  'We could not recognize skills from this file. You can enter them manually.': 'Kemahiran tidak dapat dikenal pasti daripada fail ini. Anda boleh memasukkannya secara manual.',
  'Review before adding': 'Semak sebelum menambah',
  'Select only the skills that describe you.': 'Pilih kemahiran yang benar-benar menggambarkan diri anda sahaja.',
  'Add selected skills': 'Tambah kemahiran dipilih',
  'Clear selection': 'Kosongkan pilihan',
  'After you consent, extracted CV text (not the original file) is sent to Runpod’s Qwen3-8B model for skill suggestions. MatchyKan does not store the file or extracted text. Review every suggestion; you decide what enters your profile. You can also add skills manually.': 'Selepas anda memberikan persetujuan, teks yang diekstrak daripada CV (bukan fail asal) dihantar kepada model Qwen3-8B Runpod untuk mencadangkan kemahiran. MatchyKan tidak menyimpan fail atau teks yang diekstrak. Semak setiap cadangan; anda menentukan perkara yang dimasukkan ke dalam profil. Anda juga boleh menambah kemahiran secara manual.',
  'We could not get skill suggestions from Runpod. Please try again or enter skills manually.': 'Cadangan kemahiran daripada Runpod tidak dapat diperoleh. Cuba lagi atau masukkan kemahiran secara manual.',
  '02 / Signals to watch': '02 / Isyarat untuk diperhatikan',
  'Future skills': 'Kemahiran masa depan',
  'radar.': 'radar.',
  'Explore workforce signals and their supporting evidence. Scenario views help you ask “what if”, not tell you what will happen.': 'Terokai isyarat tenaga kerja dan bukti sokongannya. Paparan senario membantu anda bertanya “bagaimana jika”, bukan memberitahu perkara yang pasti berlaku.',
  'Scenario view': 'Paparan senario',
  'Skills in the latest feed': 'Kemahiran dalam suapan terkini',
  'Skills in the ': 'Kemahiran dalam ',
  'latest feed.': 'suapan terkini.',
  'CURRENT SNAPSHOT': 'GAMBARAN SEMASA',
  'Current snapshot': 'Gambaran semasa',
  'Current signal index': 'Indeks isyarat semasa',
  'Current role signal index': 'Indeks isyarat peranan semasa',
  'Slight scenario index': 'Indeks senario perubahan kecil',
  'Moderate scenario index': 'Indeks senario perubahan sederhana',
  'Scenario index': 'Indeks senario',
  'Observed trend': 'Trend diperhatikan',
  'Skills mapped to this role': 'Kemahiran yang dipetakan kepada peranan ini',
  'Role signal index': 'Indeks isyarat peranan',
  'Role signals from ': 'Isyarat peranan daripada ',
  'mapped skills.': 'kemahiran yang dipetakan.',
  'Slight change scenario (+10%)': 'Senario perubahan kecil (+10%)',
  'Moderate change scenario (+25%)': 'Senario perubahan sederhana (+25%)',
  'Scenario assumptions': 'Andaian senario',
  'Evidence items': 'Item bukti',
  'Saved snapshots': 'Gambaran disimpan',
  'Skills tracked': 'Kemahiran dijejak',
  'Source': 'Sumber',
  'Public Google News RSS': 'Suapan RSS Google News awam',
  'Illustrative demo feed': 'Suapan demo ilustrasi',
  'Keyword matches in titles and summaries': 'Padanan kata kunci dalam tajuk dan ringkasan',
  'The index is normalized to the most-mentioned skill in this snapshot. Counts are keyword matches in article titles and summaries, not unique job ads. The scenario index is a separate what-if adjustment.': 'Indeks dinormalkan kepada kemahiran yang paling banyak disebut dalam gambaran ini. Kiraan ialah padanan kata kunci dalam tajuk dan ringkasan artikel, bukan iklan kerja unik. Indeks senario ialah pelarasan “bagaimana jika” yang berasingan.',
  'One saved snapshot is available; historical direction is not measurable yet. Refresh again later to compare another snapshot.': 'Satu gambaran telah disimpan; arah sejarah belum dapat diukur. Muat semula kemudian untuk membandingkan gambaran lain.',
  'Observed source data': 'Data sumber yang diperhatikan',
  'A cautious role view': 'Paparan peranan yang berhati-hati',
  'Role index is the average of the latest indices for its mapped skills. It is not job openings or hiring demand.': 'Indeks peranan ialah purata indeks terkini bagi kemahiran yang dipetakan. Ini bukan kekosongan kerja atau permintaan pengambilan pekerja.',
  'One snapshot so far; a historical direction is not available yet.': 'Setakat ini satu gambaran; arah sejarah belum tersedia.',
  'Current snapshot; direction needs another snapshot': 'Gambaran semasa; arah memerlukan satu lagi gambaran',
  'Direction comes from collected snapshots, not from the scenario adjustment.': 'Arah perubahan berdasarkan gambaran yang dikumpulkan, bukan pelarasan senario.',
  'No source mentions for this skill in the current sample.': 'Tiada sebutan sumber untuk kemahiran ini dalam sampel semasa.',
  'Role index is the average of the latest indices for its mapped skills.': 'Indeks peranan ialah purata indeks terkini bagi kemahiran yang dipetakan.',
  'rising': 'meningkat',
  'steady': 'stabil',
  'declining': 'menurun',
  'An exploratory signal to help you consider how this skill could complement your experience. Check the evidence below and form your own view.': 'Isyarat penerokaan ini membantu anda mempertimbangkan cara kemahiran tersebut melengkapi pengalaman anda. Semak bukti di bawah dan buat penilaian sendiri.',
  'Evidence behind this view': 'Bukti di sebalik paparan ini',
  'Supporting articles': 'Artikel sokongan',
  'Open article': 'Buka artikel',
  'No matching article in this feed sample.': 'Tiada artikel sepadan dalam sampel suapan ini.',
  'Search articles for': 'Cari artikel tentang',
  'A cautious role outlook': 'Unjuran peranan yang berhati-hati',
  'Skills mapped to': 'Kemahiran dipadankan dengan',
  'possible roles.': 'peranan yang mungkin.',
  'A simple extrapolation of skill-signal indices, not job openings or hiring demand.': 'Unjuran ringkas berdasarkan indeks isyarat kemahiran, bukan kekosongan kerja atau permintaan pengambilan pekerja.',
  'Role signals are mapped from skills in the current feed. Scenario values are assumption-based overlays, not forecasts of vacancies, wages or employment.': 'Isyarat peranan dipetakan daripada kemahiran dalam suapan semasa. Nilai senario ialah pelarasan berasaskan andaian, bukan ramalan kekosongan, gaji atau pekerjaan.',
  'Publication date not supplied': 'Tarikh penerbitan tidak diberikan',
  'A short feed sample can be incomplete and does not represent the whole Malaysian labour market.': 'Sampel suapan ringkas mungkin tidak lengkap dan tidak mewakili keseluruhan pasaran kerja Malaysia.',
  'Scenario view:': 'Paparan senario:',
  'Links below are illustrative; a role does not automatically advance a goal.': 'Pautan di bawah ialah ilustrasi; sesuatu peranan tidak secara automatik memajukan sesuatu matlamat.',
  'Explore how roles can connect to the SDGs': 'Terokai hubungan antara peranan dengan SDG',
  'Mark complete': 'Tandakan selesai',
  'Mark incomplete': 'Tandakan belum selesai',
  'The public news feed could not be refreshed. Your previous snapshot is still available.': 'Suapan berita awam tidak dapat dimuat semula. Gambaran terdahulu masih tersedia.',
  'Read the source,': 'Baca sumbernya,',
  'not just the signal.': 'bukan isyarat sahaja.',
  'Open source': 'Buka sumber',
  'No evidence items in this snapshot.': 'Tiada item bukti dalam gambaran ini.',
  'Try refreshing the feed. Forecasts without evidence should be treated especially cautiously.': 'Cuba muat semula suapan. Ramalan tanpa bukti perlu ditafsir dengan lebih berhati-hati.',
  'Explore role matches': 'Terokai padanan peranan',
  '03 / Your possible next roles': '03 / Pilihan peranan seterusnya',
  'Career options that': 'Pilihan kerjaya yang',
  'may fit.': 'mungkin sesuai.',
  'Ranked by skill overlap with your profile. Each match explains the overlap and possible areas to develop.': 'Disusun mengikut pertindihan kemahiran dengan profil anda. Setiap padanan menerangkan persamaan dan bidang yang boleh diperkukuh.',
  'Explainable matches': 'Padanan yang boleh dijelaskan',
  'Comparing your profile with possible roles…': 'Sedang membandingkan profil anda dengan peranan yang mungkin…',
  'Closest skill overlap': 'Pertindihan kemahiran tertinggi',
  'Possible option': 'Pilihan yang mungkin',
  'Update profile': 'Kemas kini profil',
  'Explore career matches': 'Terokai padanan kerjaya',
  'No SDG mapping supplied': 'Pemetaan SDG tidak diberikan',
  'Estimated skill overlap': 'Anggaran pertindihan kemahiran',
  'Potential match': 'Padanan yang berpotensi',
  'Skills you already bring': 'Kemahiran yang sudah anda miliki',
  'None identified yet': 'Belum dikenal pasti',
  'Possible learning areas': 'Bidang pembelajaran yang mungkin',
  'Keep practising': 'Terus berlatih',
  'SDG links:': 'Pautan SDG:',
  'Plan for this role': 'Rancang untuk peranan ini',
  'Start with your own profile': 'Mulakan dengan profil anda',
  'See possible matches based on your skills.': 'Lihat padanan yang mungkin berdasarkan kemahiran anda.',
  'Your profile currently includes': 'Profil anda kini merangkumi',
  'skill': 'kemahiran',
  'MatchyKan uses overlap as a conversation starter, not a hiring score.': 'MatchyKan menggunakan pertindihan sebagai permulaan perbualan, bukan skor pengambilan pekerja.',
  'Review profile': 'Semak profil',
  'Explore my matches': 'Terokai padanan saya',
  'Match scores estimate skill overlap only. They are not validated measures of ability, employability or hiring suitability. Gaps are learning ideas, not judgements. No hiring decisions or job guarantees.': 'Skor padanan hanya menganggarkan pertindihan kemahiran. Ia bukan ukuran keupayaan, kebolehpasaran atau kesesuaian pengambilan pekerja yang disahkan. Jurang ialah idea pembelajaran, bukan penilaian. Tiada keputusan pengambilan pekerja atau jaminan pekerjaan.',
  'Re-run with profile': 'Jalankan semula dengan profil',
  'Explore SDG context': 'Terokai konteks SDG',
  '04 / Small steps, real progress': '04 / Langkah kecil, kemajuan nyata',
  'A learning plan,': 'Pelan pembelajaran,',
  'at your pace.': 'mengikut rentak anda.',
  'Choose a role, set realistic weekly time and adapt these suggested steps to your life.': 'Pilih peranan, tetapkan masa mingguan yang realistik dan sesuaikan langkah cadangan dengan kehidupan anda.',
  'Learning plan': 'Pelan pembelajaran',
  'Build a longer pathway': 'Bina laluan yang lebih menyeluruh',
  'Choose another role path': 'Pilih laluan peranan lain',
  'Build this pathway': 'Bina laluan ini',
  'Refresh this pathway': 'Muat semula laluan ini',
  'Build another pathway': 'Bina laluan lain',
  'Build or refresh a role-based plan.': 'Bina atau muat semula pelan berasaskan peranan.',
  'Based on your approved profile skills': 'Berdasarkan kemahiran profil anda yang diluluskan',
  'Upload or review your profile': 'Muat naik atau semak profil anda',
  'Your CV is not sent to the pathway builder. Only skills you review and add to your profile are used.': 'CV anda tidak dihantar kepada pembina laluan. Hanya kemahiran yang anda semak dan tambah pada profil digunakan.',
  'Each skill gap becomes a foundation, practice and project step, followed by a role-focused portfolio project.': 'Setiap jurang kemahiran menjadi langkah asas, latihan dan projek, diikuti projek portfolio yang berkaitan dengan peranan.',
  'Your approved profile skills are used to focus the plan on areas you have not added yet.': 'Kemahiran profil anda yang diluluskan digunakan untuk memfokuskan pelan pada bidang yang belum anda tambah.',
  'Each skill gap becomes a fuller route.': 'Setiap jurang kemahiran menjadi laluan yang lebih lengkap.',
  'Each skill gap becomes a foundation, practice and project step, followed by a role-focused portfolio project. You can upload a PDF, DOCX or TXT CV on your profile page and review suggested skills. The CV itself is not sent to the pathway builder.': 'Setiap jurang kemahiran menjadi langkah asas, latihan dan projek, diikuti projek portfolio yang berkaitan dengan peranan. Anda boleh memuat naik CV PDF, DOCX atau TXT pada halaman profil dan menyemak kemahiran yang dicadangkan. CV itu sendiri tidak dihantar kepada pembina laluan.',
  'Your progress': 'Kemajuan anda',
  'steps complete': 'langkah selesai',
  'of': 'daripada',
  'About': 'Kira-kira',
  'learning hours in total. The actual pace depends on your starting point and available time.': 'jam pembelajaran keseluruhan. Tempoh sebenar bergantung pada titik permulaan dan masa yang tersedia.',
  'How much learning time?': 'Berapa banyak masa untuk belajar?',
  'Work through in order': 'Ikuti mengikut turutan',
  'One useful step': 'Satu langkah berguna',
  'at a time.': 'pada satu-satu masa.',
  'Step': 'Langkah',
  'Make:': 'Hasilkan:',
  'Open learning resource': 'Buka sumber pembelajaran',
  'Refresh plan': 'Muat semula pelan',
  'Build a starting plan': 'Bina pelan permulaan',
  'Pick a role to explore.': 'Pilih peranan untuk diterokai.',
  'A plan is a starting point, not a fixed schedule. Choose something that feels relevant and adjust as you go.': 'Pelan ialah titik permulaan, bukan jadual tetap. Pilih perkara yang dirasakan relevan dan sesuaikan sepanjang perjalanan.',
  'Possible role': 'Peranan yang mungkin',
  'Hours available per week:': 'Jam tersedia setiap minggu:',
  'The actual pace depends on your starting point and available time.': 'Tempoh sebenar bergantung pada titik permulaan dan masa yang tersedia.',
  '/100 signal index': '/100 indeks isyarat',
  'Signal index': 'Indeks isyarat',
  'mentions in this snapshot': 'sebutan dalam gambaran ini',
  'projected index points from recent snapshots.': 'mata indeks unjuran daripada gambaran terkini.',
  'Build my pathway': 'Bina laluan saya',
  'What makes a good plan?': 'Apakah ciri pelan yang baik?',
  'Small, demonstrable progress.': 'Kemajuan kecil yang boleh ditunjukkan.',
  'Try each step, save a simple output, and reflect on what you learned. Mark a step complete when it feels right for you, not because you reached a deadline.': 'Cuba setiap langkah, simpan hasil ringkas dan fikirkan perkara yang dipelajari. Tandakan langkah selesai apabila anda bersedia, bukan semata-mata kerana tarikh akhir.',
  'Learning resources are external starting points. Check current availability, cost and suitability. MatchyKan does not endorse a course or promise a job outcome. Your completion progress is saved in this browser only.': 'Sumber pembelajaran ialah titik permulaan luaran. Semak ketersediaan, kos dan kesesuaian semasa. MatchyKan tidak mengendors kursus atau menjanjikan hasil pekerjaan. Kemajuan anda disimpan dalam pelayar ini sahaja.',
  '05 / Careers with purpose': '05 / Kerjaya yang bermakna',
  'Your work. A': 'Kerja anda. Satu',
  'wider impact.': 'impak yang lebih luas.',
  'Explore possible connections between a role and the UN Sustainable Development Goals. Impact depends on the project, context and choices people make.': 'Terokai kemungkinan hubungan antara sesuatu peranan dengan Matlamat Pembangunan Mampan Pertubuhan Bangsa-Bangsa Bersatu. Impak bergantung pada projek, konteks dan pilihan yang dibuat.',
  'SDG context': 'Konteks SDG',
  'Explore a role': 'Terokai peranan',
  'Example role:': 'Contoh peranan:',
  'Choose a possible career match to explore the goals that may relate to its work.': 'Pilih padanan kerjaya yang mungkin untuk meneroka matlamat yang berkaitan dengan tugasnya.',
  'Mapped to this role:': 'Dipetakan kepada peranan ini:',
  'No role-level SDG mapping available yet.': 'Pemetaan SDG pada peringkat peranan belum tersedia.',
  'Put skills in context': 'Letakkan kemahiran dalam konteks',
  'What could the connection look like?': 'Bagaimanakah hubungan itu boleh dilihat?',
  'Data analysis:': 'Analisis data:',
  'make evidence easier to use when deciding where a service or resource can improve.': 'memudahkan penggunaan bukti untuk menentukan cara menambah baik perkhidmatan atau sumber.',
  'Responsible AI literacy:': 'Literasi AI yang bertanggungjawab:',
  'check limitations, keep people involved and consider fairness.': 'menyemak batasan, melibatkan manusia dan mempertimbangkan keadilan.',
  'Problem solving:': 'Penyelesaian masalah:',
  'define a specific need, test a small improvement and learn from the outcome.': 'mentakrif keperluan khusus, menguji penambahbaikan kecil dan belajar daripada hasilnya.',
  'Make impact concrete': 'Jadikan impak lebih nyata',
  'Look for the activity, not just the label.': 'Teliti aktiviti sebenar, bukan label semata-mata.',
  'When you assess an SDG connection, name the work being done, identify a relevant target and cite reliable evidence. Ask who benefits and whether there are trade-offs.': 'Apabila menilai kaitan SDG, nyatakan kerja yang dilakukan, kenal pasti sasaran yang relevan dan sertakan bukti yang boleh dipercayai. Tanyakan siapa yang mendapat manfaat dan sama ada terdapat pertukaran kepentingan.',
  'Explore official UN goals': 'Terokai matlamat rasmi PBB',
  'SDG associations are examples, not impact claims. A career title alone cannot show whether a project contributes to a goal. MatchyKan offers exploration support only, not hiring decisions or job guarantees.': 'Hubungan SDG ialah contoh, bukan dakwaan impak. Tajuk kerjaya sahaja tidak menunjukkan sama ada sesuatu projek menyumbang kepada matlamat. MatchyKan hanya menyokong penerokaan, bukan keputusan pengambilan pekerja atau jaminan pekerjaan.',
  'Page not found': 'Halaman tidak ditemui',
  'That path is not on this map.': 'Laluan itu tiada dalam peta ini.',
  'Choose a MatchyKan section to continue exploring.': 'Pilih bahagian MatchyKan untuk meneruskan penerokaan.',
  'Return home': 'Kembali ke halaman utama',
  'Student career exploration ·': 'Penerokaan kerjaya pelajar ·',
  'AI supports your choices. You remain in control.': 'AI menyokong pilihan anda. Anda tetap mengawal keputusan.',
  'Refreshing public signals…': 'Sedang memuat semula isyarat awam…',
  'Clean energy': 'Tenaga bersih',
  'Quality education': 'Pendidikan berkualiti',
  'Decent work': 'Pekerjaan yang baik',
  'Industry & innovation': 'Industri dan inovasi',
  'Reduced inequalities': 'Mengurangkan ketidaksamaan',
  'Climate action': 'Tindakan iklim',
  'Support access to inclusive learning and lifelong skills.': 'Menyokong akses kepada pembelajaran inklusif dan kemahiran sepanjang hayat.',
  'Support access to affordable, reliable and cleaner energy.': 'Menyokong akses kepada tenaga yang mampu milik, boleh dipercayai dan lebih bersih.',
  'Contribute to productive work and more inclusive livelihoods.': 'Menyumbang kepada pekerjaan produktif dan mata pencarian yang lebih inklusif.',
  'Help build resilient infrastructure and responsible innovation.': 'Membantu membina infrastruktur berdaya tahan dan inovasi bertanggungjawab.',
  'Consider who benefits and who may be left out.': 'Pertimbangkan siapa yang mendapat manfaat dan siapa yang mungkin terpinggir.',
  'Apply skills to climate evidence, resilience or mitigation.': 'Gunakan kemahiran untuk bukti iklim, daya tahan atau mitigasi.',
};

function translateText(text: string, language: 'en' | 'bm'): string {
  if (language !== 'bm') return text;
  const clean = text.trim();
  if (!clean) return text;
  const translated = bmCopy[clean];
  if (!translated) {
    if (clean.startsWith('Snapshot updated ')) {
      return text.replace('Snapshot updated', 'Gambaran dikemas kini pada');
    }
    const progress = clean.match(/^(\d+) of (\d+) steps complete$/);
    if (progress) return `${progress[1]} daripada ${progress[2]} langkah selesai`;
    const stepCount = clean.match(/^(\d+) of (\d+) steps completed$/);
    if (stepCount) return `${stepCount[1]} daripada ${stepCount[2]} langkah selesai`;
    const indexMentions = clean.match(/^Index (\d+) · (\d+) mentions$/);
    if (indexMentions) return `Indeks ${indexMentions[1]} · ${indexMentions[2]} sebutan`;
    const signalIndex = clean.match(/^Signal index (\d+)\/100 · (\d+) mentions in this snapshot$/);
    if (signalIndex) return `Indeks isyarat ${signalIndex[1]}/100 · ${signalIndex[2]} sebutan dalam gambaran ini`;
    const mappedSkillSignal = clean.match(/^(\d+)\/100 · (\d+) mentions$/);
    if (mappedSkillSignal) return `${mappedSkillSignal[1]}/100 · ${mappedSkillSignal[2]} sebutan`;
    const mappedSkillMatches = clean.match(/^(\d+)\/100 · (\d+) keyword matches$/);
    if (mappedSkillMatches) return `${mappedSkillMatches[1]}/100 · ${mappedSkillMatches[2]} padanan kata kunci`;
    const keywordMatches = clean.match(/^(\d+) keyword matches$/);
    if (keywordMatches) return `${keywordMatches[1]} padanan kata kunci`;
    const keywordDelta = clean.match(/^([+-]?\d+) keyword matches vs\. previous snapshot$/);
    if (keywordDelta) return `${keywordDelta[1]} padanan kata kunci berbanding gambaran sebelumnya`;
    const snapshotsCount = clean.match(/^(\d+)\/6 snapshots$/);
    if (snapshotsCount) return `${snapshotsCount[1]}/6 gambaran`;
    const signalMentions = clean.match(/^([+-]?\d+) mentions vs\. previous snapshot$/);
    if (signalMentions) return `${signalMentions[1]} sebutan berbanding gambaran sebelumnya`;
    const mentionCount = clean.match(/^(\d+) mentions$/);
    if (mentionCount) return `${mentionCount[1]} sebutan`;
    const profileSkillCount = clean.match(/^Your profile currently includes (\d+) skills?\. MatchyKan uses overlap as a conversation starter, not a hiring score\.$/);
    if (profileSkillCount) return `Profil anda kini merangkumi ${profileSkillCount[1]} kemahiran. MatchyKan menggunakan pertindihan sebagai permulaan perbualan, bukan skor pengambilan pekerja.`;
    const forecastPoints = clean.match(/^([+-]?\d+) projected index points from recent snapshots\.$/);
    if (forecastPoints) return `${forecastPoints[1]} mata indeks yang diunjurkan daripada gambaran terkini.`;
    const completionLabel = clean.match(/^Mark (complete|incomplete): (.+)$/);
    if (completionLabel) return `${completionLabel[1] === 'complete' ? 'Tandakan selesai' : 'Tandakan belum selesai'}: ${completionLabel[2]}`;
    const exampleRole = clean.match(/^Example role: (.+)$/);
    if (exampleRole) return `Contoh peranan: ${exampleRole[1]}`;
    const duration = clean.match(/^(\d+) weeks?$/);
    if (duration) return `${duration[1]} minggu`;
    const totalHours = clean.match(/^About (\d+) learning hours in total\.(.*)$/);
    if (totalHours) return `Kira-kira ${totalHours[1]} jam pembelajaran keseluruhan.${totalHours[2] ? ` ${translateText(totalHours[2].trim(), language)}` : ''}`;
    const hoursAndDuration = clean.match(/^(.+) · (\d+)h$/);
    if (hoursAndDuration) return `${translateText(hoursAndDuration[1], language)} · ${hoursAndDuration[2]}j`;
    return text;
  }
  const start = text.match(/^\s*/)?.[0] ?? '';
  const end = text.match(/\s*$/)?.[0] ?? '';
  return `${start}${translated}${end}`;
}

function translateNode(node: ReactNode, language: 'en' | 'bm'): ReactNode {
  if (typeof node === 'string') return translateText(node, language);
  if (Array.isArray(node)) return Children.map(node, child => translateNode(child, language));
  if (isValidElement<{ children?: ReactNode; placeholder?: string; title?: string; 'aria-label'?: string }>(node)) {
    const props = node.props;
    if (node.type === PageHeading) {
      const headingProps = props as { eyebrow: string; title: ReactNode; detail: string; badge?: string };
      return cloneElement(node, {
        eyebrow: translateText(headingProps.eyebrow, language),
        title: translateNode(headingProps.title, language),
        detail: translateText(headingProps.detail, language),
        badge: headingProps.badge ? translateText(headingProps.badge, language) : undefined,
      } as never);
    }
    if (node.type === LoadingState) {
      const loadingProps = props as { label?: string };
      return cloneElement(node, { label: loadingProps.label ? translateText(loadingProps.label, language) : undefined, language } as never);
    }
    if (node.type === Notice) {
      return cloneElement(node, { ...props, children: translateNode(props.children, language), language } as never);
    }
    if (node.type === QueryState || node.type === SourceNote) {
      return cloneElement(node, { ...props, language } as never);
    }
    return cloneElement(node, {
      ...(props.placeholder ? { placeholder: translateText(props.placeholder, language) } : {}),
      ...(props.title ? { title: translateText(props.title, language) } : {}),
      ...(props['aria-label'] ? { 'aria-label': translateText(props['aria-label'], language) } : {}),
      children: translateNode(props.children, language),
    });
  }
  return node;
}

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const stored = JSON.parse(raw) as Record<string, unknown>;
    if (key === PROFILE_KEY && stored.scenario === 'rapid') stored.scenario = 'slight';
    return { ...fallback, ...stored } as T;
  } catch {
    return fallback;
  }
}

function scenarioIndex(index: number, scenario: LearnerProfile['scenario']): number {
  if (index <= 0) return 0;
  const uplift = scenario === 'slight'
    ? Math.max(1, Math.round(index * 0.1))
    : Math.max(2, Math.round(index * 0.25));
  return Math.min(100, index + uplift);
}

function directionLabel(direction: string, language: 'en' | 'bm') {
  if (direction === 'baseline') return language === 'en' ? 'CURRENT SNAPSHOT' : 'GAMBARAN SEMASA';
  return direction;
}

function jobSearchLinks(title: string) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(title)}&location=Malaysia`,
    jobstreet: `https://my.jobstreet.com/${slug}-jobs/in-Malaysia`,
  };
}

function Brand() {
  return <span className="mk-brand"><img className="mk-logo" src="/matchykan-logo-mark.png" alt="" aria-hidden="true" /><span>Matchy<em>Kan</em></span></span>;
}

function Pill({ children, type = '' }: { children: ReactNode; type?: string }) {
  return <span className={`mk-pill ${type}`}>{children}</span>;
}

function Header({ path, language, setLanguage }: { path: string; language: 'en' | 'bm'; setLanguage: (v: 'en' | 'bm') => void }) {
  return (
    <header className="mk-top">
      <Link href="/" className="brand-link" aria-label="MatchyKan home"><Brand /></Link>
      <nav className="mk-nav" aria-label="Main navigation">
        {navItems.map(item => (
          <Link key={item.href} href={item.href} className={path === item.href ? 'active' : ''} data-testid={`link-nav-${item.href.replace('/', 'home')}`}>
            {language === 'en' ? item.label : item.bm}
          </Link>
        ))}
      </nav>
      <div className="mk-top-actions">
        <button className="mk-btn secondary" type="button" onClick={() => setLanguage(language === 'en' ? 'bm' : 'en')} data-testid="button-language">
          <Globe2 size={14} /> {language === 'en' ? 'BM' : 'EN'}
        </button>
        <Link href="/profile" className="mk-btn" data-testid="link-get-started">{language === 'en' ? 'Get started' : 'Mula' } <ArrowRight size={14} /></Link>
      </div>
    </header>
  );
}

function PageHeading({ eyebrow, title, detail, badge }: { eyebrow: string; title: ReactNode; detail: string; badge?: string }) {
  return <div className="mk-heading"><div><div className="mk-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{detail}</p></div>{badge && <Pill type="blue">{badge}</Pill>}</div>;
}

function Notice({ children, language = 'en' }: { children: ReactNode; language?: 'en' | 'bm' }) {
  return translateNode(<div className="mk-notice"><strong>Worth knowing: </strong>{children}</div>, language);
}

function LoadingState({ label = 'Loading workforce signals…', language = 'en' }: { label?: string; language?: 'en' | 'bm' }) {
  return translateNode(<div className="mk-card" role="status"><div className="mk-progress-wrap"><span className="mk-spinner" /><span>{label}</span></div><div className="mk-bar"><span style={{ width: '38%' }} /></div><p className="mk-muted">A moment while the latest information is prepared.</p></div>, language);
}

function QueryState({ loading, error, empty, retry, language = 'en' }: { loading: boolean; error: boolean; empty: boolean; retry: () => void; language?: 'en' | 'bm' }) {
  if (loading) return <LoadingState language={language} />;
  if (error) return translateNode(<div className="mk-card" role="alert"><Pill type="warn">Could not load</Pill><h3>Workforce signals are unavailable right now.</h3><p className="mk-muted">Your profile stays in this browser. Try loading the public signals again.</p><button className="mk-btn" type="button" onClick={retry} data-testid="button-retry-dashboard"><RefreshCw size={14} /> Try again</button></div>, language);
  if (empty) return translateNode(<div className="mk-card"><h3>No signals are available yet.</h3><p className="mk-muted">Refresh the feed or return later. We will not fill gaps with invented live statistics.</p><button className="mk-btn" type="button" onClick={retry}>Refresh signals</button></div>, language);
  return null;
}

function SourceNote({ dashboard, language = 'en' }: { dashboard?: WorkforceDashboard; language?: 'en' | 'bm' }) {
  const publicMode = dashboard?.sourceMode === 'public-rss';
  return translateNode(<Notice>{publicMode ? 'This view uses a refreshed public RSS sample.' : 'This is illustrative demo data, not a measured labour-market forecast.'} {dashboard?.capturedAt ? `Snapshot updated ${new Date(dashboard.capturedAt).toLocaleString(language === 'bm' ? 'ms-MY' : 'en-MY')}.` : ''} Signals may be incomplete and reflect the limits of their sources. They are for exploration, not a promise of employment.</Notice>, language);
}

function HomePage({ dashboard, loading, error, retry, language }: { dashboard?: WorkforceDashboard; loading: boolean; error: boolean; retry: () => void; language: 'en' | 'bm' }) {
  const empty = !!dashboard && !dashboard.skills.length && !dashboard.roles.length && !dashboard.evidence.length;
  return translateNode(<>
    <section className="mk-hero">
      <div className="mk-hero-copy mk-reveal">
        <div className="mk-eyebrow">The future of work, made personal</div>
        <h1>Your future.<br /><span>Your match.</span></h1>
        <p>A practical guide from the skills you have today to the roles you could explore next. See why a role may fit, what you might learn, and how your choices connect to a more sustainable future.</p>
        <div className="mk-actions"><Link className="mk-btn" href="/profile" data-testid="link-discover-future">Discover my future <ArrowRight size={15} /></Link><Link className="mk-btn ghost" href="/radar">Explore future skills</Link></div>
        <p style={{ fontSize: 10, marginTop: 16 }}>You choose the direction. Suggestions are not hiring decisions or job guarantees.</p>
      </div>
    </section>
    <section className="mk-feature-rail" aria-label="Explore MatchyKan">
      {[
        { href: '/radar', icon: <TrendingUp size={22} />, title: 'Discover future skills', text: 'Explore signals, evidence and possible changes.' },
        { href: '/matches', icon: <Target size={22} />, title: 'Understand your fit', text: 'Compare skill overlap and areas to build.' },
        { href: '/pathway', icon: <BookOpen size={22} />, title: 'Choose your next steps', text: 'Make a learning plan at your own pace.' },
        { href: '/sdg', icon: <HeartHandshake size={22} />, title: 'Connect to impact', text: 'Explore how work can relate to the SDGs.' },
      ].map(x => <Link key={x.href} href={x.href} className="mk-feature"><div>{x.icon}</div><h3>{x.title}</h3><p>{x.text}</p></Link>)}
    </section>
    <main className="mk-main">
      <section className="mk-section">
        <div className="mk-section-heading"><div><div className="mk-eyebrow">A clear route, at your pace</div><h2>From today's skills to <span>tomorrow's options.</span></h2><p className="mk-muted">Start with what you know. Explore what may be next.</p></div><Link href="/profile" className="mk-btn secondary">Build your profile <ArrowRight size={14} /></Link></div>
        <div className="mk-grid3">
          {[
            ['01 · Discover', 'Understand your starting point', 'Share skills, experience and interests. A CV is optional; you can also enter skills yourself.', '/profile', 'Build profile'],
            ['02 · Explore', 'Compare possible futures', 'Read the signals and their evidence. Change scenarios to explore different assumptions.', '/radar', 'View radar'],
            ['03 · Prepare', 'Make a practical plan', 'Compare possible roles, identify learning gaps and follow steps you choose.', '/matches', 'Find matches'],
          ].map(([pill, title, text, href, cta]) => <article key={pill} className="mk-card"><Pill>{pill}</Pill><h3>{title}</h3><p className="mk-muted">{text}</p><Link href={href} className="mk-btn secondary">{cta} <ArrowRight size={13} /></Link></article>)}
        </div>
      </section>
      <section className="mk-section">
        <div className="mk-section-heading"><div><div className="mk-eyebrow">Malaysia workforce overview</div><h2>Signals to <span>explore.</span></h2></div><Link href="/radar" className="mk-btn secondary">Open skills radar <ArrowRight size={14} /></Link></div>
        {loading || error || empty ? <QueryState loading={loading} error={error} empty={empty} retry={retry} language={language} /> : dashboard && <>
          <div className="mk-grid4">
            {dashboard.skills.slice(0, 4).map((skill, i) => <div className="mk-card" key={skill.name} data-testid={`signal-skill-${i}`}><div className="mk-data-row"><Pill type={skill.direction === 'declining' ? 'warn' : ''}>{directionLabel(skill.direction, language)}</Pill><span className="mk-muted">{skill.mentions} keyword matches</span></div><h3>{skill.name}</h3><div className="mk-big">{skill.index}<small style={{ fontSize: 12, marginLeft: 5 }}>/100 signal index</small></div><div className="mk-bar"><span style={{ width: `${Math.min(100, Math.abs(skill.index))}%` }} /></div><small className="mk-muted">{skill.direction === 'baseline' ? 'Current snapshot; direction needs another snapshot' : `${skill.change > 0 ? '+' : ''}${skill.change} keyword matches vs. previous snapshot`}</small></div>)}
          </div>
          <SourceNote dashboard={dashboard} language={language} />
        </>}
      </section>
      <section className="mk-section mk-grid2">
        <article className="mk-card"><div className="mk-eyebrow">A guide, not a verdict</div><h3>Keep your choices yours.</h3><p className="mk-muted">MatchyKan helps you explore options and prepare questions. A score is an estimate of skill overlap, not a measure of your worth, employability or future outcome.</p><Link href="/matches" className="mk-btn secondary">See how matches work <ArrowRight size={13} /></Link></article>
        <article className="mk-card"><div className="mk-eyebrow">Small steps count</div><h3>Start where you are.</h3><p className="mk-muted">Your profile and learning progress are saved in this browser. You can change your interests, remove skills or take a different direction whenever you like.</p><Link href="/profile" className="mk-btn">Set up your profile <ArrowRight size={13} /></Link></article>
      </section>
    </main>
  </>, language);
}

function ProfilePage({ profile, setProfile, onMatch, matchPending, matchError, language, extractSkills, extractPending, extractError, recognizedSkills, reviewSkillsMessage, clearRecognizedSkills }: {
  profile: LearnerProfile; setProfile: (p: LearnerProfile) => void; onMatch: (next: LearnerProfile) => void; matchPending: boolean; matchError: string; language: 'en' | 'bm'; extractSkills: (file: File) => void; extractPending: boolean; extractError: string; recognizedSkills: string[]; reviewSkillsMessage: string; clearRecognizedSkills: () => void;
}) {
  const [skillText, setSkillText] = useState(profile.skills.join(', '));
  const [consent, setConsent] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (recognizedSkills.length) {
      setFile(null);
      setConsent(false);
      const input = document.getElementById('cv-file') as HTMLInputElement | null;
      if (input) input.value = '';
    }
  }, [recognizedSkills]);
  const sdgs = [
    { id: 4, title: 'Quality education' }, { id: 7, title: 'Clean energy' }, { id: 8, title: 'Decent work' },
    { id: 9, title: 'Industry & innovation' }, { id: 10, title: 'Reduced inequalities' }, { id: 13, title: 'Climate action' },
  ];
  const toggleSdg = (id: number) => setProfile({ ...profile, sdgs: profile.sdgs.includes(id) ? profile.sdgs.filter(x => x !== id) : [...profile.sdgs, id] });
  const save = () => {
    setProfile({ ...profile, skills: skillText.split(',').map(s => s.trim()).filter(Boolean) });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 3500);
  };
  const toggleSkill = (skill: string) => {
    const current = skillText.split(',').map(s => s.trim()).filter(Boolean);
    const selectedSkill = current.some(s => s.toLowerCase() === skill.toLowerCase());
    const next = selectedSkill
      ? current.filter(s => s.toLowerCase() !== skill.toLowerCase())
      : [...current, skill];
    setSkillText(next.join(', '));
    setProfile({ ...profile, skills: next });
  };
  const addReviewed = () => {
    const merged = Array.from(new Set([...profile.skills, ...selected]));
    setProfile({ ...profile, skills: merged });
    setSkillText(merged.join(', '));
    clearRecognizedSkills();
    setSelected([]);
  };
  const submitCv = () => {
    if (!file || !consent) return;
    extractSkills(file);
  };
  return translateNode(<main className="mk-main">
    <PageHeading eyebrow="01 / Your starting point" title={<>Tell us about <span>you.</span></>} detail="A few details help us explain possible role matches. Share only what feels useful." badge="Optional profile" />
    <div className="mk-grid2">
      <section className="mk-card">
        <div className="mk-eyebrow">Your profile</div>
        <div className="mk-grid2">
          <div className="mk-field"><label htmlFor="profile-name">{language === 'en' ? 'Name (optional)' : 'Nama (pilihan)'}</label><input id="profile-name" value={profile.name ?? ''} onChange={e => setProfile({ ...profile, name: e.target.value })} placeholder="How should we address you?" data-testid="input-profile-name" /></div>
          <div className="mk-field"><label htmlFor="profile-stage">{language === 'en' ? 'Current stage' : 'Peringkat semasa'}</label><select id="profile-stage" value={profile.experience ?? ''} onChange={e => setProfile({ ...profile, experience: e.target.value })} data-testid="select-profile-stage"><option value="">Choose a stage</option><option>Final-year student</option><option>Fresh graduate</option><option>Early-career professional</option><option>TVET learner</option><option>Career explorer</option></select></div>
        </div>
        <div className="mk-field"><label htmlFor="profile-interest">Areas you are curious about</label><select id="profile-interest" value={profile.interests ?? ''} onChange={e => setProfile({ ...profile, interests: e.target.value })} data-testid="select-interest"><option>AI & Data</option><option>Engineering & Automation</option><option>Sustainability & Clean Energy</option><option>Cybersecurity</option><option>Digital Product & UX</option><option>Still exploring</option></select></div>
        <div className="mk-field"><label>{language === 'en' ? 'Choose skills you already use' : 'Pilih kemahiran yang anda gunakan'}</label><div className="mk-chips">{profileSkillChoices.map(skill => { const active = skillText.split(',').some(s => s.trim().toLowerCase() === skill.toLowerCase()); return <button key={skill} type="button" className={`mk-chip ${active ? 'active' : ''}`} aria-pressed={active} onClick={() => toggleSkill(skill)} data-testid={`toggle-skill-${skill.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>{skill}</button>; })}</div><small>{language === 'en' ? 'Choose from the role skill catalogue, or add other skills below.' : 'Pilih daripada katalog kemahiran peranan atau tambah kemahiran lain di bawah.'}</small></div>
        <div className="mk-field"><label htmlFor="profile-skills">{language === 'en' ? 'Other skills you use' : 'Kemahiran lain yang anda gunakan'}</label><textarea id="profile-skills" rows={3} value={skillText} onChange={e => setSkillText(e.target.value)} placeholder="For example: Data Analytics, Communication Skills" data-testid="input-profile-skills" /><small>Separate skills with commas. Include coursework, projects, volunteering or work experience.</small></div>
        <div className="mk-field"><label htmlFor="profile-experience">Projects or experience (optional)</label><textarea id="profile-experience" rows={3} value={profile.experience && !['Final-year student','Fresh graduate','Early-career professional','TVET learner','Career explorer'].includes(profile.experience) ? profile.experience : ''} onChange={e => setProfile({ ...profile, experience: e.target.value })} placeholder="A class project, internship, club activity…" data-testid="input-experience" /></div>
        <div className="mk-grid2">
          <div className="mk-field"><label htmlFor="scenario">Future scenario</label><select id="scenario" value={profile.scenario} onChange={e => setProfile({ ...profile, scenario: e.target.value as LearnerProfile['scenario'] })} data-testid="select-scenario"><option value="slight">Slight change</option><option value="moderate">Moderate change</option></select><small>Scenario assumptions are exploratory, not predictions.</small></div>
          <div className="mk-field"><label htmlFor="weekly-hours">Learning time / week</label><select id="weekly-hours" defaultValue="4" data-testid="select-hours"><option value="2">2 hours</option><option value="4">4 hours</option><option value="6">6 hours</option><option value="10">10 hours</option></select></div>
        </div>
        <div className="mk-field"><label>Goals you care about</label><div className="mk-chips">{sdgs.map(s => <button type="button" key={s.id} onClick={() => toggleSdg(s.id)} className={`mk-chip ${profile.sdgs.includes(s.id) ? 'active' : ''}`} aria-pressed={profile.sdgs.includes(s.id)} data-testid={`toggle-sdg-${s.id}`} style={profile.sdgs.includes(s.id) ? { background: '#e7f5ee', color: '#258360', fontWeight: 700 } : {}}>{s.id} · {s.title}</button>)}</div></div>
        <div className="mk-actions"><button className="mk-btn" type="button" onClick={save} data-testid="button-save-profile"><Check size={15} /> {saved ? 'Saved in this browser' : 'Save profile'}</button><button className="mk-btn secondary" type="button" onClick={() => onMatch({ ...profile, skills: skillText.split(',').map(s => s.trim()).filter(Boolean) })} disabled={matchPending} data-testid="button-find-matches">{matchPending ? <LoaderCircle size={15} className="mk-spinner" /> : <Target size={15} />} Find possible matches <ArrowRight size={14} /></button></div>
        {matchError && <p role="alert" className="mk-notice">{matchError}</p>}
      </section>
      <div>
        <section className="mk-card">
          <div className="mk-eyebrow">Optional CV skill extraction</div><h3>Review skills from a document.</h3>
          <p className="mk-muted">You can skip this and type skills yourself. A CV is only sent for skill extraction after you choose a file and give consent.</p>
          <div className="mk-field"><label htmlFor="cv-file">Choose PDF, DOCX or TXT</label><input id="cv-file" type="file" accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={e => { const next = e.target.files?.[0] ?? null; setFile(next); clearRecognizedSkills(); }} data-testid="input-cv-file" /><small>Maximum file size: 5 MB. No other file types are accepted.</small></div>
          {file && <p className="mk-muted"><FileText size={14} style={{ verticalAlign: 'middle' }} /> {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
          <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', margin: '14px 0', fontSize: 11, lineHeight: 1.6 }}>
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} data-testid="checkbox-cv-consent" />
            <span>I consent to sending text extracted from this CV to Runpod’s Qwen3-8B model for skill extraction. MatchyKan does not store the file or extracted text; Runpod processes the text under its own policies.</span>
          </label>
          <button className="mk-btn secondary" type="button" disabled={!file || !consent || extractPending || file.size > 5 * 1024 * 1024 || !/\.(pdf|docx|txt)$/i.test(file.name)} onClick={submitCv} data-testid="button-extract-skills">
            {extractPending ? <LoaderCircle size={15} className="mk-spinner" /> : <Upload size={15} />} {extractPending ? 'Reviewing document…' : 'Recognise skills'}
          </button>
          {file && (file.size > 5 * 1024 * 1024 || !/\.(pdf|docx|txt)$/i.test(file.name)) && <p className="mk-notice">Please select a PDF, DOCX or TXT file no larger than 5 MB.</p>}
          {extractError && <p role="alert" className="mk-notice">{extractError}</p>}
          {recognizedSkills.length > 0 && <div className="mk-section"><h3>Review before adding</h3><p className="mk-muted">Select only the skills that describe you. {reviewSkillsMessage}</p><div className="mk-chips">{recognizedSkills.map(skill => <button key={skill} className="mk-chip" type="button" aria-pressed={selected.includes(skill)} onClick={() => setSelected(selected.includes(skill) ? selected.filter(x => x !== skill) : [...selected, skill])} style={selected.includes(skill) ? { background: '#e7f5ee', color: '#258360', fontWeight: 700 } : {}}>{selected.includes(skill) ? 'Selected: ' : ''}{skill}</button>)}</div><div className="mk-actions"><button className="mk-btn" type="button" onClick={addReviewed} disabled={!selected.length}>Add selected skills</button><button className="mk-btn secondary" type="button" onClick={() => setSelected([])}>Clear selection</button></div></div>}
        </section>
          <Notice>After you consent, extracted CV text (not the original file) is sent to Runpod’s Qwen3-8B model for skill suggestions. MatchyKan does not store the file or extracted text. Review every suggestion; you decide what enters your profile. You can also add skills manually.</Notice>
      </div>
    </div>
  </main>, language);
}

function RadarPage({ dashboard, loading, error, retry, profile, language }: { dashboard?: WorkforceDashboard; loading: boolean; error: boolean; retry: () => void; profile: LearnerProfile; language: 'en' | 'bm' }) {
  const [scenario, setScenario] = useState<LearnerProfile['scenario']>(profile.scenario);
  const empty = !!dashboard && !dashboard.skills.length && !dashboard.forecasts.length && !dashboard.evidence.length;
  const skills = dashboard?.skills ?? [];
  const scenarioRate = scenario === 'slight' ? 10 : 25;
  const minimumUplift = scenario === 'slight' ? 1 : 2;
  const scenarioTitle = scenario === 'slight' ? 'Slight change scenario (+10%)' : 'Moderate change scenario (+25%)';
  const feedSource = dashboard?.sourceMode === 'public-rss' ? 'Public Google News RSS' : 'Illustrative demo feed';
  return translateNode(<main className="mk-main">
    <PageHeading eyebrow="02 / Signals to watch" title={<>Future skills <span>radar.</span></>} detail="Explore workforce signals and their supporting evidence. Scenario views help you ask “what if”, not tell you what will happen." badge="Scenario view" />
    <div className="mk-tabs" role="tablist" aria-label="Scenario">
      <button className={scenario === 'slight' ? 'active' : ''} type="button" role="tab" aria-selected={scenario === 'slight'} onClick={() => setScenario('slight')} data-testid="tab-slight">Slight change</button>
      <button className={scenario === 'moderate' ? 'active' : ''} type="button" role="tab" aria-selected={scenario === 'moderate'} onClick={() => setScenario('moderate')} data-testid="tab-moderate">Moderate change</button>
    </div>
    {loading || error || empty ? <QueryState loading={loading} error={error} empty={empty} retry={retry} language={language} /> : dashboard && <>
      <section className="mk-card mk-section" data-testid="scenario-assumptions">
        <div className="mk-grid2">
          <div>
            <div className="mk-eyebrow">Scenario assumptions</div>
            <h3>{scenarioTitle}</h3>
            <p className="mk-muted">{language === 'en'
              ? `Applies a hypothetical ${scenarioRate}% uplift to each non-zero current index (minimum +${minimumUplift} point, capped at 100). It changes only the displayed scenario index—not keyword-match counts, source evidence, or measured history.`
              : `Menggunakan peningkatan andaian sebanyak ${scenarioRate}% pada setiap indeks semasa yang bukan sifar (minimum +${minimumUplift} mata, maksimum 100). Ia hanya mengubah indeks senario yang dipaparkan—bukan kiraan padanan kata kunci, bukti sumber atau sejarah yang diukur.`}</p>
            <p className="mk-muted">{dashboard.snapshotCount < 2
              ? language === 'en'
                ? 'One saved snapshot is available; historical direction is not measurable yet. Refresh again later to compare another snapshot.'
                : 'Satu gambaran telah disimpan; arah sejarah belum dapat diukur. Muat semula kemudian untuk membandingkan gambaran lain.'
              : language === 'en'
                ? `${dashboard.snapshotCount} snapshots are saved. Historical direction comes from the collected history.`
                : `${dashboard.snapshotCount} gambaran disimpan. Arah sejarah berdasarkan rekod yang dikumpulkan.`}</p>
          </div>
          <div>
            <div className="mk-grid3">
              <div className="mk-card" style={{ padding: 14 }}><small className="mk-muted">Evidence items</small><div className="mk-big">{dashboard.evidence.length}</div></div>
              <div className="mk-card" style={{ padding: 14 }}><small className="mk-muted">Saved snapshots</small><div className="mk-big">{dashboard.snapshotCount}<small style={{ fontSize: 12 }}>/6</small></div></div>
              <div className="mk-card" style={{ padding: 14 }}><small className="mk-muted">Skills tracked</small><div className="mk-big">{skills.length}</div></div>
            </div>
            <p className="mk-muted" style={{ marginTop: 12 }}><span>Source</span>: <strong>{feedSource}</strong></p>
          </div>
        </div>
      </section>
      <section className="mk-section">
        <div className="mk-section-heading"><div><div className="mk-eyebrow">Observed source data</div><h2>Skills in the <span>latest feed.</span></h2><p className="mk-muted">{language === 'en' ? 'The latest sample collects up to four Google News articles per tracked skill. The index is normalized to the most-mentioned skill; counts are keyword matches in article titles and summaries, not job-vacancy totals. The scenario index is a separate what-if adjustment, not a prediction.' : 'Sampel terkini mengumpulkan sehingga empat artikel Google News bagi setiap kemahiran. Indeks dinormalisasi kepada kemahiran yang paling banyak disebut; kiraan ialah padanan kata kunci dalam tajuk dan ringkasan artikel, bukan jumlah kekosongan kerja. Indeks senario ialah pelarasan andaian, bukan ramalan.'}</p></div></div>
        <div className="mk-grid2">{skills.map((skill, i) => {
          const adjusted = scenarioIndex(skill.index, scenario);
          const references = skillReferenceSources[skill.name] ?? [];
          const trend = skill.direction === 'baseline'
            ? language === 'en'
              ? 'New collection baseline; direction appears after another refresh.'
              : 'Garis dasar pengumpulan baharu; arah perubahan muncul selepas muat semula seterusnya.'
            : language === 'en'
              ? `${directionLabel(skill.direction, language)} · ${skill.change > 0 ? '+' : ''}${skill.change} keyword matches vs. previous snapshot`
              : `${directionLabel(skill.direction, language)} · ${skill.change > 0 ? '+' : ''}${skill.change} padanan kata kunci berbanding gambaran sebelumnya`;
          return <article className="mk-card" key={skill.name} data-testid={`radar-skill-${i}`}>
            <div className="mk-data-row"><h3>{skill.name}</h3><Pill type={skill.direction === 'declining' ? 'warn' : 'blue'}>{directionLabel(skill.direction, language)}</Pill></div>
            <div className="mk-data-row"><span className="mk-muted">Current signal index</span><strong>{skill.index}/100</strong></div>
            <div className="mk-bar"><span style={{ width: `${skill.index}%`, background: '#c8cdd5' }} /></div>
            <div className="mk-data-row"><span className="mk-muted">{scenario === 'slight' ? 'Slight scenario index' : 'Moderate scenario index'}</span><strong>{adjusted}/100</strong></div>
            <div className="mk-bar"><span style={{ width: `${adjusted}%`, background: '#2d9877' }} /></div>
            <div className="mk-data-row"><small className="mk-muted">Keyword matches in titles and summaries</small><strong>{skill.mentions}</strong></div>
            <small className="mk-muted">{skill.mentions === 0 ? 'No source mentions for this skill in the current sample.' : trend}</small>
            <details className="mk-section" data-testid={`skill-evidence-${i}`}>
              <summary className="mk-linklike">
                {language === 'en'
                  ? skill.evidence.length
                    ? `Supporting articles (${skill.evidence.length})`
                    : `Supporting articles (0) · Related references (${references.length})`
                  : skill.evidence.length
                    ? `Artikel sokongan (${skill.evidence.length})`
                    : `Artikel suapan (0) · Rujukan berkaitan (${references.length})`}
              </summary>
              {skill.evidence.length ? <div className="mk-list">
                {skill.evidence.map((item, evidenceIndex) => <div className="mk-data-row" key={`${item.url}-${evidenceIndex}`}>
                  <span className="mk-muted">{item.title}</span>
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="mk-btn secondary" data-testid={`link-skill-evidence-${i}-${evidenceIndex}`}>
                    {language === 'en' ? 'Open article' : 'Buka artikel'} <ArrowRight size={13} />
                  </a>
                </div>)}
              </div> : <div className="mk-section">
                <p className="mk-muted">{language === 'en'
                  ? 'No matching article in this feed sample, so this skill has no feed mentions in the current index.'
                  : 'Tiada artikel sepadan dalam sampel suapan ini, jadi kemahiran ini tiada sebutan suapan dalam indeks semasa.'}</p>
                {references.length > 0 && <>
                  <div className="mk-eyebrow">{language === 'en' ? 'Related reference sources' : 'Sumber rujukan berkaitan'}</div>
                  <div className="mk-list">
                    {references.map((reference) => <article className="mk-listitem" key={reference.url}>
                      <div style={{ flex: 1 }}>
                        <Pill type="blue">{reference.source}</Pill>
                        <h3>{reference.title}</h3>
                        <p className="mk-muted">{reference.summary}</p>
                        <a href={reference.url} target="_blank" rel="noopener noreferrer" className="mk-btn secondary">
                          {language === 'en' ? 'Open reference' : 'Buka rujukan'} <ArrowRight size={13} />
                        </a>
                      </div>
                    </article>)}
                  </div>
                  <p className="mk-muted">{language === 'en'
                    ? 'These references add context only. They are not counted in the current RSS mentions, signal index, or forecast.'
                    : 'Rujukan ini hanya memberikan konteks. Ia tidak dikira dalam sebutan RSS, indeks isyarat atau ramalan semasa.'}</p>
                </>}
                <a
                  href={`https://news.google.com/search?q=${encodeURIComponent(skill.name)}&hl=en-MY&gl=MY&ceid=MY:en`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mk-btn secondary"
                  data-testid={`link-skill-search-${i}`}
                >
                  {language === 'en' ? `Search articles for ${skill.name}` : `Cari artikel tentang ${skill.name}`} <ArrowRight size={13} />
                </a>
              </div>}
            </details>
          </article>;
        })}</div>
      </section>
      <section className="mk-section">
        <div className="mk-section-heading"><div><div className="mk-eyebrow">A cautious role view</div><h2>Role signals from <span>mapped skills.</span></h2><p className="mk-muted">Role index is the average of the latest indices for its mapped skills. It is not job openings or hiring demand.</p></div></div>
        <div className="mk-grid2">{dashboard.forecasts.map(forecast => {
          const mappedRole = dashboard.roles.find(role => role.id === forecast.roleId);
          const inputs = (mappedRole?.skills ?? []).map(name => skills.find(skill => skill.name === name)).filter((skill): skill is typeof skills[number] => !!skill);
          const adjusted = scenarioIndex(forecast.index, scenario);
          const history = dashboard.snapshotCount < 2
            ? 'One snapshot so far; a historical direction is not available yet.'
            : language === 'en'
              ? `${directionLabel(forecast.direction, language)} · ${forecast.change > 0 ? '+' : ''}${forecast.change} index points from recent snapshots`
              : `${directionLabel(forecast.direction, language)} · ${forecast.change > 0 ? '+' : ''}${forecast.change} mata indeks daripada gambaran terkini`;
          return <article className="mk-card" key={forecast.roleId} data-testid={`forecast-role-${forecast.roleId}`}>
            <div className="mk-data-row"><Pill type={forecast.direction === 'declining' ? 'warn' : 'blue'}>{directionLabel(forecast.direction, language)}</Pill><span className="mk-muted">{dashboard.snapshotCount}/6 snapshots</span></div>
            <h3>{forecast.title}</h3>
            <div className="mk-data-row"><span className="mk-muted">Current role signal index</span><strong>{forecast.index}/100</strong></div>
            <div className="mk-bar"><span style={{ width: `${forecast.index}%`, background: '#c8cdd5' }} /></div>
            <div className="mk-data-row"><span className="mk-muted">{scenario === 'slight' ? 'Slight scenario index' : 'Moderate scenario index'}</span><strong>{adjusted}/100</strong></div>
            <div className="mk-bar"><span style={{ width: `${adjusted}%`, background: '#c8a967' }} /></div>
            <small className="mk-muted">{history}</small>
            <div className="mk-section">
              <strong style={{ fontSize: 11 }}>Skills mapped to this role</strong>
              {inputs.map(skill => <div className="mk-data-row" key={skill.name}><span className="mk-muted">{skill.name}</span><small>{skill.index}/100 · {skill.mentions} keyword matches</small></div>)}
            </div>
          </article>;
        })}</div>
        <Notice>Role signals are mapped from skills in the current feed. Scenario values are assumption-based overlays, not forecasts of vacancies, wages or employment.</Notice>
      </section>
      <div className="mk-section-heading mk-section"><div><div className="mk-eyebrow">Evidence behind this view</div><h2>Read the source, <span>not just the signal.</span></h2><p className="mk-muted">A short feed sample can be incomplete and does not represent the whole Malaysian labour market.</p></div></div>
      {dashboard.evidence.length ? <div className="mk-list">{dashboard.evidence.map((e, i) => <article className="mk-listitem" key={`${e.title}-${i}`}><div className="mk-number"><FileText size={15} /></div><div style={{ flex: 1 }}><Pill type="blue">{e.source}</Pill><h3>{e.title}</h3><p className="mk-muted">{e.summary}</p><div className="mk-data-row"><small className="mk-muted">{e.publishedAt ? new Date(e.publishedAt).toLocaleDateString(language === 'bm' ? 'ms-MY' : 'en-MY') : 'Publication date not supplied'}</small><a href={e.url} target="_blank" rel="noopener noreferrer" className="mk-btn secondary" data-testid={`link-evidence-${i}`}>Open source <ArrowRight size={13} /></a></div></div></article>)}</div> : <div className="mk-card"><h3>No evidence items in this snapshot.</h3><p className="mk-muted">Try refreshing the feed. Forecasts without evidence should be treated especially cautiously.</p></div>}
      <SourceNote dashboard={dashboard} language={language} />
      <div className="mk-actions"><Link href="/matches" className="mk-btn">Explore role matches <ArrowRight size={14} /></Link></div>
    </>}
  </main>, language);
}

function MatchesPage({ matches, pending, error, runMatch, profile, chooseRole, language }: { matches: CareerMatch[]; pending: boolean; error: string; runMatch: () => void; profile: LearnerProfile; chooseRole: (m: CareerMatch) => void; language: 'en' | 'bm' }) {
  return translateNode(<main className="mk-main">
    <PageHeading eyebrow="03 / Your possible next roles" title={<>Career options that <span>may fit.</span></>} detail="Ranked by skill overlap with your profile. Each match explains the overlap and possible areas to develop." badge="Explainable matches" />
    {pending ? <LoadingState label="Comparing your profile with possible roles…" language={language} /> : matches.length ? <>
      <div className="mk-grid3">{matches.map((match, index) => {
        const jobLinks = jobSearchLinks(match.role.title);
        return <article className="mk-card" key={match.role.id} data-testid={`card-match-${match.role.id}`}>
          <div className="mk-data-row"><Pill type={index ? 'blue' : ''}>{index === 0 ? 'Closest skill overlap' : 'Possible option'}</Pill><span className="mk-muted">{match.role.category}</span></div>
          <h3>{match.role.title}</h3>
          <p className="mk-muted">{match.role.summary}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
            <div className="mk-big">{match.score}%</div>
            <div style={{ flex: 1 }}><small className="mk-muted">Estimated skill overlap</small><div className="mk-bar"><span style={{ width: `${Math.min(100, match.score)}%` }} /></div></div>
          </div>
          <p className="mk-muted">{match.explanation}</p>
          <h4 style={{ fontSize: 11 }}>Skills you already bring</h4>
          <div className="mk-chips">{match.matchedSkills.length ? match.matchedSkills.map(s => <span className="mk-chip" key={s}>{s}</span>) : <span className="mk-muted">None identified yet</span>}</div>
          <h4 style={{ fontSize: 11 }}>Possible learning areas</h4>
          <div className="mk-chips">{match.missingSkills.length ? match.missingSkills.map(s => <span className="mk-chip" key={s} style={{ background: '#fff0df', color: '#a56625' }}>{s}</span>) : <Pill>Keep practising</Pill>}</div>
          <p className="mk-muted"><strong>SDG links:</strong> {match.alignedSdgs.map(s => `${s.id} ${s.title}`).join(' · ') || 'No SDG mapping supplied'}</p>
          <small className="mk-muted">{language === 'en' ? 'Search current listings for this role:' : 'Cari iklan kerja semasa untuk peranan ini:'}</small>
          <div className="mk-actions" style={{ marginTop: 10, marginBottom: 12 }}>
            <a className="mk-btn secondary" href={jobLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${language === 'en' ? 'Search LinkedIn jobs for' : 'Cari kerja LinkedIn untuk'} ${match.role.title}`} data-testid={`link-linkedin-jobs-${match.role.id}`}>
              LinkedIn jobs <ExternalLink size={13} />
            </a>
            <a className="mk-btn secondary" href={jobLinks.jobstreet} target="_blank" rel="noopener noreferrer" aria-label={`${language === 'en' ? 'Search JobStreet jobs for' : 'Cari kerja JobStreet untuk'} ${match.role.title}`} data-testid={`link-jobstreet-jobs-${match.role.id}`}>
              JobStreet jobs <ExternalLink size={13} />
            </a>
          </div>
          <button className="mk-btn" type="button" onClick={() => chooseRole(match)} data-testid={`button-pathway-${match.role.id}`}>Plan for this role <ArrowRight size={14} /></button>
        </article>;
      })}</div>
    </> : <div className="mk-card"><div className="mk-eyebrow">Start with your own profile</div><h3>See possible matches based on your skills.</h3><p className="mk-muted">{language === 'bm' ? `Profil anda kini merangkumi ${profile.skills.length} kemahiran. MatchyKan menggunakan pertindihan sebagai permulaan perbualan, bukan skor pengambilan pekerja.` : `Your profile currently includes ${profile.skills.length} skill${profile.skills.length === 1 ? '' : 's'}. MatchyKan uses overlap as a conversation starter, not a hiring score.`}</p><div className="mk-chips">{profile.skills.map(skill => <span className="mk-chip" key={skill}>{skill}</span>)}</div><div className="mk-actions"><Link className="mk-btn secondary" href="/profile">Review profile</Link><button className="mk-btn" type="button" onClick={runMatch} data-testid="button-generate-matches">Explore my matches <ArrowRight size={14} /></button></div></div>}
    {error && <div className="mk-notice" role="alert">{error} <button className="mk-btn secondary" type="button" onClick={runMatch}>Try again</button></div>}
    <Notice>Match scores estimate skill overlap only. They are not validated measures of ability, employability or hiring suitability. Gaps are learning ideas, not judgements. No hiring decisions or job guarantees.</Notice>
    {matches.length > 0 && <div className="mk-actions"><button className="mk-btn secondary" type="button" onClick={runMatch} disabled={pending}><RefreshCw size={14} /> Re-run with profile</button><Link className="mk-btn" href="/sdg">Explore SDG context <ArrowRight size={14} /></Link></div>}
  </main>, language);
}

function PathwayPage({ pathway, profile, dashboard, pending, error, build, roleName, language }: { pathway: LearningPathway | null; profile: LearnerProfile; dashboard?: WorkforceDashboard; pending: boolean; error: string; build: (id: string, hours: number) => void; roleName: string; language: 'en' | 'bm' }) {
  const [hours, setHours] = useState(4);
  const [selectedRoleId, setSelectedRoleId] = useState(
    pathway?.role.id ?? dashboard?.roles[0]?.id ?? '',
  );
  const [progress, setProgress] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); } catch { return {}; }
  });
  useEffect(() => { localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress)); }, [progress]);
  useEffect(() => {
    setSelectedRoleId(pathway?.role.id ?? dashboard?.roles[0]?.id ?? '');
  }, [pathway?.role.id, dashboard?.roles[0]?.id]);
  const selected = dashboard?.roles.find(r => r.id === selectedRoleId)
    ?? dashboard?.roles.find(r => r.title === (pathway?.role.title ?? roleName))
    ?? dashboard?.roles[0];
  const completed = pathway?.steps.filter(step => progress[step.id] ?? step.completed).length ?? 0;
  const percent = pathway?.steps.length ? Math.round(completed / pathway.steps.length * 100) : 0;
  const toggle = (id: string, fallback: boolean) => setProgress({ ...progress, [id]: !(progress[id] ?? fallback) });
  return translateNode(<main className="mk-main">
    <PageHeading eyebrow="04 / Small steps, real progress" title={<>A learning plan, <span>at your pace.</span></>} detail="Choose a role, set realistic weekly time and adapt these suggested steps to your life." badge="Learning plan" />
    {pathway && <>
      <div className="mk-grid2">
        <section className="mk-card"><div className="mk-eyebrow">Your progress</div><div className="mk-progress-wrap"><div className="mk-big">{percent}%</div><span className="mk-muted">{completed} of {pathway.steps.length} steps complete</span></div><div className="mk-bar"><span style={{ width: `${percent}%` }} /></div><p className="mk-muted">About {pathway.totalHours} learning hours in total. The actual pace depends on your starting point and available time.</p></section>
        <section className="mk-card"><h3>{pathway.role.title}</h3><p className="mk-muted">{pathway.role.summary}</p><div className="mk-chips">{pathway.role.skills.map(skill => <span className="mk-chip" key={skill}>{skill}</span>)}</div><p className="mk-muted">Based on your approved profile skills ({profile.skills.length}).</p></section>
      </div>
      <div className="mk-section-heading mk-section"><div><div className="mk-eyebrow">Work through in order</div><h2>One useful step <span>at a time.</span></h2></div></div>
      <div className="mk-list">{pathway.steps.map((step, i) => { const done = progress[step.id] ?? step.completed; return <article className="mk-listitem" key={step.id} data-testid={`path-step-${step.id}`}><button className="mk-number" type="button" aria-label={`${done ? 'Mark incomplete' : 'Mark complete'}: ${step.title}`} aria-pressed={done} onClick={() => toggle(step.id, step.completed)} data-testid={`button-toggle-step-${step.id}`}>{done ? <Check size={15} /> : i + 1}</button><div style={{ flex: 1 }}><Pill>Step {String(i + 1).padStart(2, '0')}</Pill><h3>{step.title}</h3><p className="mk-muted">{step.description}</p><p><strong>Make:</strong> {step.deliverable}</p><a href={step.resourceUrl} target="_blank" rel="noopener noreferrer" className="mk-btn secondary" data-testid={`link-resource-${step.id}`}>Open learning resource <ArrowRight size={13} /></a></div><Pill type="blue">{step.duration} · {step.hours}h</Pill></article>; })}</div>
    </>}
    <section className="mk-grid2 mk-section">
      <section className="mk-card">
        <div className="mk-eyebrow">{pathway ? 'Choose another role path' : 'Build a longer pathway'}</div>
        <h3>{pathway ? 'Build or refresh a role-based plan.' : 'Pick a role to explore.'}</h3>
        <p className="mk-muted">Your approved profile skills are used to focus the plan on areas you have not added yet.</p>
        <div className="mk-field">
          <label htmlFor="path-role">Possible role</label>
          <select id="path-role" value={selected?.id ?? ''} onChange={event => setSelectedRoleId(event.target.value)} data-testid="select-path-role">
            {dashboard?.roles.map(role => <option value={role.id} key={role.id}>{role.title}</option>)}
          </select>
        </div>
        <div className="mk-field">
          <label htmlFor="path-hours">Hours available per week: {hours}</label>
          <input id="path-hours" type="range" min="1" max="20" value={hours} onChange={event => setHours(Number(event.target.value))} data-testid="input-path-hours" />
        </div>
        <button className="mk-btn" type="button" disabled={pending || !selected} onClick={() => selected && build(selected.id, hours)} data-testid="button-build-pathway">
          {pending ? <LoaderCircle size={15} className="mk-spinner" /> : <Sparkles size={15} />}
          {pathway ? selected?.id === pathway.role.id ? 'Refresh this pathway' : 'Build another pathway' : 'Build my pathway'} <ArrowRight size={14} />
        </button>
        {error && <p role="alert" className="mk-notice">{error}</p>}
      </section>
      <section className="mk-card">
        <div className="mk-eyebrow">Based on your approved profile skills</div>
        <h3>Each skill gap becomes a fuller route.</h3>
        <p className="mk-muted">Each skill gap becomes a foundation, practice and project step, followed by a role-focused portfolio project. You can upload a PDF, DOCX or TXT CV on your profile page and review suggested skills. The CV itself is not sent to the pathway builder.</p>
        <div className="mk-chips">{profile.skills.slice(0, 5).map(skill => <span className="mk-chip" key={skill}>{skill}</span>)}</div>
        <div className="mk-actions">
          <Link className="mk-btn secondary" href="/profile">Upload or review your profile <ArrowRight size={13} /></Link>
          <Link className="mk-btn secondary" href="/matches">Explore career matches</Link>
        </div>
      </section>
    </section>
    {pathway && error && <p className="mk-notice" role="alert">{error}</p>}
    <Notice>Learning resources are external starting points. Check current availability, cost and suitability. MatchyKan does not endorse a course or promise a job outcome. Your completion progress is saved in this browser only.</Notice>
  </main>, language);
}

const sdgInfo = [
  { id: 4, name: 'Quality education', text: 'Expand access to inclusive learning and lifelong skills.', color: 'mk-sdg-4' },
  { id: 7, name: 'Clean energy', text: 'Support access to affordable, reliable and cleaner energy.', color: 'mk-sdg-7' },
  { id: 8, name: 'Decent work', text: 'Contribute to productive work and more inclusive livelihoods.', color: 'mk-sdg-8' },
  { id: 9, name: 'Industry & innovation', text: 'Help build resilient infrastructure and responsible innovation.', color: 'mk-sdg-9' },
  { id: 10, name: 'Reduced inequalities', text: 'Consider who benefits and who may be left out.', color: 'mk-sdg-10' },
  { id: 13, name: 'Climate action', text: 'Apply skills to climate evidence, resilience or mitigation.', color: 'mk-sdg-13' },
];

function SdgPage({ dashboard, matches, language }: { dashboard?: WorkforceDashboard; matches: CareerMatch[]; language: 'en' | 'bm' }) {
  const roles = dashboard?.roles ?? [];
  const [roleId, setRoleId] = useState(matches[0]?.role.id ?? roles[0]?.id ?? '');
  const role = roles.find(r => r.id === roleId) ?? matches.find(m => m.role.id === roleId)?.role ?? matches[0]?.role ?? roles[0];
  const ids = role?.sdgs.map(s => s.id) ?? [];
  return translateNode(<main className="mk-main">
    <PageHeading eyebrow="05 / Careers with purpose" title={<>Your work. A <span>wider impact.</span></>} detail="Explore possible connections between a role and the UN Sustainable Development Goals. Impact depends on the project, context and choices people make." badge="SDG context" />
    <section className="mk-card">
      <div className="mk-field" style={{ maxWidth: 430 }}><label htmlFor="sdg-role">Explore a role</label><select id="sdg-role" value={role?.id ?? ''} onChange={e => setRoleId(e.target.value)} data-testid="select-sdg-role">{roles.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></div>
      <h3>{role ? `Example role: ${role.title}` : 'Explore how roles can connect to the SDGs'}</h3>
      <p className="mk-muted">{role?.summary ?? 'Choose a possible career match to explore the goals that may relate to its work.'} Links below are illustrative; a role does not automatically advance a goal.</p>
      <div className="mk-sdgs">{sdgInfo.map(item => <article className={`mk-sdg ${item.color}`} key={item.id} style={{ opacity: ids.length && !ids.includes(item.id) ? .48 : 1, outline: ids.includes(item.id) ? '3px solid #172235' : 'none', outlineOffset: 2 }} data-testid={`sdg-card-${item.id}`}><strong>{item.id}</strong><div><b>{item.name}</b><small>{item.text}</small></div></article>)}</div>
      <p className="mk-muted" style={{ marginTop: 18 }}><strong>Mapped to this role:</strong> {role?.sdgs.map(s => `${s.id} · ${s.title}`).join(' / ') || 'No role-level SDG mapping available yet.'}</p>
    </section>
    <div className="mk-grid2 mk-section">
      <article className="mk-card"><div className="mk-eyebrow">Put skills in context</div><h3>What could the connection look like?</h3><p><strong>Data analysis:</strong> make evidence easier to use when deciding where a service or resource can improve.</p><p><strong>Responsible AI literacy:</strong> check limitations, keep people involved and consider fairness.</p><p><strong>Problem solving:</strong> define a specific need, test a small improvement and learn from the outcome.</p></article>
      <article className="mk-card"><div className="mk-eyebrow">Make impact concrete</div><h3>Look for the activity, not just the label.</h3><p className="mk-muted">When you assess an SDG connection, name the work being done, identify a relevant target and cite reliable evidence. Ask who benefits and whether there are trade-offs.</p><a className="mk-btn secondary" href="https://sdgs.un.org/goals" target="_blank" rel="noopener noreferrer" data-testid="link-un-goals">Explore official UN goals <ArrowRight size={14} /></a></article>
    </div>
    <Notice>SDG associations are examples, not impact claims. A career title alone cannot show whether a project contributes to a goal. MatchyKan offers exploration support only, not hiring decisions or job guarantees.</Notice>
  </main>, language);
}

function NotFoundPage({ language }: { language: 'en' | 'bm' }) {
  return translateNode(<main className="mk-main"><div className="mk-card"><div className="mk-eyebrow">Page not found</div><h1>That path is not on this map.</h1><p className="mk-muted">Choose a MatchyKan section to continue exploring.</p><Link className="mk-btn" href="/">Return home <ArrowRight size={14} /></Link></div></main>, language);
}

function AppShell() {
  const [path, setPath] = useLocation();
  const queryClient = useQueryClient();
  const dashboardQuery = useGetWorkforceDashboard();
  const dashboard = dashboardQuery.data;
  const [language, setLanguage] = useState<'en' | 'bm'>(() => (localStorage.getItem('matchykan-language') as 'en' | 'bm') || 'en');
  const [profile, setProfile] = useState<LearnerProfile>(() => readStorage(PROFILE_KEY, defaultProfile));
  const [matches, setMatches] = useState<CareerMatch[]>([]);
  const [pathway, setPathwayState] = useState<LearningPathway | null>(() => {
    try { return JSON.parse(localStorage.getItem(PATHWAY_KEY) || 'null'); } catch { return null; }
  });
  const [matchError, setMatchError] = useState('');
  const [pathwayError, setPathwayError] = useState('');
  const [extractError, setExtractError] = useState('');
  const refresh = useRefreshWorkforceSignals({
    mutation: {
      onSuccess: data => {
        queryClient.setQueryData(getGetWorkforceDashboardQueryKey(), data);
      },
    },
  });
  const match = useMatchWorkforceRoles({
    mutation: {
      onSuccess: data => { setMatches(data); setMatchError(''); setPath('/matches'); },
      onError: () => setMatchError('We could not prepare matches right now. Please try again.'),
    },
  });
  const build = useBuildWorkforcePathway({
    mutation: {
      onSuccess: data => { setPathwayState(data); localStorage.setItem(PATHWAY_KEY, JSON.stringify(data)); setPathwayError(''); setPath('/pathway'); },
      onError: () => setPathwayError('We could not build a pathway right now. Please try again.'),
    },
  });
  const extract = useExtractProfileSkills({
    mutation: {
      onSuccess: data => { setExtractError(''); setReviewSkills(data.skills); setReviewSkillsMessage(data.note); },
      onError: error => {
        const data = (error as { data?: { error?: unknown } }).data;
        setExtractError(typeof data?.error === 'string'
          ? data.error
          : 'We could not get skill suggestions from Runpod. Please try again or enter skills manually.');
      },
    },
  });
  const [reviewSkills, setReviewSkills] = useState<string[]>([]);
  const [reviewSkillsMessage, setReviewSkillsMessage] = useState('');
  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); }, [profile]);
  useEffect(() => { localStorage.setItem('matchykan-language', language); }, [language]);

  const refreshDashboard = () => refresh.mutate();
  const onMatch = (nextProfile = profile) => {
    setMatchError('');
    setProfile(nextProfile);
    match.mutate({ data: nextProfile });
  };
  const onBuildPathway = (roleId: string, hoursPerWeek: number) => {
    setPathwayError('');
    build.mutate({ data: { roleId, skills: profile.skills, hoursPerWeek } });
  };
  const onExtract = (file: File) => {
    setExtractError('');
    if (file.size > 5 * 1024 * 1024 || !/\.(pdf|docx|txt)$/i.test(file.name)) {
      setExtractError('Please select a PDF, DOCX or TXT file no larger than 5 MB.');
      return;
    }
    extract.mutate({ data: { consent: 'true', cv: file } });
  };
  const chooseRole = (item: CareerMatch) => {
    const hours = Number((document.getElementById('weekly-hours') as HTMLSelectElement | null)?.value ?? 4);
    onBuildPathway(item.role.id, hours);
  };
  const currentTitle = useMemo(() => matches[0]?.role.title ?? '', [matches]);
  const content = path === '/' || path === '/chat' ? <HomePage dashboard={dashboard} loading={dashboardQuery.isLoading || refresh.isPending} error={dashboardQuery.isError} retry={refreshDashboard} language={language} />
     : path === '/profile' ? <ProfilePage profile={profile} setProfile={setProfile} onMatch={onMatch} matchPending={match.isPending} matchError={matchError} language={language} extractSkills={onExtract} extractPending={extract.isPending} extractError={extractError} recognizedSkills={reviewSkills} reviewSkillsMessage={reviewSkillsMessage} clearRecognizedSkills={() => { setReviewSkills([]); setReviewSkillsMessage(''); }} />
    : path === '/radar' ? <RadarPage dashboard={dashboard} loading={dashboardQuery.isLoading} error={dashboardQuery.isError} retry={() => dashboardQuery.refetch()} profile={profile} language={language} />
    : path === '/matches' ? <MatchesPage matches={matches} pending={match.isPending} error={matchError} runMatch={() => onMatch()} profile={profile} chooseRole={chooseRole} language={language} />
    : path === '/pathway' ? <PathwayPage pathway={pathway} profile={profile} dashboard={dashboard} pending={build.isPending} error={pathwayError} build={onBuildPathway} roleName={currentTitle} language={language} />
    : path === '/sdg' ? <SdgPage dashboard={dashboard} matches={matches} language={language} />
    : <NotFoundPage language={language} />;

  return <div className="mk-shell">
    <Header path={path} language={language} setLanguage={setLanguage} />
    {refresh.isPending && <div className="mk-progress-wrap" role="status" style={{ position: 'fixed', top: 77, right: 16, zIndex: 30, background: 'white', padding: '9px 13px', borderRadius: 8, boxShadow: '0 4px 20px #101b3020', fontSize: 11 }}><span className="mk-spinner" /> {language === 'bm' ? 'Sedang memuat semula isyarat awam…' : 'Refreshing public signals…'}</div>}
    {refresh.isError && <div className="mk-main"><p className="mk-notice" role="alert">{language === 'bm' ? 'Suapan berita awam tidak dapat dimuat semula. Gambaran terdahulu masih tersedia.' : 'The public news feed could not be refreshed. Your previous snapshot is still available.'}</p></div>}
    {translateNode(content, language)}
    <footer className="mk-footer"><Brand /><span>{language === 'bm' ? 'Penerokaan kerjaya pelajar · ' : 'Student career exploration · '}{dashboard?.sourceMode === 'public-rss' ? (language === 'bm' ? 'Sampel RSS awam' : 'Public RSS sample') : (language === 'bm' ? 'Isyarat demo' : 'Demo signals')}</span><span>{language === 'bm' ? 'AI menyokong pilihan anda. Anda tetap mengawal keputusan.' : 'AI supports your choices. You remain in control.'}</span></footer>
    <CareerChatPage initialOpen={path === '/chat'} onClose={() => { if (path === '/chat') setPath('/'); }} />
  </div>;
}

function App() {
  return <QueryClientProvider client={queryClient}><AppShell /></QueryClientProvider>;
}

export default App;
