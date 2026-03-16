'use strict';

const Parser = require('rss-parser');
const parser = new Parser({ timeout: 10000 });

// ─── RSS Sources ──────────────────────────────────────────────────────────────
const SOURCES = [
  { name: 'BBC',       url: 'https://feeds.bbci.co.uk/news/world/rss.xml',    fallback: { lat: 51.5,  lng: -0.1  }, region: 'Europe'        },
  { name: 'Al Jazeera',url: 'https://www.aljazeera.com/xml/rss/all.xml',      fallback: { lat: 25.3,  lng: 51.5  }, region: 'Middle East'   },
  { name: 'DW',        url: 'https://rss.dw.com/rdf/rss-en-world',            fallback: { lat: 52.5,  lng: 13.4  }, region: 'Europe'        },
  { name: 'NPR',       url: 'https://feeds.npr.org/1004/rss.xml',             fallback: { lat: 38.9,  lng: -77.0 }, region: 'Americas'      },
  { name: 'France 24', url: 'https://www.france24.com/en/rss',                fallback: { lat: 48.9,  lng: 2.3   }, region: 'Europe'        },
  { name: 'Reuters',   url: 'https://feeds.reuters.com/reuters/worldNews',    fallback: { lat: 51.5,  lng: -0.1  }, region: 'Global'        },
];

// ─── Geo Lookup Table ─────────────────────────────────────────────────────────
// Each entry: { names: [...lowercase], lat, lng, country, region }
const GEO_LOOKUP = [
  // Americas
  { names: ['united states','usa','u.s.','u.s.a.','washington','new york','los angeles','chicago','houston','miami','san francisco','new york city','nyc'], lat: 38.9, lng: -77.0, country: 'US', region: 'Americas' },
  { names: ['canada','toronto','ottawa','montreal','vancouver'], lat: 45.4, lng: -75.7, country: 'CA', region: 'Americas' },
  { names: ['mexico','mexico city','guadalajara','monterrey'], lat: 19.4, lng: -99.1, country: 'MX', region: 'Americas' },
  { names: ['brazil','brasília','são paulo','rio de janeiro','rio'], lat: -15.8, lng: -47.9, country: 'BR', region: 'Americas' },
  { names: ['argentina','buenos aires'], lat: -34.6, lng: -58.4, country: 'AR', region: 'Americas' },
  { names: ['colombia','bogotá','bogota','medellin'], lat: 4.7, lng: -74.1, country: 'CO', region: 'Americas' },
  { names: ['chile','santiago'], lat: -33.5, lng: -70.6, country: 'CL', region: 'Americas' },
  { names: ['peru','lima'], lat: -12.0, lng: -77.0, country: 'PE', region: 'Americas' },
  { names: ['venezuela','caracas'], lat: 10.5, lng: -66.9, country: 'VE', region: 'Americas' },
  { names: ['cuba','havana'], lat: 23.1, lng: -82.4, country: 'CU', region: 'Americas' },
  // Europe
  { names: ['united kingdom','uk','britain','england','london','scotland','wales','british'], lat: 51.5, lng: -0.1, country: 'GB', region: 'Europe' },
  { names: ['france','paris','french'], lat: 48.9, lng: 2.3, country: 'FR', region: 'Europe' },
  { names: ['germany','berlin','munich','frankfurt','german','deutschland'], lat: 52.5, lng: 13.4, country: 'DE', region: 'Europe' },
  { names: ['italy','rome','milan','italian'], lat: 41.9, lng: 12.5, country: 'IT', region: 'Europe' },
  { names: ['spain','madrid','barcelona','spanish'], lat: 40.4, lng: -3.7, country: 'ES', region: 'Europe' },
  { names: ['ukraine','kyiv','kiev','kharkiv','ukrainian'], lat: 50.4, lng: 30.5, country: 'UA', region: 'Europe' },
  { names: ['russia','moscow','kremlin','putin','russian','st. petersburg','saint petersburg'], lat: 55.7, lng: 37.6, country: 'RU', region: 'Europe' },
  { names: ['poland','warsaw','polish'], lat: 52.2, lng: 21.0, country: 'PL', region: 'Europe' },
  { names: ['netherlands','amsterdam','dutch','holland'], lat: 52.4, lng: 4.9, country: 'NL', region: 'Europe' },
  { names: ['belgium','brussels','belgian'], lat: 50.8, lng: 4.4, country: 'BE', region: 'Europe' },
  { names: ['sweden','stockholm','swedish'], lat: 59.3, lng: 18.1, country: 'SE', region: 'Europe' },
  { names: ['norway','oslo','norwegian'], lat: 59.9, lng: 10.7, country: 'NO', region: 'Europe' },
  { names: ['denmark','copenhagen','danish'], lat: 55.7, lng: 12.6, country: 'DK', region: 'Europe' },
  { names: ['finland','helsinki','finnish'], lat: 60.2, lng: 25.0, country: 'FI', region: 'Europe' },
  { names: ['switzerland','bern','zurich','swiss'], lat: 46.9, lng: 7.4, country: 'CH', region: 'Europe' },
  { names: ['austria','vienna','austrian'], lat: 48.2, lng: 16.4, country: 'AT', region: 'Europe' },
  { names: ['portugal','lisbon','portuguese'], lat: 38.7, lng: -9.1, country: 'PT', region: 'Europe' },
  { names: ['greece','athens','greek'], lat: 37.9, lng: 23.7, country: 'GR', region: 'Europe' },
  { names: ['hungary','budapest','hungarian'], lat: 47.5, lng: 19.0, country: 'HU', region: 'Europe' },
  { names: ['romania','bucharest','romanian'], lat: 44.4, lng: 26.1, country: 'RO', region: 'Europe' },
  { names: ['serbia','belgrade','serbian'], lat: 44.8, lng: 20.5, country: 'RS', region: 'Europe' },
  { names: ['czech','prague','czechia'], lat: 50.1, lng: 14.4, country: 'CZ', region: 'Europe' },
  { names: ['croatia','zagreb','croatian'], lat: 45.8, lng: 16.0, country: 'HR', region: 'Europe' },
  { names: ['slovakia','bratislava'], lat: 48.1, lng: 17.1, country: 'SK', region: 'Europe' },
  { names: ['belarus','minsk','belarusian'], lat: 53.9, lng: 27.6, country: 'BY', region: 'Europe' },
  { names: ['moldova','chisinau'], lat: 47.0, lng: 28.9, country: 'MD', region: 'Europe' },
  { names: ['nato'], lat: 50.8, lng: 4.4, country: 'BE', region: 'Europe' },
  { names: ['european union','eu'], lat: 50.8, lng: 4.4, country: 'BE', region: 'Europe' },
  // Middle East
  { names: ['israel','tel aviv','jerusalem','israeli'], lat: 31.8, lng: 35.2, country: 'IL', region: 'Middle East' },
  { names: ['palestine','gaza','west bank','hamas','ramallah','palestinian'], lat: 31.5, lng: 34.5, country: 'PS', region: 'Middle East' },
  { names: ['iran','tehran','iranian'], lat: 35.7, lng: 51.4, country: 'IR', region: 'Middle East' },
  { names: ['saudi arabia','riyadh','saudi','jeddah'], lat: 24.7, lng: 46.7, country: 'SA', region: 'Middle East' },
  { names: ['turkey','türkiye','ankara','istanbul','turkish'], lat: 39.9, lng: 32.9, country: 'TR', region: 'Middle East' },
  { names: ['iraq','baghdad','iraqi'], lat: 33.3, lng: 44.4, country: 'IQ', region: 'Middle East' },
  { names: ['syria','damascus','aleppo','syrian'], lat: 33.5, lng: 36.3, country: 'SY', region: 'Middle East' },
  { names: ['lebanon','beirut','lebanese','hezbollah'], lat: 33.9, lng: 35.5, country: 'LB', region: 'Middle East' },
  { names: ['jordan','amman','jordanian'], lat: 31.9, lng: 35.9, country: 'JO', region: 'Middle East' },
  { names: ['yemen','sanaa','yemeni','houthi'], lat: 15.4, lng: 44.2, country: 'YE', region: 'Middle East' },
  { names: ['qatar','doha','qatari'], lat: 25.3, lng: 51.5, country: 'QA', region: 'Middle East' },
  { names: ['uae','dubai','abu dhabi','united arab emirates'], lat: 24.5, lng: 54.4, country: 'AE', region: 'Middle East' },
  { names: ['kuwait','kuwaiti'], lat: 29.4, lng: 47.9, country: 'KW', region: 'Middle East' },
  { names: ['bahrain','manama'], lat: 26.2, lng: 50.6, country: 'BH', region: 'Middle East' },
  { names: ['oman','muscat','omani'], lat: 23.6, lng: 58.6, country: 'OM', region: 'Middle East' },
  // Africa
  { names: ['egypt','cairo','egyptian'], lat: 30.1, lng: 31.2, country: 'EG', region: 'Africa' },
  { names: ['south africa','cape town','johannesburg','pretoria','south african'], lat: -25.7, lng: 28.2, country: 'ZA', region: 'Africa' },
  { names: ['nigeria','lagos','abuja','nigerian'], lat: 9.1, lng: 7.5, country: 'NG', region: 'Africa' },
  { names: ['ethiopia','addis ababa','ethiopian'], lat: 9.0, lng: 38.7, country: 'ET', region: 'Africa' },
  { names: ['kenya','nairobi','kenyan'], lat: -1.3, lng: 36.8, country: 'KE', region: 'Africa' },
  { names: ['ghana','accra','ghanaian'], lat: 5.6, lng: -0.2, country: 'GH', region: 'Africa' },
  { names: ['sudan','khartoum','sudanese'], lat: 15.6, lng: 32.5, country: 'SD', region: 'Africa' },
  { names: ['libya','tripoli','libyan'], lat: 32.9, lng: 13.2, country: 'LY', region: 'Africa' },
  { names: ['morocco','rabat','casablanca','moroccan'], lat: 34.0, lng: -6.8, country: 'MA', region: 'Africa' },
  { names: ['algeria','algiers','algerian'], lat: 36.7, lng: 3.0, country: 'DZ', region: 'Africa' },
  { names: ['tunisia','tunis','tunisian'], lat: 36.8, lng: 10.2, country: 'TN', region: 'Africa' },
  { names: ['somalia','mogadishu','somali'], lat: 2.0, lng: 45.3, country: 'SO', region: 'Africa' },
  { names: ['congo','kinshasa','drc'], lat: -4.3, lng: 15.3, country: 'CD', region: 'Africa' },
  { names: ['tanzania','dar es salaam','tanzanian'], lat: -6.8, lng: 39.3, country: 'TZ', region: 'Africa' },
  { names: ['senegal','dakar','senegalese'], lat: 14.7, lng: -17.4, country: 'SN', region: 'Africa' },
  { names: ['mali','bamako','malian'], lat: 12.6, lng: -8.0, country: 'ML', region: 'Africa' },
  { names: ['mozambique','maputo'], lat: -25.9, lng: 32.6, country: 'MZ', region: 'Africa' },
  { names: ['zimbabwe','harare'], lat: -17.8, lng: 31.1, country: 'ZW', region: 'Africa' },
  // Asia Pacific
  { names: ['china','beijing','shanghai','hong kong','xi jinping','chinese','prc'], lat: 39.9, lng: 116.4, country: 'CN', region: 'Asia Pacific' },
  { names: ['japan','tokyo','osaka','japanese'], lat: 35.7, lng: 139.7, country: 'JP', region: 'Asia Pacific' },
  { names: ['south korea','seoul','korean'], lat: 37.6, lng: 127.0, country: 'KR', region: 'Asia Pacific' },
  { names: ['north korea','pyongyang','kim jong'], lat: 39.0, lng: 125.8, country: 'KP', region: 'Asia Pacific' },
  { names: ['india','delhi','mumbai','new delhi','bangalore','modi','indian'], lat: 28.6, lng: 77.2, country: 'IN', region: 'Asia Pacific' },
  { names: ['pakistan','islamabad','karachi','lahore','pakistani'], lat: 33.7, lng: 73.1, country: 'PK', region: 'Asia Pacific' },
  { names: ['afghanistan','kabul','taliban','afghani'], lat: 34.5, lng: 69.2, country: 'AF', region: 'Asia Pacific' },
  { names: ['australia','canberra','sydney','melbourne','australian'], lat: -35.3, lng: 149.1, country: 'AU', region: 'Asia Pacific' },
  { names: ['indonesia','jakarta','indonesian'], lat: -6.2, lng: 106.8, country: 'ID', region: 'Asia Pacific' },
  { names: ['philippines','manila','philippine','filipino'], lat: 14.6, lng: 121.0, country: 'PH', region: 'Asia Pacific' },
  { names: ['vietnam','hanoi','ho chi minh','vietnamese'], lat: 21.0, lng: 105.8, country: 'VN', region: 'Asia Pacific' },
  { names: ['thailand','bangkok','thai'], lat: 13.8, lng: 100.5, country: 'TH', region: 'Asia Pacific' },
  { names: ['malaysia','kuala lumpur','malaysian'], lat: 3.1, lng: 101.7, country: 'MY', region: 'Asia Pacific' },
  { names: ['singapore','singaporean'], lat: 1.3, lng: 103.8, country: 'SG', region: 'Asia Pacific' },
  { names: ['myanmar','rangoon','yangon','burmese'], lat: 19.8, lng: 96.2, country: 'MM', region: 'Asia Pacific' },
  { names: ['bangladesh','dhaka','bangladeshi'], lat: 23.7, lng: 90.4, country: 'BD', region: 'Asia Pacific' },
  { names: ['sri lanka','colombo'], lat: 6.9, lng: 79.9, country: 'LK', region: 'Asia Pacific' },
  { names: ['nepal','kathmandu','nepalese'], lat: 27.7, lng: 85.3, country: 'NP', region: 'Asia Pacific' },
  { names: ['new zealand','wellington','auckland'], lat: -41.3, lng: 174.8, country: 'NZ', region: 'Asia Pacific' },
  { names: ['taiwan','taipei','taiwanese'], lat: 25.0, lng: 121.5, country: 'TW', region: 'Asia Pacific' },
  { names: ['cambodia','phnom penh','cambodian'], lat: 11.6, lng: 104.9, country: 'KH', region: 'Asia Pacific' },
  { names: ['laos','vientiane','laotian'], lat: 18.0, lng: 102.6, country: 'LA', region: 'Asia Pacific' },
  { names: ['mongolia','ulaanbaatar','mongolian'], lat: 47.9, lng: 106.9, country: 'MN', region: 'Asia Pacific' },
  { names: ['kazakhstan','astana','nur-sultan','kazakh'], lat: 51.2, lng: 71.4, country: 'KZ', region: 'Asia Pacific' },
  { names: ['uzbekistan','tashkent','uzbek'], lat: 41.3, lng: 69.3, country: 'UZ', region: 'Asia Pacific' },
];

// ─── Geo-tag an article ───────────────────────────────────────────────────────
function geoTag(title, description, fallback) {
  const text = `${title} ${description || ''}`.toLowerCase();
  for (const entry of GEO_LOOKUP) {
    if (entry.names.some(name => text.includes(name))) {
      const jitter = () => (Math.random() - 0.5) * 2;
      return { lat: entry.lat + jitter(), lng: entry.lng + jitter(), region: entry.region };
    }
  }
  return { lat: fallback.lat, lng: fallback.lng, region: 'Global' };
}

// ─── Fetch one RSS feed ───────────────────────────────────────────────────────
async function fetchSource(source) {
  try {
    const feed = await parser.parseURL(source.url);
    return feed.items.slice(0, 30).map((item, i) => {
      const geo = geoTag(item.title || '', item.contentSnippet || item.content || '', source.fallback);
      return {
        id: `${source.name}-${i}-${Date.now()}`,
        title: item.title || '(no title)',
        url: item.link || item.guid || '#',
        source: source.name,
        publishedAt: item.pubDate || item.isoDate || new Date().toISOString(),
        summary: (item.contentSnippet || item.content || '').slice(0, 200),
        lat: geo.lat,
        lng: geo.lng,
        region: geo.region,
      };
    });
  } catch (err) {
    console.warn(`[newsService] Failed to fetch ${source.name}: ${err.message}`);
    return [];
  }
}

// ─── Fetch all sources ────────────────────────────────────────────────────────
async function fetchAll() {
  const results = await Promise.allSettled(SOURCES.map(fetchSource));
  const articles = results
    .filter(r => r.status === 'fulfilled')
    .flatMap(r => r.value);
  // Sort by newest first
  articles.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  return articles;
}

module.exports = { fetchAll, SOURCES };
