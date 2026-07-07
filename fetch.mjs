#!/usr/bin/env node
// 全球黑客松地图 · 数据抓取器（零依赖，Node 18+）
// 四个免 Key 数据源 → 归一化 → 离线地理编码 → data.js
// 注意：本脚本只写 data.js，不碰 index.html —— 页面随便改，不会被覆盖。

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

async function get(url, asJson = true) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': asJson ? 'application/json' : 'text/html' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return asJson ? await res.json() : await res.text();
    } catch (e) {
      if (i === 2) { console.error(`  ✗ ${url} — ${e.message}`); return null; }
      await new Promise(r => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

// ---------- 离线地理编码 ----------
// 常见黑客松城市 → [lat, lng]。查不到城市时退到国家中心点（带少量抖动防重叠）。
const CITY = {
  // 北美
  'san francisco':[37.7749,-122.4194],'new york':[40.7128,-74.006],'new york city':[40.7128,-74.006],'boston':[42.3601,-71.0589],'cambridge':[42.3736,-71.1097],'seattle':[47.6062,-122.3321],'los angeles':[34.0522,-118.2437],'austin':[30.2672,-97.7431],'chicago':[41.8781,-87.6298],'atlanta':[33.749,-84.388],'denver':[39.7392,-104.9903],'boulder':[40.015,-105.2705],'miami':[25.7617,-80.1918],'philadelphia':[39.9526,-75.1652],'pittsburgh':[40.4406,-79.9959],'houston':[29.7604,-95.3698],'dallas':[32.7767,-96.797],'san jose':[37.3382,-121.8863],'palo alto':[37.4419,-122.143],'mountain view':[37.3861,-122.0839],'berkeley':[37.8715,-122.273],'stanford':[37.4275,-122.1697],'san diego':[32.7157,-117.1611],'portland':[45.5152,-122.6784],'ann arbor':[42.2808,-83.743],'madison':[43.0731,-89.4012],'urbana':[40.1106,-88.2073],'champaign':[40.1164,-88.2434],'college station':[30.6280,-96.3344],'gainesville':[29.6516,-82.3248],'tempe':[33.4255,-111.94],'tucson':[32.2226,-110.9747],'salt lake city':[40.7608,-111.891],'provo':[40.2338,-111.6585],'minneapolis':[44.9778,-93.265],'columbus':[39.9612,-82.9988],'cleveland':[41.4993,-81.6944],'cincinnati':[39.1031,-84.512],'detroit':[42.3314,-83.0458],'baltimore':[39.2904,-76.6122],'washington':[38.9072,-77.0369],'raleigh':[35.7796,-78.6382],'durham':[35.994,-78.8986],'chapel hill':[35.9132,-79.0558],'charlotte':[35.2271,-80.8431],'nashville':[36.1627,-86.7816],'orlando':[28.5383,-81.3792],'tampa':[27.9506,-82.4572],'phoenix':[33.4484,-112.074],'las vegas':[36.1699,-115.1398],'kansas city':[39.0997,-94.5786],'st. louis':[38.627,-90.1994],'indianapolis':[39.7684,-86.1581],'bloomington':[39.1653,-86.5264],'west lafayette':[40.4259,-86.9081],'lexington':[38.0406,-84.5037],'knoxville':[35.9606,-83.9207],'blacksburg':[37.2296,-80.4139],'charlottesville':[38.0293,-78.4767],'ithaca':[42.4440,-76.5019],'rochester':[43.1566,-77.6088],'buffalo':[42.8864,-78.8784],'syracuse':[43.0481,-76.1474],'troy':[42.7284,-73.6918],'amherst':[42.3732,-72.5199],'providence':[41.824,-71.4128],'new haven':[41.3083,-72.9279],'newark':[40.7357,-74.1724],'princeton':[40.3573,-74.6672],'hoboken':[40.744,-74.0324],'state college':[40.7934,-77.86],'toronto':[43.6532,-79.3832],'waterloo':[43.4643,-80.5204],'montreal':[45.5017,-73.5673],'vancouver':[49.2827,-123.1207],'ottawa':[45.4215,-75.6972],'calgary':[51.0447,-114.0719],'edmonton':[53.5461,-113.4938],'kingston':[44.2312,-76.486],'hamilton':[43.2557,-79.8711],'london, canada':[42.9849,-81.2453],'mexico city':[19.4326,-99.1332],'guadalajara':[20.6597,-103.3496],'monterrey':[25.6866,-100.3161],
  // 欧洲
  'london':[51.5074,-0.1278],'oxford':[51.752,-1.2577],'cambridge, uk':[52.2053,0.1218],'manchester':[53.4808,-2.2426],'edinburgh':[55.9533,-3.1883],'glasgow':[55.8642,-4.2518],'birmingham':[52.4862,-1.8904],'bristol':[51.4545,-2.5879],'leeds':[53.8008,-1.5491],'dublin':[53.3498,-6.2603],'paris':[48.8566,2.3522],'lyon':[45.764,4.8357],'toulouse':[43.6047,1.4442],'berlin':[52.52,13.405],'munich':[48.1351,11.582],'hamburg':[53.5511,9.9937],'frankfurt':[50.1109,8.6821],'cologne':[50.9375,6.9603],'stuttgart':[48.7758,9.1829],'karlsruhe':[49.0069,8.4037],'darmstadt':[49.8728,8.6512],'aachen':[50.7753,6.0839],'amsterdam':[52.3676,4.9041],'rotterdam':[51.9244,4.4777],'delft':[52.0116,4.3571],'eindhoven':[51.4416,5.4697],'utrecht':[52.0907,5.1214],'brussels':[50.8503,4.3517],'ghent':[51.0543,3.7174],'leuven':[50.8798,4.7005],'zurich':[47.3769,8.5417],'geneva':[46.2044,6.1432],'lausanne':[46.5197,6.6323],'bern':[46.948,7.4474],'vienna':[48.2082,16.3738],'prague':[50.0755,14.4378],'brno':[49.1951,16.6068],'warsaw':[52.2297,21.0122],'krakow':[50.0647,19.945],'wroclaw':[51.1079,17.0385],'budapest':[47.4979,19.0402],'bucharest':[44.4268,26.1025],'cluj-napoca':[46.7712,23.6236],'sofia':[42.6977,23.3219],'athens':[37.9838,23.7275],'rome':[41.9028,12.4964],'milan':[45.4642,9.19],'turin':[45.0703,7.6869],'bologna':[44.4949,11.3426],'florence':[43.7696,11.2558],'madrid':[40.4168,-3.7038],'barcelona':[41.3874,2.1686],'valencia':[39.4699,-0.3763],'seville':[37.3891,-5.9845],'bilbao':[43.263,-2.935],'lisbon':[38.7223,-9.1393],'porto':[41.1579,-8.6291],'stockholm':[59.3293,18.0686],'gothenburg':[57.7089,11.9746],'oslo':[59.9139,10.7522],'copenhagen':[55.6761,12.5683],'aarhus':[56.1629,10.2039],'helsinki':[60.1699,24.9384],'espoo':[60.2055,24.6559],'tallinn':[59.437,24.7536],'tartu':[58.3776,26.729],'riga':[56.9496,24.1052],'vilnius':[54.6872,25.2797],'kyiv':[50.4501,30.5234],'lviv':[49.8397,24.0297],'belgrade':[44.7866,20.4489],'zagreb':[45.815,15.9819],'ljubljana':[46.0569,14.5058],'bratislava':[48.1486,17.1077],'istanbul':[41.0082,28.9784],'ankara':[39.9334,32.8597],'moscow':[55.7558,37.6173],'cannes':[43.5528,7.0174],'nice':[43.7102,7.2620],
  // 亚洲
  'beijing':[39.9042,116.4074],'shanghai':[31.2304,121.4737],'shenzhen':[22.5431,114.0579],'guangzhou':[23.1291,113.2644],'hangzhou':[30.2741,120.1551],'chengdu':[30.5728,104.0668],'nanjing':[32.0603,118.7969],'wuhan':[30.5928,114.3055],'xi\'an':[34.3416,108.9398],'suzhou':[31.2989,120.5853],'hong kong':[22.3193,114.1694],'taipei':[25.033,121.5654],'hsinchu':[24.8138,120.9675],'macau':[22.1987,113.5439],'tokyo':[35.6762,139.6503],'osaka':[34.6937,135.5023],'kyoto':[35.0116,135.7681],'fukuoka':[33.5904,130.4017],'seoul':[37.5665,126.978],'busan':[35.1796,129.0756],'daejeon':[36.3504,127.3845],'singapore':[1.3521,103.8198],'kuala lumpur':[3.139,101.6869],'penang':[5.4141,100.3288],'jakarta':[-6.2088,106.8456],'bandung':[-6.9175,107.6191],'surabaya':[-7.2575,112.7521],'bangkok':[13.7563,100.5018],'chiang mai':[18.7883,98.9853],'ho chi minh city':[10.8231,106.6297],'hanoi':[21.0285,105.8542],'da nang':[16.0544,108.2022],'manila':[14.5995,120.9842],'cebu':[10.3157,123.8854],'phnom penh':[11.5564,104.9282],'mumbai':[19.076,72.8777],'delhi':[28.7041,77.1025],'new delhi':[28.6139,77.209],'bangalore':[12.9716,77.5946],'bengaluru':[12.9716,77.5946],'hyderabad':[17.385,78.4867],'chennai':[13.0827,80.2707],'pune':[18.5204,73.8567],'kolkata':[22.5726,88.3639],'ahmedabad':[23.0225,72.5714],'jaipur':[26.9124,75.7873],'chandigarh':[30.7333,76.7794],'lucknow':[26.8467,80.9462],'noida':[28.5355,77.391],'gurgaon':[28.4595,77.0266],'gurugram':[28.4595,77.0266],'kochi':[9.9312,76.2673],'coimbatore':[11.0168,76.9558],'indore':[22.7196,75.8577],'nagpur':[21.1458,79.0882],'bhopal':[23.2599,77.4126],'patna':[25.5941,85.1376],'kanpur':[26.4499,80.3319],'varanasi':[25.3176,82.9739],'roorkee':[29.8543,77.888],'kharagpur':[22.346,87.2319],'guwahati':[26.1445,91.7362],'vellore':[12.9165,79.1325],'manipal':[13.3525,74.7928],'surat':[21.1702,72.8311],'vadodara':[22.3072,73.1812],'karachi':[24.8607,67.0011],'lahore':[31.5204,74.3587],'islamabad':[33.6844,73.0479],'dhaka':[23.8103,90.4125],'colombo':[6.9271,79.8612],'kathmandu':[27.7172,85.324],'dubai':[25.2048,55.2708],'abu dhabi':[24.4539,54.3773],'sharjah':[25.3463,55.4209],'riyadh':[24.7136,46.6753],'jeddah':[21.4858,39.1925],'doha':[25.2854,51.531],'manama':[26.2285,50.586],'kuwait city':[29.3759,47.9774],'muscat':[23.588,58.3829],'amman':[31.9454,35.9284],'beirut':[33.8938,35.5018],'tel aviv':[32.0853,34.7818],'jerusalem':[31.7683,35.2137],'haifa':[32.794,34.9896],'tbilisi':[41.7151,44.8271],'yerevan':[40.1792,44.4991],'baku':[40.4093,49.8671],'almaty':[43.222,76.8512],'astana':[51.1605,71.4704],'tashkent':[41.2995,69.2401],'bishkek':[42.8746,74.5698],'ulaanbaatar':[47.8864,106.9057],
  // 大洋洲
  'sydney':[-33.8688,151.2093],'melbourne':[-37.8136,144.9631],'brisbane':[-27.4698,153.0251],'perth':[-31.9505,115.8605],'adelaide':[-34.9285,138.6007],'canberra':[-35.2809,149.13],'auckland':[-36.8485,174.7633],'wellington':[-41.2866,174.7756],'christchurch':[-43.532,172.6306],
  // 南美 / 非洲
  'sao paulo':[-23.5505,-46.6333],'são paulo':[-23.5505,-46.6333],'rio de janeiro':[-22.9068,-43.1729],'belo horizonte':[-19.9167,-43.9345],'florianopolis':[-27.5954,-48.548],'buenos aires':[-34.6037,-58.3816],'cordoba':[-31.4201,-64.1888],'santiago':[-33.4489,-70.6693],'bogota':[4.711,-74.0721],'medellin':[6.2442,-75.5812],'lima':[-12.0464,-77.0428],'quito':[-0.1807,-78.4678],'montevideo':[-34.9011,-56.1645],'caracas':[10.4806,-66.9036],'la paz':[-16.4897,-68.1193],'san jose, costa rica':[9.9281,-84.0907],'panama city':[8.9824,-79.5199],'guatemala city':[14.6349,-90.5069],'lagos':[6.5244,3.3792],'abuja':[9.0765,7.3986],'nairobi':[-1.2921,36.8219],'cape town':[-33.9249,18.4241],'johannesburg':[-26.2041,28.0473],'pretoria':[-25.7479,28.2293],'cairo':[30.0444,31.2357],'alexandria':[31.2001,29.9187],'accra':[5.6037,-0.187],'kumasi':[6.6885,-1.6244],'kampala':[0.3476,32.5825],'kigali':[-1.9441,30.0619],'dar es salaam':[-6.7924,39.2083],'addis ababa':[9.032,38.7469],'casablanca':[33.5731,-7.5898],'rabat':[34.0209,-6.8416],'tunis':[36.8065,10.1815],'algiers':[36.7538,3.0588],'dakar':[14.7167,-17.4677],'abidjan':[5.36,-4.0083],'harare':[-17.8252,31.0335],'lusaka':[-15.3875,28.3228],
};
const COUNTRY = {
  'US':['美国','北美',39.8,-98.6],'CA':['加拿大','北美',56.1,-106.3],'MX':['墨西哥','北美',23.6,-102.5],
  'GB':['英国','欧洲',54.0,-2.0],'UK':['英国','欧洲',54.0,-2.0],'IE':['爱尔兰','欧洲',53.4,-8.2],'FR':['法国','欧洲',46.2,2.2],'DE':['德国','欧洲',51.2,10.4],'NL':['荷兰','欧洲',52.1,5.3],'BE':['比利时','欧洲',50.5,4.5],'CH':['瑞士','欧洲',46.8,8.2],'AT':['奥地利','欧洲',47.5,14.6],'CZ':['捷克','欧洲',49.8,15.5],'PL':['波兰','欧洲',51.9,19.1],'HU':['匈牙利','欧洲',47.2,19.5],'RO':['罗马尼亚','欧洲',45.9,24.9],'BG':['保加利亚','欧洲',42.7,25.5],'GR':['希腊','欧洲',39.1,21.8],'IT':['意大利','欧洲',41.9,12.6],'ES':['西班牙','欧洲',40.5,-3.7],'PT':['葡萄牙','欧洲',39.4,-8.2],'SE':['瑞典','欧洲',60.1,18.6],'NO':['挪威','欧洲',60.5,8.5],'DK':['丹麦','欧洲',56.3,9.5],'FI':['芬兰','欧洲',61.9,25.7],'EE':['爱沙尼亚','欧洲',58.6,25.0],'LV':['拉脱维亚','欧洲',56.9,24.6],'LT':['立陶宛','欧洲',55.2,23.9],'UA':['乌克兰','欧洲',48.4,31.2],'RS':['塞尔维亚','欧洲',44.0,21.0],'HR':['克罗地亚','欧洲',45.1,15.2],'SI':['斯洛文尼亚','欧洲',46.2,14.8],'SK':['斯洛伐克','欧洲',48.7,19.7],'TR':['土耳其','欧洲',39.0,35.2],'RU':['俄罗斯','欧洲',61.5,105.3],
  'CN':['中国','亚洲',35.9,104.2],'HK':['中国香港','亚洲',22.32,114.17],'TW':['中国台湾','亚洲',23.7,121.0],'MO':['中国澳门','亚洲',22.2,113.54],'JP':['日本','亚洲',36.2,138.3],'KR':['韩国','亚洲',35.9,127.8],'SG':['新加坡','亚洲',1.35,103.82],'MY':['马来西亚','亚洲',4.2,101.98],'ID':['印度尼西亚','亚洲',-0.8,113.9],'TH':['泰国','亚洲',15.9,101.0],'VN':['越南','亚洲',14.1,108.3],'PH':['菲律宾','亚洲',12.9,121.8],'KH':['柬埔寨','亚洲',12.6,105.0],'IN':['印度','亚洲',20.6,79.0],'PK':['巴基斯坦','亚洲',30.4,69.3],'BD':['孟加拉国','亚洲',23.7,90.4],'LK':['斯里兰卡','亚洲',7.9,80.8],'NP':['尼泊尔','亚洲',28.4,84.1],'AE':['阿联酋','亚洲',23.4,53.8],'SA':['沙特阿拉伯','亚洲',23.9,45.1],'QA':['卡塔尔','亚洲',25.4,51.2],'BH':['巴林','亚洲',26.0,50.5],'KW':['科威特','亚洲',29.3,47.5],'OM':['阿曼','亚洲',21.5,55.9],'JO':['约旦','亚洲',30.6,36.2],'LB':['黎巴嫩','亚洲',33.9,35.9],'IL':['以色列','亚洲',31.0,34.9],'GE':['格鲁吉亚','亚洲',42.3,43.4],'AM':['亚美尼亚','亚洲',40.1,45.0],'AZ':['阿塞拜疆','亚洲',40.1,47.6],'KZ':['哈萨克斯坦','亚洲',48.0,66.9],'UZ':['乌兹别克斯坦','亚洲',41.4,64.6],'KG':['吉尔吉斯斯坦','亚洲',41.2,74.8],'MN':['蒙古','亚洲',46.9,103.8],
  'AU':['澳大利亚','大洋洲',-25.3,133.8],'NZ':['新西兰','大洋洲',-40.9,174.9],
  'BR':['巴西','南美',-14.2,-51.9],'AR':['阿根廷','南美',-38.4,-63.6],'CL':['智利','南美',-35.7,-71.5],'CO':['哥伦比亚','南美',4.6,-74.3],'PE':['秘鲁','南美',-9.2,-75.0],'EC':['厄瓜多尔','南美',-1.8,-78.2],'UY':['乌拉圭','南美',-32.5,-55.8],'VE':['委内瑞拉','南美',6.4,-66.6],'BO':['玻利维亚','南美',-16.3,-63.6],'CR':['哥斯达黎加','北美',9.7,-83.8],'PA':['巴拿马','北美',8.5,-80.8],'GT':['危地马拉','北美',15.8,-90.2],
  'NG':['尼日利亚','非洲',9.1,8.7],'KE':['肯尼亚','非洲',-0.02,37.9],'ZA':['南非','非洲',-30.6,22.9],'EG':['埃及','非洲',26.8,30.8],'GH':['加纳','非洲',7.9,-1.0],'UG':['乌干达','非洲',1.4,32.3],'RW':['卢旺达','非洲',-1.9,29.9],'TZ':['坦桑尼亚','非洲',-6.4,34.9],'ET':['埃塞俄比亚','非洲',9.1,40.5],'MA':['摩洛哥','非洲',31.8,-7.1],'TN':['突尼斯','非洲',33.9,9.5],'DZ':['阿尔及利亚','非洲',28.0,1.7],'SN':['塞内加尔','非洲',14.5,-14.5],'CI':['科特迪瓦','非洲',7.5,-5.5],'ZW':['津巴布韦','非洲',-19.0,29.2],'ZM':['赞比亚','非洲',-13.1,27.8],
};
const COUNTRY_BY_NAME = {}; // "united states" -> "US"
const NAME_ALIASES = {
  'united states':'US','usa':'US','united states of america':'US','canada':'CA','mexico':'MX','united kingdom':'GB','england':'GB','scotland':'GB','wales':'GB','ireland':'IE','france':'FR','germany':'DE','netherlands':'NL','the netherlands':'NL','belgium':'BE','switzerland':'CH','austria':'AT','czech republic':'CZ','czechia':'CZ','poland':'PL','hungary':'HU','romania':'RO','bulgaria':'BG','greece':'GR','italy':'IT','spain':'ES','portugal':'PT','sweden':'SE','norway':'NO','denmark':'DK','finland':'FI','estonia':'EE','latvia':'LV','lithuania':'LT','ukraine':'UA','serbia':'RS','croatia':'HR','slovenia':'SI','slovakia':'SK','turkey':'TR','türkiye':'TR','russia':'RU','china':'CN','hong kong':'HK','taiwan':'TW','macau':'MO','japan':'JP','south korea':'KR','korea':'KR','singapore':'SG','malaysia':'MY','indonesia':'ID','thailand':'TH','vietnam':'VN','philippines':'PH','cambodia':'KH','india':'IN','pakistan':'PK','bangladesh':'BD','sri lanka':'LK','nepal':'NP','united arab emirates':'AE','uae':'AE','saudi arabia':'SA','qatar':'QA','bahrain':'BH','kuwait':'KW','oman':'OM','jordan':'JO','lebanon':'LB','israel':'IL','georgia':'GE','armenia':'AM','azerbaijan':'AZ','kazakhstan':'KZ','uzbekistan':'UZ','kyrgyzstan':'KG','mongolia':'MN','australia':'AU','new zealand':'NZ','brazil':'BR','argentina':'AR','chile':'CL','colombia':'CO','peru':'PE','ecuador':'EC','uruguay':'UY','venezuela':'VE','bolivia':'BO','costa rica':'CR','panama':'PA','guatemala':'GT','nigeria':'NG','kenya':'KE','south africa':'ZA','egypt':'EG','ghana':'GH','uganda':'UG','rwanda':'RW','tanzania':'TZ','ethiopia':'ET','morocco':'MA','tunisia':'TN','algeria':'DZ','senegal':'SN','ivory coast':'CI',"côte d'ivoire":'CI','zimbabwe':'ZW','zambia':'ZM',
};
for (const [n, c] of Object.entries(NAME_ALIASES)) COUNTRY_BY_NAME[n] = c;

// 美国州名 → 用于识别 "City, State" 是美国
const US_STATES = new Set(['alabama','alaska','arizona','arkansas','california','colorado','connecticut','delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa','kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan','minnesota','mississippi','missouri','montana','nebraska','nevada','new hampshire','new jersey','new mexico','new york','north carolina','north dakota','ohio','oklahoma','oregon','pennsylvania','rhode island','south carolina','south dakota','tennessee','texas','utah','vermont','virginia','washington','west virginia','wisconsin','wyoming','district of columbia','dc','al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy']);
const CA_PROVINCES = new Set(['ontario','quebec','british columbia','alberta','manitoba','saskatchewan','nova scotia','new brunswick','newfoundland and labrador','prince edward island','on','qc','bc','ab','mb','sk','ns','nb']);

// 解析 "City, State"/"Venue, City, Country" 等任意逗号地点串 → { city, cc }
function parseLocation(loc) {
  const parts = String(loc || '').split(',').map(s => s.trim()).filter(Boolean);
  let city = null, cc = null;
  for (const p of parts) {
    const k = p.toLowerCase();
    if (!cc && NAME_ALIASES[k]) { cc = NAME_ALIASES[k]; continue; }
    if (!cc && US_STATES.has(k)) { cc = 'US'; continue; }
    if (!cc && CA_PROVINCES.has(k)) { cc = 'CA'; continue; }
    if (!city && CITY[k]) city = p;
  }
  if (!city && parts.length) city = parts[0];
  if (!cc && city && CITY_CC[city.toLowerCase()]) cc = CITY_CC[city.toLowerCase()];
  return { city, cc };
}
// 知名城市 → 国家码（地点串只给城市名时兜底）
const CITY_CC = { 'toronto':'CA','vancouver':'CA','montreal':'CA','waterloo':'CA','ottawa':'CA','calgary':'CA','edmonton':'CA','london':'GB','oxford':'GB','manchester':'GB','edinburgh':'GB','dublin':'IE','paris':'FR','lyon':'FR','berlin':'DE','munich':'DE','amsterdam':'NL','brussels':'BE','zurich':'CH','geneva':'CH','vienna':'AT','prague':'CZ','warsaw':'PL','madrid':'ES','barcelona':'ES','lisbon':'PT','porto':'PT','rome':'IT','milan':'IT','stockholm':'SE','oslo':'NO','copenhagen':'DK','helsinki':'FI','istanbul':'TR','beijing':'CN','shanghai':'CN','shenzhen':'CN','hangzhou':'CN','hong kong':'HK','taipei':'TW','tokyo':'JP','osaka':'JP','seoul':'KR','singapore':'SG','kuala lumpur':'MY','jakarta':'ID','bangkok':'TH','manila':'PH','hanoi':'VN','ho chi minh city':'VN','mumbai':'IN','delhi':'IN','new delhi':'IN','bangalore':'IN','bengaluru':'IN','hyderabad':'IN','chennai':'IN','pune':'IN','kolkata':'IN','dubai':'AE','abu dhabi':'AE','riyadh':'SA','doha':'QA','tel aviv':'IL','sydney':'AU','melbourne':'AU','brisbane':'AU','auckland':'NZ','sao paulo':'BR','são paulo':'BR','rio de janeiro':'BR','buenos aires':'AR','santiago':'CL','bogota':'CO','lima':'PE','mexico city':'MX','lagos':'NG','nairobi':'KE','cape town':'ZA','johannesburg':'ZA','cairo':'EG','accra':'GH','cannes':'FR','nice':'FR' };

let jitterSeed = 7;
function jitter() { jitterSeed = (jitterSeed * 9301 + 49297) % 233280; return (jitterSeed / 233280 - 0.5) * 0.9; }

function geocode(city, countryCode) {
  const key = (city || '').toLowerCase().trim();
  if (key && CITY[key]) return { lat: CITY[key][0], lng: CITY[key][1], exact: true };
  const c = COUNTRY[countryCode];
  if (c) return { lat: c[2] + jitter(), lng: c[3] + jitter() * 2, exact: false };
  return null;
}

function countryInfo(code) {
  const c = COUNTRY[code];
  return c ? { name: c[0], region: c[1] } : { name: code || '', region: '其他' };
}

// ---------- 分类 ----------
function categorize(name, themes, source) {
  const t = (name + ' ' + themes.join(' ')).toLowerCase();
  const cats = new Set();
  if (source === 'ethglobal' || /web3|blockchain|crypto|ethereum|solana|defi|nft|dao|智能合约|链/.test(t)) cats.add('web3');
  if (/\bai\b|machine learning|artificial intelligence|llm|agent|ml\/|deep learning|genai|gpt|数据|data science/.test(t)) cats.add('ai');
  if (/student|university|college|school|campus|mlh|高校|学生/.test(t) || source === 'mlh') cats.add('student');
  if (/social good|climate|health|education|sustainab|accessib|环保|公益|医疗|无障碍|nonprofit|impact/.test(t)) cats.add('social');
  if (/game|gaming|unity|godot|游戏/.test(t)) cats.add('game');
  if (/fintech|finance|banking|payment|金融/.test(t)) cats.add('fintech');
  if (/security|ctf|cyber|安全/.test(t)) cats.add('security');
  if (/hardware|iot|robot|embedded|硬件|机器人/.test(t)) cats.add('hardware');
  if (!cats.size) cats.add('general');
  return [...cats];
}

function parsePrize(text) {
  if (!text) return 0;
  const clean = String(text).replace(/<[^>]*>/g, '').replace(/,/g, '');
  const m = clean.match(/\$?\s*(\d+(?:\.\d+)?)/);
  return m ? Math.round(parseFloat(m[1])) : 0;
}

function durationDays(start, end) {
  if (!start || !end) return null;
  const d = Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1);
  return d > 400 ? null : d;
}

// ---------- 源 1：Devpost ----------
async function fetchDevpost() {
  const out = [];
  for (let page = 1; page <= 8; page++) {
    const j = await get(`https://devpost.com/api/hackathons?status[]=upcoming&status[]=open&page=${page}`);
    if (!j || !j.hackathons || !j.hackathons.length) break;
    for (const h of j.hackathons) {
      const loc = h.displayed_location?.location || 'Online';
      const online = /online/i.test(loc);
      let city = null, cc = null;
      if (!online) ({ city, cc } = parseLocation(loc));
      // "May 19 - Aug 17, 2026" / "Aug 4 - 8, 2026"
      let start = null, end = null;
      const dm = (h.submission_period_dates || '').match(/^(\w+ \d+)(?:, (\d{4}))? - (?:(\w+ )?(\d+)), (\d{4})$/);
      if (dm) {
        const endYear = dm[5], startYear = dm[2] || endYear;
        start = new Date(`${dm[1]}, ${startYear} 12:00 UTC`).toISOString().slice(0, 10);
        const endMonth = dm[3] ? dm[3].trim() : dm[1].split(' ')[0];
        end = new Date(`${endMonth} ${dm[4]}, ${endYear} 12:00 UTC`).toISOString().slice(0, 10);
      }
      const themes = (h.themes || []).map(t => t.name);
      out.push({
        id: `dp-${h.id}`, name: h.title.trim(), source: 'devpost', url: h.url,
        online, city, countryCode: cc, start, end,
        prizeUSD: parsePrize(h.prize_amount), prizeText: String(h.prize_amount || '').replace(/<[^>]*>/g, ''),
        org: h.organization_name || 'Devpost', regs: h.registrations_count || 0,
        themes, openState: h.open_state,
      });
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return out;
}

// ---------- 源 2：MLH ----------
async function fetchMLH() {
  const out = [];
  const seasons = [2026, 2027];
  for (const season of seasons) {
    const html = await get(`https://mlh.io/seasons/${season}/events`, false);
    if (!html) continue;
    for (const key of ['"upcomingEvents":', '"currentEvents":']) {
      let i = html.indexOf(key);
      if (i < 0) continue;
      i += key.length;
      if (html[i] !== '[') continue;
      let depth = 0, j = i;
      for (; j < html.length; j++) {
        if (html[j] === '[') depth++;
        else if (html[j] === ']') { depth--; if (!depth) break; }
      }
      let events;
      try { events = JSON.parse(html.slice(i, j + 1)); } catch { continue; }
      for (const e of events) {
        const va = e.venueAddress || {};
        const online = e.formatType !== 'physical' && e.formatType !== 'hybrid';
        out.push({
          id: `mlh-${e.id}`, name: e.name, source: 'mlh',
          url: e.websiteUrl || `https://mlh.io${(e.url || '').replace(/\\\//g, '/')}`,
          online, city: online ? null : (va.city || (e.location || '').split(',')[0] || null),
          countryCode: online ? null : (va.country || null),
          start: e.startsAt ? e.startsAt.slice(0, 10) : null,
          end: e.endsAt ? e.endsAt.slice(0, 10) : null,
          prizeUSD: 0, prizeText: '', org: 'MLH', regs: 0, themes: [],
        });
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return out;
}

// ---------- 源 3：ETHGlobal ----------
async function fetchETHGlobal() {
  const html = await get('https://ethglobal.com/events', false);
  if (!html) return [];
  // RSC 载荷：拼接所有 self.__next_f.push([1,"..."]) 字符串再反转义
  let blob = '';
  const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let m;
  while ((m = re.exec(html))) {
    try { blob += JSON.parse(`"${m[1]}"`); } catch { /* skip */ }
  }
  const out = [], seen = new Set();
  let idx = 0;
  while ((idx = blob.indexOf('{"id":', idx)) >= 0) {
    let depth = 0, j = idx, inStr = false, esc = false;
    for (; j < blob.length; j++) {
      const ch = blob[j];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') inStr = !inStr;
      else if (!inStr) {
        if (ch === '{') depth++;
        else if (ch === '}') { depth--; if (!depth) break; }
      }
    }
    const chunk = blob.slice(idx, j + 1);
    idx = idx + 6;
    if (!chunk.includes('"medium"') || !chunk.includes('"startTime"')) continue;
    let e;
    try { e = JSON.parse(chunk); } catch { continue; }
    if (!e.name || !e.slug || seen.has(e.slug)) continue;
    seen.add(e.slug);
    const online = e.medium !== 'physical';
    const cityName = e.city?.name || null;
    const cc = e.city?.countryCode || null;
    out.push({
      id: `eg-${e.id}`, name: e.name.startsWith('ETHGlobal') || e.type !== 'hackathon' ? e.name : `ETHGlobal ${e.name}`,
      source: 'ethglobal', url: `https://ethglobal.com/events/${e.slug}`,
      online, city: cityName, countryCode: cc,
      start: e.startTime ? e.startTime.slice(0, 10) : null,
      end: e.endTime ? e.endTime.slice(0, 10) : null,
      prizeUSD: 0, prizeText: '', org: 'ETHGlobal', regs: 0,
      themes: ['Web3', e.type || 'hackathon'], type: e.type, status: e.status,
    });
  }
  // 只留未来/进行中的 hackathon 与 summit
  return out.filter(e => e.status !== 'past' && (e.type === 'hackathon' || e.type === 'summit'));
}

// ---------- 源 4：HackerEarth ----------
async function fetchHackerEarth() {
  const j = await get('https://www.hackerearth.com/chrome-extension/events/');
  if (!j || !j.response) return [];
  return j.response.filter(e => /hackathon/i.test(e.url || '')).map((e, i) => ({
    id: `he-${i}-${(e.url || '').split('/').filter(Boolean).pop()}`,
    name: e.title, source: 'hackerearth', url: e.url,
    online: true, city: null, countryCode: null,
    start: e.start_utc_tz ? e.start_utc_tz.slice(0, 10) : null,
    end: e.end_utc_tz ? e.end_utc_tz.slice(0, 10) : null,
    prizeUSD: 0, prizeText: '', org: 'HackerEarth', regs: 0,
    themes: [], student: !!e.college,
  }));
}

// ---------- 主流程 ----------
const today = new Date().toISOString().slice(0, 10);
console.log(`抓取开始 ${today}`);
const [dp, mlh, eg, he] = await Promise.all([fetchDevpost(), fetchMLH(), fetchETHGlobal(), fetchHackerEarth()]);
console.log(`  Devpost ${dp.length} · MLH ${mlh.length} · ETHGlobal ${eg.length} · HackerEarth ${he.length}`);

const all = [];
const seenName = new Set();
for (const e of [...eg, ...mlh, ...dp, ...he]) {
  // 去掉已结束超过 7 天的
  if (e.end && e.end < new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)) continue;
  const nameKey = e.name.toLowerCase().replace(/[^a-z0-9一-鿿]/g, '');
  if (seenName.has(nameKey)) continue;
  seenName.add(nameKey);

  const ci = countryInfo(e.countryCode);
  let lat = null, lng = null, exact = false;
  if (!e.online) {
    const g = geocode(e.city, e.countryCode);
    if (g) { lat = +g.lat.toFixed(4); lng = +g.lng.toFixed(4); exact = g.exact; }
    else e.online = true; // 定位不了就归入线上/未定位组，不上地图
  }
  const cats = categorize(e.name, e.themes || [], e.source);
  if (e.student && !cats.includes('student')) cats.push('student');
  all.push({
    id: e.id, name: e.name, source: e.source, url: e.url,
    online: e.online, city: e.city || null,
    country: e.online ? null : ci.name, countryCode: e.online ? null : (e.countryCode || null),
    region: e.online ? '线上' : ci.region,
    lat, lng, exact,
    start: e.start, end: e.end, days: durationDays(e.start, e.end),
    cats, prizeUSD: e.prizeUSD || 0, prizeText: e.prizeText || '',
    org: e.org, regs: e.regs || 0,
  });
}
all.sort((a, b) => (a.start || '9999') < (b.start || '9999') ? -1 : 1);

const stats = {
  total: all.length,
  onsite: all.filter(e => !e.online).length,
  online: all.filter(e => e.online).length,
  countries: new Set(all.filter(e => e.countryCode).map(e => e.countryCode)).size,
};
console.log(`合并后 ${stats.total} 场（线下 ${stats.onsite} / 线上 ${stats.online} / ${stats.countries} 个国家地区）`);

const payload = { updated: new Date().toISOString(), stats, events: all };
const { writeFileSync } = await import('node:fs');
const dir = new URL('.', import.meta.url).pathname;
writeFileSync(dir + 'data.js', 'window.HACK_DATA = ' + JSON.stringify(payload) + ';\n');
writeFileSync(dir + 'data.json', JSON.stringify(payload, null, 1));
console.log('已写入 data.js / data.json');
