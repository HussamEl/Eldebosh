/**
 * يولّد هياكل الصفحات الـ33 من خريطة الكلمات المفتاحية.
 * كل ملف مسودة (published: false) بعناوين فرعية فقط — بلا أي معلومة عن منتج.
 * يُشغَّل مرة واحدة. لا يستبدل ملفاً موجوداً.
 */
import { writeFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LADD = 'laddning-och-strom';
const HALL = 'hallare-och-ordning';

/* ============ صفحات الحلول ============ */
const solutions = [
  {
    slug: 'mobilen-laddar-langsamt', icon: 'clock', featured: true,
    cat: LADD, sub: 'snabbladdare',
    q: 'Varför laddar mobilen så långsamt?',
    title: 'Mobilen laddar långsamt — så hittar du orsaken',
    desc: 'Laddaren, kabeln eller telefonen kan vara flaskhalsen. Så avgör du vilket av dem som bromsar laddningen hemma hos dig.',
    symptoms: ['Telefonen tar flera timmar på sig att bli full.', 'Laddningen går långsammare än den gjorde förut.', 'Samma telefon laddar snabbare hos någon annan.'],
    outline: ['Tre möjliga flaskhalsar', 'Så testar du vilken det är', 'När det är telefonen och inte tillbehöret'],
  },
  {
    slug: 'ingen-eluttag-pa-resan', icon: 'travel', featured: false,
    cat: LADD, sub: 'powerbanks',
    q: 'Hur laddar jag när det inte finns något eluttag?',
    title: 'Ladda utan eluttag — på tåget, flyget och i tältet',
    desc: 'Långa resdagar utan uttag kräver planering. Så räknar du ut hur mycket reservkraft du faktiskt behöver för din typ av resa.',
    symptoms: ['Du reser långa dagar utan tillgång till uttag.', 'Du vet inte hur stor reservkraft du behöver.', 'Du är osäker på vad som får tas med ombord på flyget.'],
    outline: ['Räkna ut ditt faktiska behov', 'Skillnad på dagsutflykt och flerdagarsresa', 'Regler ombord på flyget'],
  },
  {
    slug: 'mobilen-dor-i-kylan', icon: 'sun', featured: true,
    cat: LADD, sub: 'powerbanks',
    q: 'Varför dör mobilen så fort i kylan?',
    title: 'Mobilen dör i kylan — vad som händer och vad du gör åt det',
    desc: 'Under svenska vintrar tappar batteriet kapacitet långt innan det är tomt. Så skyddar du telefonen under pendling och utomhusdagar.',
    symptoms: ['Telefonen stängs av trots att den visade laddning kvar.', 'Batteriet sjunker snabbt så fort du går ut.', 'Problemet försvinner när telefonen blir varm igen.'],
    outline: ['Vad kyla gör med ett litiumbatteri', 'Så bär du telefonen på vintern', 'När reservkraft är rätt lösning'],
  },
  {
    slug: 'laddkabeln-gar-sonder', icon: 'cable', featured: false,
    cat: LADD, sub: 'kablar',
    q: 'Varför går laddkablarna sönder hela tiden?',
    title: 'Laddkablar som går sönder — orsaker och vad du väljer i stället',
    desc: 'Kablar går sällan sönder av sig själva. Så känner du igen svaga punkter och vad du ska titta efter när du köper nästa kabel.',
    symptoms: ['Kabeln glappar och laddningen bryts.', 'Höljet spricker närmast kontakten.', 'Du köper ny kabel flera gånger om året.'],
    outline: ['Var kablar faktiskt går sönder', 'Vad som skiljer en tålig kabel från en billig', 'Så förlänger du livslängden'],
  },
  {
    slug: 'mobilen-glider-i-bilen', icon: 'car', featured: true,
    cat: HALL, sub: 'bilhallare',
    q: 'Hur får jag mobilen att sitta stilla i bilen?',
    title: 'Mobilen glider omkring i bilen — så väljer du rätt fäste',
    desc: 'Fel fäste släpper på grusväg och i kyla. Så matchar du fästtyp mot bilens instrumentbräda och hur du faktiskt kör.',
    symptoms: ['Telefonen ramlar ner när du svänger.', 'Fästet släpper från rutan när det är kallt.', 'Du tittar ner i knät under körning.'],
    outline: ['Fyra fästtyper och var de sitter', 'Vad som händer i minusgrader', 'Placering som inte skymmer sikten'],
  },
  {
    slug: 'skrivbordet-ar-rorigt', icon: 'desk', featured: true,
    cat: HALL, sub: 'skrivbordsstall',
    q: 'Hur får jag ordning på skrivbordet?',
    title: 'Rörigt skrivbord — ett system som håller sig självt',
    desc: 'Städning som inte håller beror på att sakerna saknar plats. Så bygger du ett upplägg där allt hamnar rätt utan att du tänker på det.',
    symptoms: ['Du städar men röran är tillbaka på några dagar.', 'Sladdar hamnar i en hög bakom bordet.', 'Du letar efter samma saker varje morgon.'],
    outline: ['Varför städning inte räcker', 'Ge varje sak en fast plats', 'Sladdarna sist, inte först'],
  },
];

/* ============ أدلة الشراء ============ */
const guides = [
  { slug: 'basta-powerbank-2026', sol: 'batteriet-tar-slut', cat: LADD, sub: 'powerbanks',
    title: 'Bästa powerbank — så väljer du rätt kapacitet',
    desc: 'Kapacitet, effekt och vikt drar åt olika håll. Så avgör du vilken kombination som passar din vardag i stället för att köpa störst.',
    outline: ['Vad mAh betyder i praktiken', 'Effekt och antal portar', 'Vikt mot antal laddningar'] },
  { slug: 'liten-powerbank-for-fickan', sol: 'batteriet-tar-slut', cat: LADD, sub: 'powerbanks',
    title: 'Liten powerbank för fickan — vad du får och vad du offrar',
    desc: 'En kompakt modell räcker ofta för en arbetsdag. Så vet du när det lilla formatet är rätt och när det blir för snålt.',
    outline: ['Vad en dagsladdning kräver', 'Storlek mot kapacitet', 'När det lilla formatet inte räcker'] },
  { slug: 'powerbank-for-resa', sol: 'ingen-eluttag-pa-resan', cat: LADD, sub: 'powerbanks',
    title: 'Powerbank för resa — kapacitet, vikt och regler ombord',
    desc: 'Resor ställer andra krav än vardagen. Så väljer du kapacitet för flerdagarsresor utan att fastna i säkerhetskontrollen.',
    outline: ['Behov per resdag', 'Vad som gäller i handbagage', 'Ladda flera enheter samtidigt'] },
  { slug: 'magnetisk-powerbank', sol: 'batteriet-tar-slut', cat: LADD, sub: 'powerbanks',
    title: 'Magnetisk powerbank — när trådlöst är värt det',
    desc: 'Magnetfäste tar bort kabeln men kostar effektivitet. Så avgör du om bekvämligheten är värd förlusten i din användning.',
    outline: ['Så fungerar magnetfästet', 'Vad du förlorar mot kabel', 'Kompatibilitet med skal'] },
  { slug: 'basta-snabbladdare-usb-c', sol: 'mobilen-laddar-langsamt', cat: LADD, sub: 'snabbladdare',
    title: 'Bästa snabbladdaren — vilken effekt du faktiskt behöver',
    desc: 'Högre watt ger inte alltid snabbare laddning. Så matchar du laddarens effekt mot vad dina enheter kan ta emot.',
    outline: ['Effekt mot vad telefonen klarar', 'GaN och storlek', 'En laddare för både telefon och dator'] },
  { slug: 'laddare-for-flera-enheter', sol: 'sladdar-overallt', cat: LADD, sub: 'snabbladdare',
    title: 'Laddare för flera enheter — så fördelas effekten',
    desc: 'Multiladdare delar effekten mellan portarna. Så vet du vad som händer när alla portar används samtidigt.',
    outline: ['Hur effekt fördelas mellan portar', 'Räkna på ditt hushålls behov', 'Ett uttag i stället för fyra'] },
  { slug: 'basta-laddkabel-usb-c', sol: 'laddkabeln-gar-sonder', cat: LADD, sub: 'kablar',
    title: 'Bästa USB-C-kabeln — längd, effekt och hållbarhet',
    desc: 'Alla USB-C-kablar klarar inte samma effekt. Så läser du märkningen och undviker kabeln som bromsar laddningen.',
    outline: ['Vad kabeln måste klara', 'Längd mot effektförlust', 'Hållbarhet vid kontakten'] },
  { slug: 'billaddare-usb-c', sol: 'mobilen-laddar-langsamt', cat: LADD, sub: 'billaddning',
    title: 'Billaddare — vad som skiljer en snabb från en långsam',
    desc: 'Cigguttaget sätter gränser som många laddare inte utnyttjar. Så väljer du en billaddare som faktiskt laddar under pendlingen.',
    outline: ['Vad uttaget klarar', 'Effekt för navigation under körning', 'Flera passagerare samtidigt'] },
  { slug: 'mobilhallare-bil', sol: 'mobilen-glider-i-bilen', cat: HALL, sub: 'bilhallare',
    title: 'Mobilhållare för bil — fästtyp efter din bil',
    desc: 'Ventilationsgaller, vindruta eller instrumentbräda löser olika problem. Så väljer du utifrån bilens interiör och ditt körmönster.',
    outline: ['Fyra fästtyper jämförda', 'Vad som håller på svenska vintervägar', 'Placering och sikt'] },
  { slug: 'magnetisk-mobilhallare-bil', sol: 'mobilen-glider-i-bilen', cat: HALL, sub: 'bilhallare',
    title: 'Magnetisk mobilhållare — styrka, skal och trådlös laddning',
    desc: 'Magnetfäste är snabbast att använda men känsligt för skalets tjocklek. Så vet du om din telefon och ditt skal passar.',
    outline: ['Magnetstyrka i praktiken', 'Skal och metallplatta', 'Magnetfäste med laddning'] },
  { slug: 'mobilstall-skrivbord', sol: 'skrivbordet-ar-rorigt', cat: HALL, sub: 'skrivbordsstall',
    title: 'Mobilställ för skrivbordet — höjd, vinkel och stabilitet',
    desc: 'Ett ställ flyttar telefonen från bordsytan till synhöjd. Så väljer du modell efter om du filmar, ringer eller bara vill se aviseringar.',
    outline: ['Höjd för videosamtal', 'Vikbart mot fast', 'Ställ med laddning'] },
  { slug: 'kabelhantering-skrivbord', sol: 'skrivbordet-ar-rorigt', cat: HALL, sub: 'kabelordning',
    title: 'Kabelhantering vid skrivbordet — ordning som håller',
    desc: 'Sladdhögen bakom bordet går att lösa en gång för alla. Så bygger du ett upplägg som överlever att du byter enheter.',
    outline: ['Samla i stället för att gömma', 'Kablar som ska kunna lossas', 'Under bordet, inte bakom'] },
];

/* ============ المقارنات ============ */
const comparisons = [
  { slug: 'usb-c-pd-vs-quick-charge', sol: 'mobilen-laddar-langsamt', cat: LADD, sub: 'snabbladdare',
    title: 'USB-C PD eller Quick Charge — vilken gäller för dig?',
    desc: 'Två snabbladdningsstandarder som inte alltid fungerar ihop. Så vet du vilken din telefon faktiskt använder.',
    outline: ['Vad standarderna gör', 'När de inte fungerar ihop', 'Vad du ska titta efter'] },
  { slug: '10000-vs-20000-mah', sol: 'batteriet-tar-slut', cat: LADD, sub: 'powerbanks',
    title: '10 000 eller 20 000 mAh — vilken storlek passar dig?',
    desc: 'Dubbel kapacitet betyder dubbel vikt. Så avgör du var brytpunkten går för din vardag och dina resor.',
    outline: ['Antal laddningar i praktiken', 'Vikt i fickan mot i väskan', 'Laddtid för själva powerbanken'] },
  { slug: 'gan-laddare-vs-vanlig', sol: 'mobilen-laddar-langsamt', cat: LADD, sub: 'snabbladdare',
    title: 'GaN-laddare eller vanlig laddare — vad är skillnaden?',
    desc: 'GaN gör laddare mindre vid samma effekt. Så avgör du om storleksskillnaden är värd prisskillnaden.',
    outline: ['Vad tekniken ändrar', 'Storlek och värme', 'När det inte spelar roll'] },
  { slug: 'magsafe-vs-qi2-vs-tradlos', sol: 'batteriet-tar-slut', cat: LADD, sub: 'snabbladdare',
    title: 'MagSafe, Qi2 eller vanlig trådlös laddning',
    desc: 'Tre sätt att ladda utan kabel, med olika krav på telefon och skal. Så vet du vilket som fungerar med din utrustning.',
    outline: ['Vad som krävs av telefonen', 'Skalets betydelse', 'Effekt och värme'] },
  { slug: 'magnetfaste-vs-klamfaste', sol: 'mobilen-glider-i-bilen', cat: HALL, sub: 'bilhallare',
    title: 'Magnetfäste eller klämfäste i bilen',
    desc: 'Magnet är snabbast, klämma är säkrast på dålig väg. Så väljer du utifrån hur och var du kör.',
    outline: ['Hastighet mot säkerhet', 'Tjocka skal och tunga telefoner', 'Grusväg och vinter'] },
  { slug: 'ventilationsgaller-vs-vindruta', sol: 'mobilen-glider-i-bilen', cat: HALL, sub: 'bilhallare',
    title: 'Ventilationsgaller, vindruta eller instrumentbräda',
    desc: 'Tre monteringsplatser med olika för- och nackdelar. Så väljer du plats utan att skymma sikten eller blockera värmen.',
    outline: ['Sikt och räckvidd', 'Vad som händer med värmen', 'Vibrationer och stabilitet'] },
  { slug: 'usb-c-vs-lightning', sol: 'laddkabeln-gar-sonder', cat: LADD, sub: 'kablar',
    title: 'USB-C eller Lightning — vad gäller efter EU-beslutet',
    desc: 'Nya enheter går mot en gemensam kontakt medan äldre finns kvar. Så hanterar du ett hushåll med båda sorterna.',
    outline: ['Vad beslutet innebär', 'Övergångsperioden hemma', 'Adaptrar och kompromisser'] },
  { slug: 'tradlos-vs-kabel', sol: 'mobilen-laddar-langsamt', cat: LADD, sub: 'snabbladdare',
    title: 'Trådlös laddning eller kabel — vad är snabbast?',
    desc: 'Trådlöst är bekvämare men förlorar energi som värme. Så avgör du vilket som passar var i hemmet.',
    outline: ['Var energin tar vägen', 'Värme och batterihälsa', 'Rätt metod på rätt plats'] },
];

/* ============ المقالات ============ */
const posts = [
  { slug: 'mah-och-watt-vad-betyder-siffrorna', sol: 'batteriet-tar-slut', cat: LADD,
    title: 'mAh och watt — vad betyder siffrorna egentligen?',
    desc: 'Två tal som mäter helt olika saker och ofta blandas ihop. Så läser du dem rätt nästa gång du jämför laddare.',
    outline: ['Kapacitet mot effekt', 'Varför fler mAh inte laddar snabbare', 'Så jämför du rättvist'] },
  { slug: 'powerbank-pa-flyget', sol: 'ingen-eluttag-pa-resan', cat: LADD,
    title: 'Får man ta med powerbank på flyget?',
    desc: 'Reglerna handlar om energiinnehåll, inte om storlek. Så räknar du om kapaciteten och slipper problem i säkerhetskontrollen.',
    outline: ['Vad reglerna faktiskt mäter', 'Handbagage mot incheckat', 'Kontrollera före avresa'] },
  { slug: 'sa-forlanger-du-batteriets-livslangd', sol: 'batteriet-tar-slut', cat: LADD,
    title: 'Så förlänger du batteriets livslängd',
    desc: 'Ett batteri åldras av värme och ytterlägen, inte av antalet laddningar. Så anpassar du dina vanor efter det.',
    outline: ['Vad som sliter på batteriet', 'Laddvanor som hjälper', 'Myter som inte stämmer'] },
  { slug: 'darfor-laddar-mobilen-samre-pa-vintern', sol: 'mobilen-dor-i-kylan', cat: LADD,
    title: 'Därför fungerar mobilen sämre på vintern',
    desc: 'Kyla sänker batteriets tillgängliga kapacitet tillfälligt. Så skiljer du på tillfällig köldeffekt och verkligt batterislitage.',
    outline: ['Tillfällig effekt eller permanent slitage', 'Så bär du telefonen ute', 'Ladda inte en iskall telefon'] },
  { slug: 'usb-c-standarden-vad-galler-nu', sol: 'laddkabeln-gar-sonder', cat: LADD,
    title: 'USB-C som standard — vad gäller nu?',
    desc: 'Samma kontakt betyder inte samma egenskaper. Så vet du vilka skillnader som finns kvar mellan två kablar som ser likadana ut.',
    outline: ['Samma kontakt, olika kapacitet', 'Effekt och dataöverföring', 'Vad du behöver kontrollera'] },
];

/* ============ الكتابة ============ */
const HEAD = '> ⚠️ UTKAST — strukturen är satt, texten ska skrivas. Publicera inte förrän innehållet är verkligt och granskat.\n';
const body = (o) => `${HEAD}\n${o.map((h) => `## ${h}\n\nSkriv här.\n`).join('\n')}`;
const q = (s) => `"${s.replace(/"/g, '\\"')}"`;

async function write(path, content) {
  try { await access(path); console.log(`  تخطٍ (موجود): ${path.split(/[\\/]/).slice(-2).join('/')}`); return; } catch {}
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
  console.log(`  ✚ ${path.split(/[\\/]/).slice(-2).join('/')}`);
}

const DATE = '2026-01-01';
let n = 0;

for (const s of solutions) {
  const fm = [`---`, `title: ${q(s.title)}`, `description: ${q(s.desc)}`, `lang: sv`, `slug: ${s.slug}`,
    `problem_id: ${s.slug}`, `question: ${q(s.q)}`, `category: ${s.cat}`, `subcategory: ${s.sub}`,
    `icon: ${s.icon}`, `symptoms:`, ...s.symptoms.map((x) => `  - ${q(x)}`),
    `products: []`, `featured: ${s.featured}`, `published: false`, `updated: ${DATE}`, `---`, ''].join('\n');
  await write(join(ROOT, 'src/content/solutions/sv', `${s.slug}.mdx`), fm + body(s.outline)); n++;
}
for (const g of guides) {
  const fm = [`---`, `title: ${q(g.title)}`, `description: ${q(g.desc)}`, `lang: sv`, `slug: ${g.slug}`,
    `solution: ${g.sol}`, `category: ${g.cat}`, `subcategory: ${g.sub}`, `picks: []`,
    `published: false`, `updated: ${DATE}`, `---`, ''].join('\n');
  await write(join(ROOT, 'src/content/guides/sv', `${g.slug}.mdx`), fm + body(g.outline)); n++;
}
for (const c of comparisons) {
  const fm = [`---`, `title: ${q(c.title)}`, `description: ${q(c.desc)}`, `lang: sv`, `slug: ${c.slug}`,
    `solution: ${c.sol}`, `category: ${c.cat}`, `subcategory: ${c.sub}`, `products: []`,
    `verdict: "Skriv slutsatsen här."`, `published: false`, `updated: ${DATE}`, `---`, ''].join('\n');
  await write(join(ROOT, 'src/content/comparisons/sv', `${c.slug}.mdx`), fm + body(c.outline)); n++;
}
for (const a of posts) {
  const fm = [`---`, `title: ${q(a.title)}`, `description: ${q(a.desc)}`, `lang: sv`, `slug: ${a.slug}`,
    `solution: ${a.sol}`, `category: ${a.cat}`, `products: []`,
    `published: false`, `updated: ${DATE}`, `---`, ''].join('\n');
  await write(join(ROOT, 'src/content/posts/sv', `${a.slug}.mdx`), fm + body(a.outline)); n++;
}

console.log(`\nتم توليد ${n} ملفاً (بالإضافة إلى صفحتَي الحل الموجودتين مسبقاً).`);
