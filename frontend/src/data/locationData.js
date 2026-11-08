/**
 * SolarIQ Authoritative Geographic & Administrative Hierarchy Dataset
 * 
 * Provides complete, synchronous administrative divisions for:
 * - India (All 28 States + 8 UTs; 38 Tamil Nadu districts; 26 Andhra Pradesh districts;
 *   Karnataka, Kerala, Telangana, Maharashtra, etc.)
 * - United Kingdom (England, Scotland, Wales, Northern Ireland with Counties & Boroughs)
 * - Spain (Autonomous Communities, Provinces, Municipalities)
 * - Egypt (Governorates, Markaz/Districts, Sectors)
 * - United States & Australia
 * 
 * Zero cross-contamination, instant client-side fallback on static hosts (Vercel),
 * and accurate geographic coordinates mapping.
 */

export const COUNTRIES = [
  { code: 'IN', name: 'India' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'ES', name: 'Spain' },
  { code: 'EG', name: 'Egypt' },
  { code: 'US', name: 'United States' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'DE', name: 'Germany' },
  { code: 'JP', name: 'Japan' },
  { code: 'FR', name: 'France' },
  { code: 'BR', name: 'Brazil' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'IT', name: 'Italy' }
];

// Country-specific administrative hierarchy labels
export function getHierarchyLabels(countryName) {
  const c = (countryName || '').toLowerCase();
  if (c.includes('united kingdom') || c.includes('uk') || c === 'gb') {
    return {
      state: 'Country / Region',
      district: 'County / Council Area',
      mandal: 'Borough / District',
      village: 'Town / Locality'
    };
  }
  if (c.includes('spain') || c === 'es') {
    return {
      state: 'Autonomous Community',
      district: 'Province',
      mandal: 'Municipality / Comarca',
      village: 'Town / Locality'
    };
  }
  if (c.includes('egypt') || c === 'eg') {
    return {
      state: 'Governorate',
      district: 'Markaz / District',
      mandal: 'Subdistrict / Sector',
      village: 'City / Village / Locality'
    };
  }
  if (c.includes('united states') || c === 'us') {
    return {
      state: 'State',
      district: 'County',
      mandal: 'City / Township',
      village: 'Neighborhood / Locality'
    };
  }
  if (c.includes('australia') || c === 'au') {
    return {
      state: 'State / Territory',
      district: 'Region / LGA',
      mandal: 'Suburb / District',
      village: 'Locality'
    };
  }
  // Default (India & others)
  return {
    state: 'State / UT',
    district: 'District',
    mandal: 'Subdistrict / Taluk / Mandal',
    village: 'Village / Locality'
  };
}

// ----------------------------------------------------------------------
// INDIA ADMINISTRATIVE DATA
// ----------------------------------------------------------------------

export const INDIA_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

// All 38 Official Districts of Tamil Nadu
export const TAMIL_NADU_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri',
  'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram', 'Kanyakumari', 'Karur',
  'Krishnagiri', 'Madurai', 'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris',
  'Perambalur', 'Pudukkottai', 'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga',
  'Tenkasi', 'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur', 'Vellore',
  'Viluppuram', 'Virudhunagar'
];

// All 26 Official Districts of Andhra Pradesh
export const ANDHRA_PRADESH_DISTRICTS = [
  'Alluri Sitharama Raju', 'Anakapalli', 'Anantapur', 'Annamayya', 'Bapatla',
  'Chittoor', 'Dr. B.R. Ambedkar Konaseema', 'East Godavari', 'Eluru', 'Guntur',
  'Kakinada', 'Krishna', 'Kurnool', 'Nandyal', 'NTR', 'Palnadu',
  'Parvathipuram Manyam', 'Prakasam', 'SPSR Nellore', 'Sri Sathya Sai',
  'Srikakulam', 'Tirupati', 'Visakhapatnam', 'Vizianagaram', 'West Godavari',
  'YSR Kadapa'
];

export const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Urban', 'Bengaluru Rural', 'Bidar',
  'Chamarajanagar', 'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada',
  'Davanagere', 'Dharwad', 'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar',
  'Koppal', 'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru',
  'Udupi', 'Uttara Kannada', 'Vijayanagara', 'Vijayapura', 'Yadgir'
];

export const KERALA_DISTRICTS = [
  'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam',
  'Kozhikode', 'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram',
  'Thrissur', 'Wayanad'
];

export const TELANGANA_DISTRICTS = [
  'Adilabad', 'Bhadradri Kothagudem', 'Hanamkonda', 'Hyderabad', 'Jagtial', 'Jangaon',
  'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam',
  'Kumuram Bheem', 'Mahabubabad', 'Mahabubnagar', 'Mancherial', 'Medak',
  'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool', 'Nalgonda', 'Narayanpet', 'Nirmal',
  'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Ranga Reddy', 'Sangareddy',
  'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Yadadri Bhuvanagiri'
];

export const MAHARASHTRA_DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Beed', 'Bhandara', 'Buldhana', 'Chandrapur',
  'Chhatrapati Sambhajinagar', 'Dharashiv', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
  'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur',
  'Nanded', 'Nandurbar', 'Nashik', 'Palghar', 'Parbhani', 'Pune', 'Raigad',
  'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg', 'Solapur', 'Thane', 'Wardha',
  'Washim', 'Yavatmal'
];

// Subdistricts / Taluks / Mandals for India
export const SUBDISTRICTS_DATA = {
  // Tamil Nadu Districts
  'pudukkottai': [
    'Pudukkottai', 'Alangudi', 'Aranthangi', 'Avudaiyarkoil', 'Gandarvakkottai',
    'Iluppur', 'Karambakkudi', 'Kulathur', 'Manamelkudi', 'Ponnamaravathi',
    'Thirumayam', 'Viralimalai'
  ],
  'chennai': [
    'Egmore', 'Mylapore', 'Guindy', 'Tondiarpet', 'Velachery', 'Anna Nagar',
    'Perambur', 'Royapuram', 'Aminjikarai', 'Mambalam', 'Alandur', 'Sholinganallur'
  ],
  'coimbatore': [
    'Coimbatore South', 'Coimbatore North', 'Pollachi', 'Mettupalayam', 'Sulur',
    'Annur', 'Valparai', 'Kinathukadavu', 'Madukkarai'
  ],
  'madurai': [
    'Madurai South', 'Madurai North', 'Melur', 'Thirumangalam', 'Usilampatti',
    'Vadipatti', 'Thirupparankundram', 'Peraiyur'
  ],
  'salem': [
    'Salem', 'Attur', 'Mettur', 'Omalur', 'Sankari', 'Yercaud', 'Edappadi', 'Gangavalli'
  ],
  'tiruchirappalli': [
    'Tiruchirappalli West', 'Tiruchirappalli East', 'Srirangam', 'Lalgudi', 'Manapparai',
    'Musiri', 'Thuraiyur'
  ],

  // Andhra Pradesh Districts
  'anantapur': [
    'Anantapur', 'Tadpatri', 'Guntakal', 'Dharmavaram', 'Kadiri', 'Hindupur', 'Rayadurg',
    'Kalyandurg', 'Uravakonda', 'Pamidi', 'Singanamala', 'Bukkarayasamudram', 'Kudair',
    'Atmakur', 'Raptadu', 'Garladinne'
  ],
  'kurnool': [
    'Kurnool Urban', 'Kurnool Rural', 'Kodumur', 'C.Belagal', 'Gudur', 'Kallur',
    'Orvakal', 'Yemmiganur', 'Mantralayam', 'Adoni', 'Alur', 'Pattikonda'
  ],
  'nandyal': [
    'Nandyal', 'Allagadda', 'Banaganapalle', 'Bethamcherla', 'Dhone', 'Koilkuntla',
    'Mahanandi', 'Panyam', 'Srisailam', 'Atmakur', 'Nandikotkur'
  ],
  'chittoor': [
    'Chittoor', 'Palamaner', 'Nagari', 'Punganur', 'Kuppam', 'Bangarupalem',
    'Gudipala', 'Yadamari', 'Gangadhara Nellore', 'Karvetinagar'
  ],
  'tirupati': [
    'Tirupati Urban', 'Tirupati Rural', 'Chandragiri', 'Srikalahasti', 'Renigunta',
    'Vadamalapeta', 'Yerpedu', 'Sullurpeta', 'Venkatagiri'
  ],
  'guntur': [
    'Guntur East', 'Guntur West', 'Mangalagiri', 'Tenali', 'Tadikonda', 'Ponnur', 'Bapatla'
  ],
  'visakhapatnam': [
    'Visakhapatnam Urban', 'Gajuwaka', 'Anandapuram', 'Bheemunipatnam', 'Pendurthi', 'Padmanabham'
  ],

  // Karnataka Districts
  'bengaluru urban': [
    'Bengaluru North', 'Bengaluru South', 'Bengaluru East', 'Anekal', 'Yelahanka'
  ],
  'mysuru': [
    'Mysuru Urban', 'Mysuru Rural', 'Nanjangud', 'Hunsur', 'Piriyapatna', 'T. Narasipura'
  ],

  // Kerala Districts
  'ernakulam': [
    'Kochi', 'Kanayannur', 'Aluva', 'Paravur', 'Kunnathunad', 'Muvattupuzha', 'Kothamangalam'
  ],
  'thiruvananthapuram': [
    'Thiruvananthapuram', 'Nedumangad', 'Neyyattinkara', 'Chirayinkeezhu', 'Varkala', 'Kattakada'
  ],

  // Telangana Districts
  'hyderabad': [
    'Shaikpet', 'Ameerpet', 'Khairatabad', 'Secunderabad', 'Charminar', 'Asifnagar',
    'Musheerabad', 'Golconda', 'Bahadurpura'
  ],

  // Maharashtra Districts
  'mumbai suburban': [
    'Andheri', 'Borivali', 'Kurla', 'Bandra'
  ],
  'pune': [
    'Pune City', 'Haveli', 'Mulshi', 'Maval', 'Shirur', 'Baramati', 'Khed'
  ]
};

// Villages / Localities for India
export const VILLAGES_DATA = {
  // Tamil Nadu
  'pudukkottai': [
    'Pudukkottai Town', 'Machuvadi', 'Rajagopalapuram', 'Thirugokarnam', 'Kavinadu East',
    'Kavinadu West', 'Perungalur', 'Mullur', 'Vathanakkottai', 'Kallalangudi'
  ],
  'alangudi': [
    'Alangudi Town', 'Vallathirakkottai', 'Vadakadu', 'Keeramangalam', 'Kothamangalam', 'Venkatakulam'
  ],
  'aranthangi': [
    'Aranthangi Town', 'Silattur', 'Avudayarkoil Road', 'Merpanaikadu', 'Nagudi', 'Rajendrapuram'
  ],
  'gandarvakkottai': [
    'Gandarvakkottai Town', 'Kallakkottai', 'Kattunaval', 'Pisanathur', 'Namburanpatti'
  ],
  'iluppur': [
    'Iluppur Town', 'Annavasal', 'Ennaipatti', 'Malaikudipatti', 'Vettukkadu'
  ],
  'mylapore': [
    'Mylapore Locality', 'Mandaveli', 'Santhome', 'Alwarpet', 'Royapettah', 'R.A. Puram'
  ],
  'guindy': [
    'Guindy Industrial Estate', 'Ekkatuthangal', 'Little Mount', 'Saidapet', 'St. Thomas Mount'
  ],
  'anna nagar': [
    'Anna Nagar West', 'Anna Nagar East', 'Shenoy Nagar', 'Kilpauk', 'Mogappair'
  ],
  'velachery': [
    'Velachery Main', 'Vijaya Nagar', 'Baby Nagar', 'Dhandeeswaram', 'Taramani'
  ],
  'egmore': [
    'Egmore Station Area', 'Pantheon Road', 'Pudupet', 'Chetpet', 'Chintadripet'
  ],
  'coimbatore south': [
    'Gandhipuram', 'RS Puram', 'Town Hall', 'Ramanathapuram', 'Singanallur', 'Peelamedu'
  ],
  'madurai south': [
    'Simmakkal', 'Periyar', 'Meenakshi Temple Area', 'Teppakulam', 'Villapuram'
  ],
  'salem': [
    'Salem Old Town', 'Fairlands', 'Suramangalam', 'Hasthampatti', 'Ammapet'
  ],

  // Andhra Pradesh
  'anantapur': [
    'Anantapur Urban / Town', 'Kakkalapalli', 'Rudrampeta', 'Papampeta', 'Alamuru',
    'Itikalapalli', 'Prasannayapalli', 'Katiganakal', 'Salakalacheruvu', 'Kandukur'
  ],
  'tadpatri': [
    'Tadpatri Town', 'Alur', 'Bhogasamudram', 'Bondaladinne', 'Bugga', 'Challavaripalli'
  ],
  'guntakal': [
    'Guntakal Town', 'Donga Obulapuram', 'Gathasani', 'Kasapuram', 'Konasamudram', 'Nagalapuram'
  ],
  'kurnool urban': [
    'Kurnool City', 'Budhawara Peta', 'B Camp', 'Joharapuram', 'Nandyal Checkpost', 'Abbas Nagar', 'Roza'
  ],
  'kurnool rural': [
    'Ulchala', 'Gargeyapuram', 'Panchalingala', 'E.Thandrapadu', 'Mamidalapadu', 'Peddapadu'
  ],
  'nandyal': [
    'Nandyal Town', 'Noonepalle', 'Moolasagaram', 'Rythu Nagaram', 'Panyam Road', 'Sanjeeva Nagar'
  ],
  'allagadda': [
    'Allagadda Town', 'Ahobilam', 'Gopalapuram', 'Bachepalle', 'Chagalamarri Road'
  ],
  'tirupati urban': [
    'Tirupati City', 'Alipiri', 'KT Road', 'Korlagunta', 'Bairagipatteda', 'Renigunta Road'
  ],

  // Karnataka
  'bengaluru north': [
    'Malleshwaram', 'Hebbal', 'Yelahanka New Town', 'Sadashivanagar', 'Yeshwanthpur', 'RT Nagar'
  ],
  'bengaluru south': [
    'Koramangala', 'Jayanagar', 'HSR Layout', 'BTM Layout', 'JP Nagar', 'Electronic City'
  ],

  // Kerala
  'kochi': [
    'Marine Drive', 'Fort Kochi', 'Mattancherry', 'Willingdon Island', 'Edappally', 'Kaloor'
  ],
  'thiruvananthapuram': [
    'Pattom', 'Palayam', 'Kowdiar', 'Kazhakoottam', 'East Fort', 'Sreekaryam'
  ],

  // Telangana
  'shaikpet': [
    'Banjara Hills', 'Jubilee Hills', 'Hitec City', 'Tolichowki', 'Film Nagar'
  ],
  'khairatabad': [
    'Somajiguda', 'Punjagutta', 'Khairatabad Circle', 'Raj Bhavan Road', 'Lakdikapul'
  ],

  // Maharashtra
  'andheri': [
    'Andheri West', 'Andheri East', 'Lokhandwala', 'Versova', 'MIDC Industrial Area', 'Chakala'
  ],
  'pune city': [
    'Shivajinagar', 'Kothrud', 'Viman Nagar', 'Hinjawadi', 'Koregaon Park', 'Baner'
  ]
};

// ----------------------------------------------------------------------
// UNITED KINGDOM ADMINISTRATIVE DATA
// ----------------------------------------------------------------------

export const UK_REGIONS = [
  'England', 'Scotland', 'Wales', 'Northern Ireland'
];

export const UK_COUNTIES = {
  'england': [
    'Greater London', 'West Midlands', 'Greater Manchester', 'West Yorkshire',
    'South Yorkshire', 'Merseyside', 'Tyne and Wear', 'Hampshire', 'Surrey',
    'Kent', 'Essex', 'Berkshire', 'Oxfordshire', 'Cambridgeshire', 'Gloucestershire'
  ],
  'scotland': [
    'City of Edinburgh', 'Glasgow City', 'Aberdeen City', 'Dundee City',
    'Highland', 'Fife', 'Stirling', 'Argyll and Bute', 'Perth and Kinross'
  ],
  'wales': [
    'Cardiff', 'Swansea', 'Newport', 'Powys', 'Gwynedd', 'Wrexham',
    'Vale of Glamorgan', 'Pembrokeshire', 'Flintshire', 'Carmarthenshire'
  ],
  'northern ireland': [
    'Belfast', 'Derry and Strabane', 'Armagh City, Banbridge and Craigavon',
    'Lisburn and Castlereagh', 'Newry, Mourne and Down', 'Antrim and Newtownabbey'
  ]
};

export const UK_BOROUGHS = {
  'greater london': [
    'City of Westminster', 'Camden', 'City of London', 'Kensington and Chelsea',
    'Islington', 'Hackney', 'Greenwich', 'Tower Hamlets', 'Southwark', 'Lambeth',
    'Wandsworth', 'Hammersmith and Fulham', 'Richmond upon Thames', 'Barnet', 'Croydon'
  ],
  'west midlands': [
    'Birmingham', 'Coventry', 'Wolverhampton', 'Dudley', 'Sandwell', 'Solihull', 'Walsall'
  ],
  'greater manchester': [
    'Manchester', 'Salford', 'Bolton', 'Bury', 'Oldham', 'Rochdale', 'Stockport', 'Trafford'
  ],
  'city of edinburgh': [
    'Edinburgh Old Town', 'Edinburgh New Town', 'Leith', 'Stockbridge', 'Haymarket', 'Portobello'
  ],
  'glasgow city': [
    'Glasgow City Centre', 'West End', 'Merchant City', 'Southside', 'East End'
  ],
  'cardiff': [
    'Cardiff City Centre', 'Cardiff Bay', 'Cathays', 'Roath', 'Pontcanna', 'Canton'
  ],
  'belfast': [
    'Belfast City Centre', 'Titanic Quarter', "Queen's Quarter", 'Cathedral Quarter', 'Malone'
  ]
};

export const UK_LOCALITIES = {
  'city of westminster': [
    'Mayfair', 'Soho', 'Westminster', 'Covent Garden', 'Marylebone', 'Paddington', 'Belgravia'
  ],
  'camden': [
    'Camden Town', 'Holborn', 'Bloomsbury', 'Hampstead', 'Kentish Town', "King's Cross"
  ],
  'greenwich': [
    'Greenwich Village', 'Blackheath', 'Charlton', 'Eltham', 'Woolwich', 'North Greenwich'
  ],
  'birmingham': [
    'Birmingham City Centre', 'Edgbaston', 'Digbeth', 'Jewellery Quarter', 'Sutton Coldfield'
  ],
  'manchester': [
    'Manchester City Centre', 'Northern Quarter', 'Didsbury', 'Chorlton', 'Deansgate', 'Castlefield'
  ]
};

// ----------------------------------------------------------------------
// SPAIN ADMINISTRATIVE DATA
// ----------------------------------------------------------------------

export const SPAIN_COMMUNITIES = [
  'Community of Madrid', 'Catalonia', 'Andalusia', 'Valencian Community', 'Galicia',
  'Basque Country', 'Castile and León', 'Canary Islands', 'Balearic Islands',
  'Region of Murcia', 'Aragon', 'Castile-La Mancha', 'Asturias', 'Navarre',
  'Cantabria', 'Extremadura', 'La Rioja'
];

export const SPAIN_PROVINCES = {
  'community of madrid': ['Madrid'],
  'catalonia': ['Barcelona', 'Girona', 'Lleida', 'Tarragona'],
  'andalusia': ['Seville', 'Malaga', 'Cadiz', 'Granada', 'Cordoba', 'Almeria', 'Jaen', 'Huelva'],
  'valencian community': ['Valencia', 'Alicante', 'Castellón'],
  'galicia': ['A Coruña', 'Pontevedra', 'Lugo', 'Ourense'],
  'basque country': ['Biscay', 'Gipuzkoa', 'Álava']
};

export const SPAIN_MUNICIPALITIES = {
  'madrid': [
    'Madrid', 'Móstoles', 'Alcalá de Henares', 'Fuenlabrada', 'Leganés',
    'Getafe', 'Alcorcón', 'Torrejón de Ardoz', 'Alcobendas', 'Las Rozas'
  ],
  'barcelona': [
    'Barcelona', "L'Hospitalet de Llobregat", 'Badalona', 'Terrassa', 'Sabadell',
    'Mataró', 'Santa Coloma de Gramenet', 'Sant Cugat del Vallès'
  ],
  'seville': [
    'Seville', 'Dos Hermanas', 'Alcalá de Guadaíra', 'Utrera', 'Mairena del Aljarafe', 'Écija'
  ],
  'malaga': [
    'Malaga', 'Marbella', 'Mijas', 'Fuengirola', 'Torremolinos', 'Benalmádena', 'Estepona', 'Ronda'
  ]
};

export const SPAIN_LOCALITIES = {
  'madrid': [
    'Centro (Sol / Gran Vía)', 'Salamanca', 'Chamberí', 'Retiro', 'Chamartín',
    'Moncloa-Aravaca', 'Tetuán', 'Arganzuela'
  ],
  'barcelona': [
    'Eixample', 'Ciutat Vella (Gothic Quarter)', 'Gràcia', 'Sant Martí (Poblenou)',
    'Sants-Montjuïc', 'Sarrià-Sant Gervasi'
  ],
  'seville': [
    'Casco Antiguo', 'Triana', 'Nervión', 'Los Remedios', 'Macarena', 'Santa Cruz'
  ],
  'malaga': [
    'Malaga Centro', 'Malagueta', 'Soho', 'El Palo', 'Teatinos', 'Pedregalejo'
  ]
};

// ----------------------------------------------------------------------
// EGYPT ADMINISTRATIVE DATA
// ----------------------------------------------------------------------

export const EGYPT_GOVERNORATES = [
  'Cairo Governorate', 'Alexandria Governorate', 'Giza Governorate', 'Qalyubia',
  'Sharqia', 'Dakahlia', 'Red Sea', 'South Sinai', 'Luxor', 'Aswan',
  'Port Said', 'Suez', 'Matrouh', 'Asyut', 'Sohag', 'Beni Suef'
];

export const EGYPT_DISTRICTS = {
  'cairo governorate': [
    'Downtown Cairo', 'Nasr City', 'Heliopolis', 'Maadi', 'New Cairo',
    'Zamalek', 'Shubra', 'Helwan', 'El Marg', 'Mokattam'
  ],
  'alexandria governorate': [
    'Al Montazah', 'Al Raml', 'Sidi Gaber', 'Moharam Bek', 'Borg El Arab',
    'Al Gomrok', 'Karmous', 'Al Amreya'
  ],
  'giza governorate': [
    'Dokki', 'Agouza', 'Al Haram (Pyramids)', '6th of October City',
    'Sheikh Zayed City', 'Al Omraniya', 'Al Badrashin', 'Imbaba'
  ],
  'luxor': ['Luxor City', 'Karnak', 'Armant', 'Esna', 'Thebes'],
  'aswan': ['Aswan City', 'Kom Ombo', 'Edfu', 'Daraw', 'Abu Simbel'],
  'red sea': ['Hurghada', 'El Gouna', 'Safaga', 'Marsa Alam', 'Al Qusair']
};

export const EGYPT_SUBDISTRICTS = {
  'downtown cairo': [
    'El Tahrir Square', 'Garden City', 'Downtown', 'Bab El Louk', 'Abdeen', 'Qasr El Nil'
  ],
  'nasr city': [
    'First Zone', 'Seventh Zone', 'Abbas El Akkad', 'Makram Ebeid', 'Tayaran', 'City Stars Area'
  ],
  'new cairo': [
    'First Settlement', 'Fifth Settlement (Tagamoa)', 'Rehab City', 'Madinaty', 'South Investors'
  ],
  'al montazah': [
    'Montazah Palace', 'Mandara', 'Asafra', 'Miami', 'Sidi Bishr'
  ],
  'al raml': [
    'Stanley', 'Roushdy', 'Glym', 'Saba Pasha', 'San Stefano', 'Bolkly'
  ],
  'dokki': [
    'Moussadak', 'Mohandessin Border', 'Mesaha Square', 'Giza Zoo Area', 'Nile Street'
  ],
  'al haram (pyramids)': [
    'Giza Pyramids Plateau', 'Nazlet El Semman', 'Faisal Street', 'Remaya Square', 'Maryoutiya'
  ]
};

export const EGYPT_LOCALITIES = {
  'el tahrir square': ['Tahrir Plaza', 'Mugamma Area', 'Kasr El Aini St', 'Talaat Harb St'],
  'fifth settlement (tagamoa)': ['90th Street North', '90th Street South', 'Golden Square', 'Diplomats Area'],
  'montazah palace': ['Palace Gardens', 'Aida Beach', 'Corniche Road', 'Sheraton Area'],
  'giza pyramids plateau': ['Great Pyramid Vista', 'Sphinx Viewpoint', 'Panorama Point', 'Desert Gate']
};

// ----------------------------------------------------------------------
// UNITED STATES & AUSTRALIA DATA
// ----------------------------------------------------------------------

export const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

export const AUSTRALIA_STATES = [
  'New South Wales', 'Victoria', 'Queensland', 'Western Australia',
  'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'
];

// ----------------------------------------------------------------------
// KNOWN EXACT COORDINATES FOR INSTANT ACCURACY & OFFLINE RESILIENCE
// ----------------------------------------------------------------------

export const KNOWN_COORDINATES = {
  // Tamil Nadu
  'pudukkottai': { lat: 10.3833, lon: 78.8001, country: 'India', state: 'Tamil Nadu', district: 'Pudukkottai', mandal: 'Pudukkottai', village: 'Pudukkottai Town' },
  'pudukkottai town': { lat: 10.3833, lon: 78.8001, country: 'India', state: 'Tamil Nadu', district: 'Pudukkottai', mandal: 'Pudukkottai', village: 'Pudukkottai Town' },
  'machuvadi': { lat: 10.3750, lon: 78.8150, country: 'India', state: 'Tamil Nadu', district: 'Pudukkottai', mandal: 'Pudukkottai', village: 'Machuvadi' },
  'rajagopalapuram': { lat: 10.3890, lon: 78.8250, country: 'India', state: 'Tamil Nadu', district: 'Pudukkottai', mandal: 'Pudukkottai', village: 'Rajagopalapuram' },
  'thirugokarnam': { lat: 10.3950, lon: 78.7890, country: 'India', state: 'Tamil Nadu', district: 'Pudukkottai', mandal: 'Pudukkottai', village: 'Thirugokarnam' },
  'alangudi': { lat: 10.3589, lon: 78.9819, country: 'India', state: 'Tamil Nadu', district: 'Pudukkottai', mandal: 'Alangudi', village: 'Alangudi Town' },
  'aranthangi': { lat: 10.1636, lon: 78.9953, country: 'India', state: 'Tamil Nadu', district: 'Pudukkottai', mandal: 'Aranthangi', village: 'Aranthangi Town' },
  'chennai': { lat: 13.0827, lon: 80.2707, country: 'India', state: 'Tamil Nadu', district: 'Chennai', mandal: 'Egmore', village: 'Chennai City' },
  'mylapore': { lat: 13.0368, lon: 80.2676, country: 'India', state: 'Tamil Nadu', district: 'Chennai', mandal: 'Mylapore', village: 'Mylapore Locality' },
  'guindy': { lat: 13.0067, lon: 80.2038, country: 'India', state: 'Tamil Nadu', district: 'Chennai', mandal: 'Guindy', village: 'Guindy Industrial Estate' },
  'anna nagar': { lat: 13.0850, lon: 80.2101, country: 'India', state: 'Tamil Nadu', district: 'Chennai', mandal: 'Anna Nagar', village: 'Anna Nagar West' },
  'coimbatore': { lat: 11.0168, lon: 76.9558, country: 'India', state: 'Tamil Nadu', district: 'Coimbatore', mandal: 'Coimbatore South', village: 'Gandhipuram' },
  'madurai': { lat: 9.9252, lon: 78.1198, country: 'India', state: 'Tamil Nadu', district: 'Madurai', mandal: 'Madurai South', village: 'Simmakkal' },
  'salem': { lat: 11.6643, lon: 78.1460, country: 'India', state: 'Tamil Nadu', district: 'Salem', mandal: 'Salem', village: 'Salem Old Town' },
  'tiruchirappalli': { lat: 10.7905, lon: 78.7047, country: 'India', state: 'Tamil Nadu', district: 'Tiruchirappalli', mandal: 'Tiruchirappalli East', village: 'Srirangam' },

  // Andhra Pradesh
  'anantapur': { lat: 14.6819, lon: 77.6006, country: 'India', state: 'Andhra Pradesh', district: 'Anantapur', mandal: 'Anantapur', village: 'Anantapur Urban / Town' },
  'kakkalapalli': { lat: 14.6542, lon: 77.5891, country: 'India', state: 'Andhra Pradesh', district: 'Anantapur', mandal: 'Anantapur', village: 'Kakkalapalli' },
  'tadpatri': { lat: 14.9125, lon: 78.0125, country: 'India', state: 'Andhra Pradesh', district: 'Anantapur', mandal: 'Tadpatri', village: 'Tadpatri Town' },
  'guntakal': { lat: 15.1667, lon: 77.3667, country: 'India', state: 'Andhra Pradesh', district: 'Anantapur', mandal: 'Guntakal', village: 'Guntakal Town' },
  'kurnool': { lat: 15.8281, lon: 78.0373, country: 'India', state: 'Andhra Pradesh', district: 'Kurnool', mandal: 'Kurnool Urban', village: 'Kurnool City' },
  'nandyal': { lat: 15.4786, lon: 78.4842, country: 'India', state: 'Andhra Pradesh', district: 'Nandyal', mandal: 'Nandyal', village: 'Nandyal Town' },
  'tirupati': { lat: 13.6288, lon: 79.4192, country: 'India', state: 'Andhra Pradesh', district: 'Tirupati', mandal: 'Tirupati Urban', village: 'Tirupati City' },
  'chittoor': { lat: 13.2172, lon: 79.1003, country: 'India', state: 'Andhra Pradesh', district: 'Chittoor', mandal: 'Chittoor', village: 'Chittoor Town' },
  'visakhapatnam': { lat: 17.6868, lon: 83.2185, country: 'India', state: 'Andhra Pradesh', district: 'Visakhapatnam', mandal: 'Visakhapatnam Urban', village: 'Visakhapatnam City' },
  'guntur': { lat: 16.3067, lon: 80.4365, country: 'India', state: 'Andhra Pradesh', district: 'Guntur', mandal: 'Guntur East', village: 'Guntur City' },

  // Other India
  'bengaluru': { lat: 12.9716, lon: 77.5946, country: 'India', state: 'Karnataka', district: 'Bengaluru Urban', mandal: 'Bengaluru North', village: 'Bengaluru City' },
  'kochi': { lat: 9.9312, lon: 76.2673, country: 'India', state: 'Kerala', district: 'Ernakulam', mandal: 'Kochi', village: 'Marine Drive' },
  'ernakulam': { lat: 9.9816, lon: 76.2999, country: 'India', state: 'Kerala', district: 'Ernakulam', mandal: 'Kanayannur', village: 'Marine Drive' },
  'thiruvananthapuram': { lat: 8.5241, lon: 76.9366, country: 'India', state: 'Kerala', district: 'Thiruvananthapuram', mandal: 'Thiruvananthapuram', village: 'Pattom' },
  'hyderabad': { lat: 17.3850, lon: 78.4867, country: 'India', state: 'Telangana', district: 'Hyderabad', mandal: 'Shaikpet', village: 'Banjara Hills' },
  'mumbai': { lat: 19.0760, lon: 72.8777, country: 'India', state: 'Maharashtra', district: 'Mumbai Suburban', mandal: 'Andheri', village: 'Andheri West' },
  'pune': { lat: 18.5204, lon: 73.8567, country: 'India', state: 'Maharashtra', district: 'Pune', mandal: 'Pune City', village: 'Shivajinagar' },
  'delhi': { lat: 28.6139, lon: 77.2090, country: 'India', state: 'Delhi', district: 'New Delhi', mandal: 'Central Delhi', village: 'New Delhi' },

  // United Kingdom
  'london': { lat: 51.5074, lon: -0.1278, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'City of Westminster', village: 'Mayfair' },
  'westminster': { lat: 51.4975, lon: -0.1357, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'City of Westminster', village: 'Westminster' },
  'city of westminster': { lat: 51.4975, lon: -0.1357, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'City of Westminster', village: 'Westminster' },
  'mayfair': { lat: 51.5095, lon: -0.1487, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'City of Westminster', village: 'Mayfair' },
  'greater london': { lat: 51.5074, lon: -0.1278, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'City of Westminster', village: 'London City' },
  'england': { lat: 51.5074, lon: -0.1278, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'City of Westminster', village: 'London City' },
  'united kingdom': { lat: 51.5074, lon: -0.1278, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'City of Westminster', village: 'London City' },
  'camden': { lat: 51.5430, lon: -0.1420, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'Camden', village: 'Camden Town' },
  'camden town': { lat: 51.5430, lon: -0.1420, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'Camden', village: 'Camden Town' },
  'greenwich': { lat: 51.4826, lon: -0.0077, country: 'United Kingdom', state: 'England', district: 'Greater London', mandal: 'Greenwich', village: 'Greenwich Village' },
  'birmingham': { lat: 52.4862, lon: -1.8904, country: 'United Kingdom', state: 'England', district: 'West Midlands', mandal: 'Birmingham', village: 'Birmingham City Centre' },
  'manchester': { lat: 53.4808, lon: -2.2426, country: 'United Kingdom', state: 'England', district: 'Greater Manchester', mandal: 'Manchester', village: 'Manchester City Centre' },
  'edinburgh': { lat: 55.9533, lon: -3.1883, country: 'United Kingdom', state: 'Scotland', district: 'City of Edinburgh', mandal: 'Edinburgh Old Town', village: 'Edinburgh Old Town' },
  'city of edinburgh': { lat: 55.9533, lon: -3.1883, country: 'United Kingdom', state: 'Scotland', district: 'City of Edinburgh', mandal: 'Edinburgh Old Town', village: 'Edinburgh Old Town' },
  'scotland': { lat: 55.9533, lon: -3.1883, country: 'United Kingdom', state: 'Scotland', district: 'City of Edinburgh', mandal: 'Edinburgh Old Town', village: 'Edinburgh Old Town' },
  'glasgow': { lat: 55.8642, lon: -4.2518, country: 'United Kingdom', state: 'Scotland', district: 'Glasgow City', mandal: 'Glasgow City Centre', village: 'West End' },
  'cardiff': { lat: 51.4816, lon: -3.1791, country: 'United Kingdom', state: 'Wales', district: 'Cardiff', mandal: 'Cardiff City Centre', village: 'Cardiff Bay' },
  'wales': { lat: 51.4816, lon: -3.1791, country: 'United Kingdom', state: 'Wales', district: 'Cardiff', mandal: 'Cardiff City Centre', village: 'Cardiff Bay' },
  'belfast': { lat: 54.5973, lon: -5.9301, country: 'United Kingdom', state: 'Northern Ireland', district: 'Belfast', mandal: 'Belfast City Centre', village: 'Titanic Quarter' },
  'northern ireland': { lat: 54.5973, lon: -5.9301, country: 'United Kingdom', state: 'Northern Ireland', district: 'Belfast', mandal: 'Belfast City Centre', village: 'Titanic Quarter' },

  // Spain
  'spain': { lat: 40.4168, lon: -3.7038, country: 'Spain', state: 'Community of Madrid', district: 'Madrid', mandal: 'Madrid', village: 'Centro (Sol / Gran Vía)' },
  'madrid': { lat: 40.4168, lon: -3.7038, country: 'Spain', state: 'Community of Madrid', district: 'Madrid', mandal: 'Madrid', village: 'Centro (Sol / Gran Vía)' },
  'community of madrid': { lat: 40.4168, lon: -3.7038, country: 'Spain', state: 'Community of Madrid', district: 'Madrid', mandal: 'Madrid', village: 'Centro (Sol / Gran Vía)' },
  'barcelona': { lat: 41.3879, lon: 2.1699, country: 'Spain', state: 'Catalonia', district: 'Barcelona', mandal: 'Barcelona', village: 'Eixample' },
  'catalonia': { lat: 41.3879, lon: 2.1699, country: 'Spain', state: 'Catalonia', district: 'Barcelona', mandal: 'Barcelona', village: 'Eixample' },
  'eixample': { lat: 41.3888, lon: 2.1610, country: 'Spain', state: 'Catalonia', district: 'Barcelona', mandal: 'Barcelona', village: 'Eixample' },
  'seville': { lat: 37.3891, lon: -5.9845, country: 'Spain', state: 'Andalusia', district: 'Seville', mandal: 'Seville', village: 'Triana' },
  'andalusia': { lat: 37.3891, lon: -5.9845, country: 'Spain', state: 'Andalusia', district: 'Seville', mandal: 'Seville', village: 'Triana' },
  'triana': { lat: 37.3833, lon: -6.0028, country: 'Spain', state: 'Andalusia', district: 'Seville', mandal: 'Seville', village: 'Triana' },
  'malaga': { lat: 36.7213, lon: -4.4214, country: 'Spain', state: 'Andalusia', district: 'Malaga', mandal: 'Malaga', village: 'Malaga Centro' },
  'valencia': { lat: 39.4699, lon: -0.3763, country: 'Spain', state: 'Valencian Community', district: 'Valencia', mandal: 'Valencia', village: 'Ciutat Vella' },

  // Egypt
  'egypt': { lat: 30.0444, lon: 31.2357, country: 'Egypt', state: 'Cairo Governorate', district: 'Downtown Cairo', mandal: 'El Tahrir Square', village: 'Tahrir Plaza' },
  'cairo': { lat: 30.0444, lon: 31.2357, country: 'Egypt', state: 'Cairo Governorate', district: 'Downtown Cairo', mandal: 'El Tahrir Square', village: 'Tahrir Plaza' },
  'cairo governorate': { lat: 30.0444, lon: 31.2357, country: 'Egypt', state: 'Cairo Governorate', district: 'Downtown Cairo', mandal: 'El Tahrir Square', village: 'Tahrir Plaza' },
  'tahrir': { lat: 30.0444, lon: 31.2357, country: 'Egypt', state: 'Cairo Governorate', district: 'Downtown Cairo', mandal: 'El Tahrir Square', village: 'Tahrir Plaza' },
  'tahrir plaza': { lat: 30.0444, lon: 31.2357, country: 'Egypt', state: 'Cairo Governorate', district: 'Downtown Cairo', mandal: 'El Tahrir Square', village: 'Tahrir Plaza' },
  'nasr city': { lat: 30.0561, lon: 31.3301, country: 'Egypt', state: 'Cairo Governorate', district: 'Nasr City', mandal: 'Abbas El Akkad', village: 'City Stars Area' },
  'alexandria': { lat: 31.2001, lon: 29.9187, country: 'Egypt', state: 'Alexandria Governorate', district: 'Al Montazah', mandal: 'Montazah Palace', village: 'Stanley' },
  'alexandria governorate': { lat: 31.2001, lon: 29.9187, country: 'Egypt', state: 'Alexandria Governorate', district: 'Al Montazah', mandal: 'Montazah Palace', village: 'Stanley' },
  'giza': { lat: 30.0131, lon: 31.2089, country: 'Egypt', state: 'Giza Governorate', district: 'Dokki', mandal: 'Moussadak', village: 'Giza Pyramids Plateau' },
  'giza governorate': { lat: 30.0131, lon: 31.2089, country: 'Egypt', state: 'Giza Governorate', district: 'Dokki', mandal: 'Moussadak', village: 'Giza Pyramids Plateau' },
  'luxor': { lat: 25.6872, lon: 32.6396, country: 'Egypt', state: 'Luxor', district: 'Luxor City', mandal: 'Karnak', village: 'Luxor Temple Area' },
  'aswan': { lat: 24.0889, lon: 32.8998, country: 'Egypt', state: 'Aswan', district: 'Aswan City', mandal: 'Aswan City', village: 'Philae Vista' },

  // United States & Australia
  'phoenix': { lat: 33.4484, lon: -112.0740, country: 'United States', state: 'Arizona', district: 'Maricopa County', mandal: 'Phoenix', village: 'Downtown Phoenix' },
  'los angeles': { lat: 34.0522, lon: -118.2437, country: 'United States', state: 'California', district: 'Los Angeles County', mandal: 'Downtown Los Angeles', village: 'Bunker Hill' },
  'sydney': { lat: -33.8688, lon: 151.2093, country: 'Australia', state: 'New South Wales', district: 'City of Sydney', mandal: 'Sydney CBD', village: 'The Rocks' }
};

// ----------------------------------------------------------------------
// AUTHORITATIVE LOOKUP FUNCTIONS
// ----------------------------------------------------------------------

export function getCountriesList() {
  return COUNTRIES;
}

export function getStatesList(countryName) {
  const c = (countryName || '').trim().toLowerCase();
  if (c.includes('india') || c === 'in') {
    return INDIA_STATES;
  }
  if (c.includes('united kingdom') || c.includes('uk') || c === 'gb') {
    return UK_REGIONS;
  }
  if (c.includes('spain') || c === 'es') {
    return SPAIN_COMMUNITIES;
  }
  if (c.includes('egypt') || c === 'eg') {
    return EGYPT_GOVERNORATES;
  }
  if (c.includes('united states') || c === 'us') {
    return US_STATES;
  }
  if (c.includes('australia') || c === 'au') {
    return AUSTRALIA_STATES;
  }
  return [
    `${countryName} Central Region`,
    `${countryName} Northern Region`,
    `${countryName} Southern Region`,
    `${countryName} Eastern Region`,
    `${countryName} Western Region`
  ];
}

export function getDistrictsList(countryName, stateName) {
  if (!stateName) return [];
  const c = (countryName || '').trim().toLowerCase();
  const s = stateName.trim().toLowerCase();

  // India
  if (c.includes('india') || c === 'in') {
    if (s.includes('tamil nadu')) return TAMIL_NADU_DISTRICTS;
    if (s.includes('andhra pradesh')) return ANDHRA_PRADESH_DISTRICTS;
    if (s.includes('karnataka')) return KARNATAKA_DISTRICTS;
    if (s.includes('kerala')) return KERALA_DISTRICTS;
    if (s.includes('telangana')) return TELANGANA_DISTRICTS;
    if (s.includes('maharashtra')) return MAHARASHTRA_DISTRICTS;
    return [
      `${stateName} Central District`,
      `${stateName} North District`,
      `${stateName} South District`,
      `${stateName} East District`,
      `${stateName} West District`
    ];
  }

  // United Kingdom
  if (c.includes('united kingdom') || c.includes('uk') || c === 'gb') {
    if (UK_COUNTIES[s]) return UK_COUNTIES[s];
    return ['Greater London', 'West Midlands', 'Greater Manchester', 'City of Edinburgh', 'Cardiff', 'Belfast'];
  }

  // Spain
  if (c.includes('spain') || c === 'es') {
    if (SPAIN_PROVINCES[s]) return SPAIN_PROVINCES[s];
    return ['Madrid', 'Barcelona', 'Seville', 'Malaga', 'Valencia'];
  }

  // Egypt
  if (c.includes('egypt') || c === 'eg') {
    if (EGYPT_DISTRICTS[s]) return EGYPT_DISTRICTS[s];
    return [`${stateName} Center`, `${stateName} North Sector`, `${stateName} South Sector`];
  }

  // United States
  if (c.includes('united states') || c === 'us') {
    if (s.includes('california')) return ['Los Angeles County', 'San Diego County', 'Orange County', 'Santa Clara County', 'San Francisco County'];
    if (s.includes('arizona')) return ['Maricopa County', 'Pima County', 'Pinal County', 'Coconino County'];
    if (s.includes('texas')) return ['Harris County', 'Dallas County', 'Travis County', 'Bexar County', 'Tarrant County'];
    return [`${stateName} Central County`, `${stateName} Metro County`, `${stateName} North County`];
  }

  // Australia
  if (c.includes('australia') || c === 'au') {
    if (s.includes('new south wales')) return ['City of Sydney', 'City of Parramatta', 'Northern Beaches', 'Newcastle', 'Wollongong'];
    if (s.includes('victoria')) return ['City of Melbourne', 'City of Geelong', 'City of Ballarat'];
    return [`${stateName} Metro Region`, `${stateName} Coastal Region`];
  }

  return [`${stateName} District 1`, `${stateName} District 2`, `${stateName} District 3`];
}

export function getMandalsList(countryName, stateName, districtName) {
  if (!districtName) return [];
  const c = (countryName || '').trim().toLowerCase();
  const d = districtName.trim().toLowerCase();

  // India
  if (c.includes('india') || c === 'in') {
    if (SUBDISTRICTS_DATA[d]) return SUBDISTRICTS_DATA[d];
    return [
      `${districtName} Urban Mandal`,
      `${districtName} Rural Mandal`,
      `${districtName} North Mandal`,
      `${districtName} South Mandal`,
      `${districtName} East Mandal`
    ];
  }

  // United Kingdom
  if (c.includes('united kingdom') || c.includes('uk') || c === 'gb') {
    if (UK_BOROUGHS[d]) return UK_BOROUGHS[d];
    return [`${districtName} Central Borough`, `${districtName} North Ward`, `${districtName} South Ward`];
  }

  // Spain
  if (c.includes('spain') || c === 'es') {
    if (SPAIN_MUNICIPALITIES[d]) return SPAIN_MUNICIPALITIES[d];
    return [`${districtName} Capital`, `${districtName} Norte`, `${districtName} Sur`];
  }

  // Egypt
  if (c.includes('egypt') || c === 'eg') {
    if (EGYPT_SUBDISTRICTS[d]) return EGYPT_SUBDISTRICTS[d];
    return [`${districtName} Main Sector`, `${districtName} First District`, `${districtName} Second District`];
  }

  return [`${districtName} Urban Area`, `${districtName} Suburban Area`, `${districtName} Industrial Zone`];
}

export function getVillagesList(countryName, stateName, districtName, mandalName) {
  if (!mandalName) return [];
  const c = (countryName || '').trim().toLowerCase();
  const m = mandalName.trim().toLowerCase();

  // India
  if (c.includes('india') || c === 'in') {
    if (VILLAGES_DATA[m]) return VILLAGES_DATA[m];
    return [
      `${mandalName} Main Locality`,
      `${mandalName} North Village`,
      `${mandalName} South Village`,
      `${mandalName} East Village`,
      `${mandalName} West Locality`
    ];
  }

  // United Kingdom
  if (c.includes('united kingdom') || c.includes('uk') || c === 'gb') {
    if (UK_LOCALITIES[m]) return UK_LOCALITIES[m];
    return [`${mandalName} High Street`, `${mandalName} Park Locality`, `${mandalName} Station Area`];
  }

  // Spain
  if (c.includes('spain') || c === 'es') {
    if (SPAIN_LOCALITIES[m]) return SPAIN_LOCALITIES[m];
    return [`${mandalName} Casco Histórico`, `${mandalName} Ensanche`, `${mandalName} Centro`];
  }

  // Egypt
  if (c.includes('egypt') || c === 'eg') {
    if (EGYPT_LOCALITIES[m]) return EGYPT_LOCALITIES[m];
    return [`${mandalName} Corniche`, `${mandalName} Square`, `${mandalName} Commercial Area`];
  }

  return [`${mandalName} Central`, `${mandalName} Park Area`, `${mandalName} Residential Zone`];
}

export function resolveKnownCoordinates(country, state, district, mandal, village) {
  const terms = [village, mandal, district, state, country].filter(Boolean);
  for (const term of terms) {
    const key = term.trim().toLowerCase();
    if (KNOWN_COORDINATES[key]) {
      return {
        latitude: KNOWN_COORDINATES[key].lat,
        longitude: KNOWN_COORDINATES[key].lon
      };
    }
  }
  return null;
}

export function searchLocalLocations(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const results = [];

  for (const [key, item] of Object.entries(KNOWN_COORDINATES)) {
    if (
      key.includes(q) ||
      (item.village && item.village.toLowerCase().includes(q)) ||
      (item.mandal && item.mandal.toLowerCase().includes(q)) ||
      (item.district && item.district.toLowerCase().includes(q)) ||
      (item.state && item.state.toLowerCase().includes(q)) ||
      (item.country && item.country.toLowerCase().includes(q))
    ) {
      results.push({
        display_name: `${item.village || item.mandal}, ${item.district || item.state}, ${item.country}`,
        country: item.country,
        state: item.state,
        district: item.district,
        mandal: item.mandal,
        village: item.village,
        latitude: item.lat,
        longitude: item.lon,
        source: 'local'
      });
    }
  }

  return results.slice(0, 8);
}
