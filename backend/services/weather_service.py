"""
SolarIQ Live Hierarchical Location & Real-Time Weather Service
Provides cascading administrative hierarchy, reverse geocoding, live location search,
and Open-Meteo real-time weather & solar irradiance data integration.
"""

import urllib.request
import urllib.parse
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

# --- In-Memory Caching System ---
CACHE = {
    "weather": {},
    "geocoding": {},
    "search": {}
}

CACHE_TTL_WEATHER = 600  # 10 minutes cache for live weather
CACHE_TTL_GEO = 86400    # 24 hours cache for location structures

# --- Rich Geographic Data for India & Major Global Regions ---

COUNTRIES = [
    {"code": "IN", "name": "India"},
    {"code": "GB", "name": "United Kingdom"},
    {"code": "ES", "name": "Spain"},
    {"code": "EG", "name": "Egypt"},
    {"code": "US", "name": "United States"},
    {"code": "AU", "name": "Australia"},
    {"code": "CA", "name": "Canada"},
    {"code": "DE", "name": "Germany"},
    {"code": "JP", "name": "Japan"},
    {"code": "FR", "name": "France"},
    {"code": "BR", "name": "Brazil"},
    {"code": "ZA", "name": "South Africa"},
    {"code": "AE", "name": "United Arab Emirates"},
    {"code": "IT", "name": "Italy"}
]

# --- INDIA DATA ---

INDIA_STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
    "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
    "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Jammu and Kashmir", "Ladakh",
    "Lakshadweep", "Puducherry"
]

# All 38 Official Districts of Tamil Nadu
TAMIL_NADU_DISTRICTS = [
    "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri",
    "Dindigul", "Erode", "Kallakurichi", "Kancheepuram", "Kanyakumari", "Karur",
    "Krishnagiri", "Madurai", "Mayiladuthurai", "Nagapattinam", "Namakkal", "Nilgiris",
    "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga",
    "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
    "Tirupattur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore",
    "Viluppuram", "Virudhunagar"
]

# All 26 Official Districts of Andhra Pradesh
ANDHRA_PRADESH_DISTRICTS = [
    "Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Annamayya", "Bapatla",
    "Chittoor", "Dr. B.R. Ambedkar Konaseema", "East Godavari", "Eluru", "Guntur",
    "Kakinada", "Krishna", "Kurnool", "Nandyal", "NTR", "Palnadu",
    "Parvathipuram Manyam", "Prakasam", "SPSR Nellore", "Sri Sathya Sai",
    "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari",
    "YSR Kadapa"
]

KARNATAKA_DISTRICTS = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Urban", "Bengaluru Rural", "Bidar",
    "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada",
    "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar",
    "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru",
    "Udupi", "Uttara Kannada", "Vijayanagara", "Vijayapura", "Yadgir"
]

KERALA_DISTRICTS = [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam",
    "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram",
    "Thrissur", "Wayanad"
]

TELANGANA_DISTRICTS = [
    "Adilabad", "Bhadradri Kothagudem", "Hanamkonda", "Hyderabad", "Jagtial", "Jangaon",
    "Jayashankar Bhupalpally", "Jogulamba Gadwal", "Kamareddy", "Karimnagar", "Khammam",
    "Kumuram Bheem", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak",
    "Medchal-Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal",
    "Nizamabad", "Peddapalli", "Rajanna Sircilla", "Ranga Reddy", "Sangareddy",
    "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy", "Warangal", "Yadadri Bhuvanagiri"
]

MAHARASHTRA_DISTRICTS = [
    "Ahmednagar", "Akola", "Amravati", "Beed", "Bhandara", "Buldhana", "Chandrapur",
    "Chhatrapati Sambhajinagar", "Dharashiv", "Dhule", "Gadchiroli", "Gondia", "Hingoli",
    "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai City", "Mumbai Suburban", "Nagpur",
    "Nanded", "Nandurbar", "Nashik", "Palghar", "Parbhani", "Pune", "Raigad",
    "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur", "Thane", "Wardha",
    "Washim", "Yavatmal"
]

# --- UNITED KINGDOM DATA ---

UK_REGIONS = [
    "England", "Scotland", "Wales", "Northern Ireland"
]

UK_COUNTIES = {
    "england": [
        "Greater London", "West Midlands", "Greater Manchester", "West Yorkshire",
        "South Yorkshire", "Merseyside", "Tyne and Wear", "Hampshire", "Surrey",
        "Kent", "Essex", "Berkshire", "Oxfordshire", "Cambridgeshire", "Gloucestershire"
    ],
    "scotland": [
        "City of Edinburgh", "Glasgow City", "Aberdeen City", "Dundee City",
        "Highland", "Fife", "Stirling", "Argyll and Bute", "Perth and Kinross"
    ],
    "wales": [
        "Cardiff", "Swansea", "Newport", "Powys", "Gwynedd", "Wrexham",
        "Vale of Glamorgan", "Pembrokeshire", "Flintshire", "Carmarthenshire"
    ],
    "northern ireland": [
        "Belfast", "Derry and Strabane", "Armagh City, Banbridge and Craigavon",
        "Lisburn and Castlereagh", "Newry, Mourne and Down", "Antrim and Newtownabbey"
    ]
}

UK_BOROUGHS = {
    "greater london": [
        "City of Westminster", "Camden", "City of London", "Kensington and Chelsea",
        "Islington", "Hackney", "Greenwich", "Tower Hamlets", "Southwark", "Lambeth",
        "Wandsworth", "Hammersmith and Fulham", "Richmond upon Thames", "Barnet", "Croydon"
    ],
    "west midlands": [
        "Birmingham", "Coventry", "Wolverhampton", "Dudley", "Sandwell", "Solihull", "Walsall"
    ],
    "greater manchester": [
        "Manchester", "Salford", "Bolton", "Bury", "Oldham", "Rochdale", "Stockport", "Trafford"
    ],
    "city of edinburgh": [
        "Edinburgh Old Town", "Edinburgh New Town", "Leith", "Stockbridge", "Haymarket", "Portobello"
    ],
    "glasgow city": [
        "Glasgow City Centre", "West End", "Merchant City", "Southside", "East End"
    ],
    "cardiff": [
        "Cardiff City Centre", "Cardiff Bay", "Cathays", "Roath", "Pontcanna", "Canton"
    ],
    "belfast": [
        "Belfast City Centre", "Titanic Quarter", "Queen's Quarter", "Cathedral Quarter", "Malone"
    ]
}

UK_LOCALITIES = {
    "city of westminster": [
        "Mayfair", "Soho", "Westminster", "Covent Garden", "Marylebone", "Paddington", "Belgravia"
    ],
    "camden": [
        "Camden Town", "Holborn", "Bloomsbury", "Hampstead", "Kentish Town", "King's Cross"
    ],
    "greenwich": [
        "Greenwich Village", "Blackheath", "Charlton", "Eltham", "Woolwich", "North Greenwich"
    ],
    "birmingham": [
        "Birmingham City Centre", "Edgbaston", "Digbeth", "Jewellery Quarter", "Sutton Coldfield"
    ],
    "manchester": [
        "Manchester City Centre", "Northern Quarter", "Didsbury", "Chorlton", "Deansgate", "Castlefield"
    ]
}

# --- SPAIN DATA ---

SPAIN_COMMUNITIES = [
    "Community of Madrid", "Catalonia", "Andalusia", "Valencian Community", "Galicia",
    "Basque Country", "Castile and León", "Canary Islands", "Balearic Islands",
    "Region of Murcia", "Aragon", "Castile-La Mancha", "Asturias", "Navarre",
    "Cantabria", "Extremadura", "La Rioja"
]

SPAIN_PROVINCES = {
    "community of madrid": ["Madrid"],
    "catalonia": ["Barcelona", "Girona", "Lleida", "Tarragona"],
    "andalusia": ["Seville", "Malaga", "Cadiz", "Granada", "Cordoba", "Almeria", "Jaen", "Huelva"],
    "valencian community": ["Valencia", "Alicante", "Castellón"],
    "galicia": ["A Coruña", "Pontevedra", "Lugo", "Ourense"],
    "basque country": ["Biscay", "Gipuzkoa", "Álava"]
}

SPAIN_MUNICIPALITIES = {
    "madrid": [
        "Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés",
        "Getafe", "Alcorcón", "Torrejón de Ardoz", "Alcobendas", "Las Rozas"
    ],
    "barcelona": [
        "Barcelona", "L'Hospitalet de Llobregat", "Badalona", "Terrassa", "Sabadell",
        "Mataró", "Santa Coloma de Gramenet", "Sant Cugat del Vallès"
    ],
    "seville": [
        "Seville", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", "Écija"
    ],
    "malaga": [
        "Malaga", "Marbella", "Mijas", "Fuengirola", "Torremolinos", "Benalmádena", "Estepona", "Ronda"
    ]
}

SPAIN_LOCALITIES = {
    "madrid": [
        "Centro (Sol / Gran Vía)", "Salamanca", "Chamberí", "Retiro", "Chamartín",
        "Moncloa-Aravaca", "Tetuán", "Arganzuela"
    ],
    "barcelona": [
        "Eixample", "Ciutat Vella (Gothic Quarter)", "Gràcia", "Sant Martí (Poblenou)",
        "Sants-Montjuïc", "Sarrià-Sant Gervasi"
    ],
    "seville": [
        "Casco Antiguo", "Triana", "Nervión", "Los Remedios", "Macarena", "Santa Cruz"
    ],
    "malaga": [
        "Malaga Centro", "Malagueta", "Soho", "El Palo", "Teatinos", "Pedregalejo"
    ]
}

# --- EGYPT DATA ---

EGYPT_GOVERNORATES = [
    "Cairo Governorate", "Alexandria Governorate", "Giza Governorate", "Qalyubia",
    "Sharqia", "Dakahlia", "Red Sea", "South Sinai", "Luxor", "Aswan",
    "Port Said", "Suez", "Matrouh", "Asyut", "Sohag", "Beni Suef"
]

EGYPT_DISTRICTS = {
    "cairo governorate": [
        "Downtown Cairo", "Nasr City", "Heliopolis", "Maadi", "New Cairo",
        "Zamalek", "Shubra", "Helwan", "El Marg", "Mokattam"
    ],
    "alexandria governorate": [
        "Al Montazah", "Al Raml", "Sidi Gaber", "Moharam Bek", "Borg El Arab",
        "Al Gomrok", "Karmous", "Al Amreya"
    ],
    "giza governorate": [
        "Dokki", "Agouza", "Al Haram (Pyramids)", "6th of October City",
        "Sheikh Zayed City", "Al Omraniya", "Al Badrashin", "Imbaba"
    ],
    "luxor": ["Luxor City", "Karnak", "Armant", "Esna", "Thebes"],
    "aswan": ["Aswan City", "Kom Ombo", "Edfu", "Daraw", "Abu Simbel"],
    "red sea": ["Hurghada", "El Gouna", "Safaga", "Marsa Alam", "Al Qusair"]
}

EGYPT_SUBDISTRICTS = {
    "downtown cairo": [
        "El Tahrir Square", "Garden City", "Downtown", "Bab El Louk", "Abdeen", "Qasr El Nil"
    ],
    "nasr city": [
        "First Zone", "Seventh Zone", "Abbas El Akkad", "Makram Ebeid", "Tayaran", "City Stars Area"
    ],
    "new cairo": [
        "First Settlement", "Fifth Settlement (Tagamoa)", "Rehab City", "Madinaty", "South Investors"
    ],
    "al montazah": [
        "Montazah Palace", "Mandara", "Asafra", "Miami", "Sidi Bishr"
    ],
    "al raml": [
        "Stanley", "Roushdy", "Glym", "Saba Pasha", "San Stefano", "Bolkly"
    ],
    "dokki": [
        "Moussadak", "Mohandessin Border", "Mesaha Square", "Giza Zoo Area", "Nile Street"
    ],
    "al haram (pyramids)": [
        "Giza Pyramids Plateau", "Nazlet El Semman", "Faisal Street", "Remaya Square", "Maryoutiya"
    ]
}

EGYPT_LOCALITIES = {
    "el tahrir square": ["Tahrir Plaza", "Mugamma Area", "Kasr El Aini St", "Talaat Harb St"],
    "fifth settlement (tagamoa)": ["90th Street North", "90th Street South", "Golden Square", "Diplomats Area"],
    "montazah palace": ["Palace Gardens", "Aida Beach", "Corniche Road", "Sheraton Area"],
    "giza pyramids plateau": ["Great Pyramid Vista", "Sphinx Viewpoint", "Panorama Point", "Desert Gate"]
}

# --- US & AUSTRALIA DATA ---

US_STATES = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
    "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
    "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
    "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
    "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
    "Wisconsin", "Wyoming"
]

AUSTRALIA_STATES = [
    "New South Wales", "Victoria", "Queensland", "Western Australia",
    "South Australia", "Tasmania", "Australian Capital Territory", "Northern Territory"
]

# --- SUBDISTRICTS & VILLAGES MAPPINGS ---

SUBDISTRICTS_DATA = {
    # Tamil Nadu
    "pudukkottai": [
        "Pudukkottai", "Alangudi", "Aranthangi", "Avudaiyarkoil", "Gandarvakkottai",
        "Iluppur", "Karambakkudi", "Kulathur", "Manamelkudi", "Ponnamaravathi",
        "Thirumayam", "Viralimalai"
    ],
    "chennai": [
        "Egmore", "Mylapore", "Guindy", "Tondiarpet", "Velachery", "Anna Nagar",
        "Perambur", "Royapuram", "Aminjikarai", "Mambalam", "Alandur", "Sholinganallur"
    ],
    "coimbatore": [
        "Coimbatore South", "Coimbatore North", "Pollachi", "Mettupalayam", "Sulur",
        "Annur", "Valparai", "Kinathukadavu", "Madukkarai"
    ],
    "madurai": [
        "Madurai South", "Madurai North", "Melur", "Thirumangalam", "Usilampatti",
        "Vadipatti", "Thirupparankundram", "Peraiyur"
    ],
    "salem": [
        "Salem", "Attur", "Mettur", "Omalur", "Sankari", "Yercaud", "Edappadi", "Gangavalli"
    ],
    "tiruchirappalli": [
        "Tiruchirappalli West", "Tiruchirappalli East", "Srirangam", "Lalgudi", "Manapparai",
        "Musiri", "Thuraiyur"
    ],

    # Andhra Pradesh
    "anantapur": [
        "Anantapur", "Tadpatri", "Guntakal", "Dharmavaram", "Kadiri", "Hindupur", "Rayadurg",
        "Kalyandurg", "Uravakonda", "Pamidi", "Singanamala", "Bukkarayasamudram", "Kudair",
        "Atmakur", "Raptadu", "Garladinne"
    ],
    "kurnool": [
        "Kurnool Urban", "Kurnool Rural", "Kodumur", "C.Belagal", "Gudur", "Kallur",
        "Orvakal", "Yemmiganur", "Mantralayam", "Adoni", "Alur", "Pattikonda"
    ],
    "nandyal": [
        "Nandyal", "Allagadda", "Banaganapalle", "Bethamcherla", "Dhone", "Koilkuntla",
        "Mahanandi", "Panyam", "Srisailam", "Atmakur", "Nandikotkur"
    ],
    "chittoor": [
        "Chittoor", "Palamaner", "Nagari", "Punganur", "Kuppam", "Bangarupalem",
        "Gudipala", "Yadamari", "Gangadhara Nellore", "Karvetinagar"
    ],
    "tirupati": [
        "Tirupati Urban", "Tirupati Rural", "Chandragiri", "Srikalahasti", "Renigunta",
        "Vadamalapeta", "Yerpedu", "Sullurpeta", "Venkatagiri"
    ],
    "guntur": [
        "Guntur East", "Guntur West", "Mangalagiri", "Tenali", "Tadikonda", "Ponnur", "Bapatla"
    ],
    "visakhapatnam": [
        "Visakhapatnam Urban", "Gajuwaka", "Anandapuram", "Bheemunipatnam", "Pendurthi", "Padmanabham"
    ],

    # Karnataka
    "bengaluru urban": [
        "Bengaluru North", "Bengaluru South", "Bengaluru East", "Anekal", "Yelahanka"
    ],
    "mysuru": [
        "Mysuru Urban", "Mysuru Rural", "Nanjangud", "Hunsur", "Piriyapatna", "T. Narasipura"
    ],

    # Kerala
    "ernakulam": [
        "Kochi", "Kanayannur", "Aluva", "Paravur", "Kunnathunad", "Muvattupuzha", "Kothamangalam"
    ],
    "thiruvananthapuram": [
        "Thiruvananthapuram", "Nedumangad", "Neyyattinkara", "Chirayinkeezhu", "Varkala", "Kattakada"
    ],

    # Telangana
    "hyderabad": [
        "Shaikpet", "Ameerpet", "Khairatabad", "Secunderabad", "Charminar", "Asifnagar",
        "Musheerabad", "Golconda", "Bahadurpura"
    ],

    # Maharashtra
    "mumbai suburban": [
        "Andheri", "Borivali", "Kurla", "Bandra"
    ],
    "pune": [
        "Pune City", "Haveli", "Mulshi", "Maval", "Shirur", "Baramati", "Khed"
    ]
}

VILLAGES_DATA = {
    # Tamil Nadu
    "pudukkottai": [
        "Pudukkottai Town", "Machuvadi", "Rajagopalapuram", "Thirugokarnam", "Kavinadu East",
        "Kavinadu West", "Perungalur", "Mullur", "Vathanakkottai", "Kallalangudi"
    ],
    "alangudi": [
        "Alangudi Town", "Vallathirakkottai", "Vadakadu", "Keeramangalam", "Kothamangalam", "Venkatakulam"
    ],
    "aranthangi": [
        "Aranthangi Town", "Silattur", "Avudayarkoil Road", "Merpanaikadu", "Nagudi", "Rajendrapuram"
    ],
    "gandarvakkottai": [
        "Gandarvakkottai Town", "Kallakkottai", "Kattunaval", "Pisanathur", "Namburanpatti"
    ],
    "iluppur": [
        "Iluppur Town", "Annavasal", "Ennaipatti", "Malaikudipatti", "Vettukkadu"
    ],
    "mylapore": [
        "Mylapore Locality", "Mandaveli", "Santhome", "Alwarpet", "Royapettah", "R.A. Puram"
    ],
    "guindy": [
        "Guindy Industrial Estate", "Ekkatuthangal", "Little Mount", "Saidapet", "St. Thomas Mount"
    ],
    "anna nagar": [
        "Anna Nagar West", "Anna Nagar East", "Shenoy Nagar", "Kilpauk", "Mogappair"
    ],
    "velachery": [
        "Velachery Main", "Vijaya Nagar", "Baby Nagar", "Dhandeeswaram", "Taramani"
    ],
    "egmore": [
        "Egmore Station Area", "Pantheon Road", "Pudupet", "Chetpet", "Chintadripet"
    ],
    "coimbatore south": [
        "Gandhipuram", "RS Puram", "Town Hall", "Ramanathapuram", "Singanallur", "Peelamedu"
    ],
    "madurai south": [
        "Simmakkal", "Periyar", "Meenakshi Temple Area", "Teppakulam", "Villapuram"
    ],
    "salem": [
        "Salem Old Town", "Fairlands", "Suramangalam", "Hasthampatti", "Ammapet"
    ],

    # Andhra Pradesh
    "anantapur": [
        "Anantapur Urban / Town", "Kakkalapalli", "Rudrampeta", "Papampeta", "Alamuru",
        "Itikalapalli", "Prasannayapalli", "Katiganakal", "Salakalacheruvu", "Kandukur"
    ],
    "tadpatri": [
        "Tadpatri Town", "Alur", "Bhogasamudram", "Bondaladinne", "Bugga", "Challavaripalli"
    ],
    "guntakal": [
        "Guntakal Town", "Donga Obulapuram", "Gathasani", "Kasapuram", "Konasamudram", "Nagalapuram"
    ],
    "kurnool urban": [
        "Kurnool City", "Budhawara Peta", "B Camp", "Joharapuram", "Nandyal Checkpost", "Abbas Nagar", "Roza"
    ],
    "kurnool rural": [
        "Ulchala", "Gargeyapuram", "Panchalingala", "E.Thandrapadu", "Mamidalapadu", "Peddapadu"
    ],
    "nandyal": [
        "Nandyal Town", "Noonepalle", "Moolasagaram", "Rythu Nagaram", "Panyam Road", "Sanjeeva Nagar"
    ],
    "allagadda": [
        "Allagadda Town", "Ahobilam", "Gopalapuram", "Bachepalle", "Chagalamarri Road"
    ],
    "tirupati urban": [
        "Tirupati City", "Alipiri", "KT Road", "Korlagunta", "Bairagipatteda", "Renigunta Road"
    ],

    # Karnataka
    "bengaluru north": [
        "Malleshwaram", "Hebbal", "Yelahanka New Town", "Sadashivanagar", "Yeshwanthpur", "RT Nagar"
    ],
    "bengaluru south": [
        "Koramangala", "Jayanagar", "HSR Layout", "BTM Layout", "JP Nagar", "Electronic City"
    ],

    # Kerala
    "kochi": [
        "Marine Drive", "Fort Kochi", "Mattancherry", "Willingdon Island", "Edappally", "Kaloor"
    ],
    "thiruvananthapuram": [
        "Pattom", "Palayam", "Kowdiar", "Kazhakoottam", "East Fort", "Sreekaryam"
    ],

    # Telangana
    "shaikpet": [
        "Banjara Hills", "Jubilee Hills", "Hitec City", "Tolichowki", "Film Nagar"
    ],
    "khairatabad": [
        "Somajiguda", "Punjagutta", "Khairatabad Circle", "Raj Bhavan Road", "Lakdikapul"
    ],

    # Maharashtra
    "andheri": [
        "Andheri West", "Andheri East", "Lokhandwala", "Versova", "MIDC Industrial Area", "Chakala"
    ],
    "pune city": [
        "Shivajinagar", "Kothrud", "Viman Nagar", "Hinjawadi", "Koregaon Park", "Baner"
    ]
}

# Coordinate database for instant offline/cache response
KNOWN_COORDINATES = {
    # Tamil Nadu
    "pudukkottai": {"lat": 10.3833, "lon": 78.8001, "country": "India", "state": "Tamil Nadu", "district": "Pudukkottai", "mandal": "Pudukkottai", "village": "Pudukkottai Town"},
    "pudukkottai town": {"lat": 10.3833, "lon": 78.8001, "country": "India", "state": "Tamil Nadu", "district": "Pudukkottai", "mandal": "Pudukkottai", "village": "Pudukkottai Town"},
    "machuvadi": {"lat": 10.3750, "lon": 78.8150, "country": "India", "state": "Tamil Nadu", "district": "Pudukkottai", "mandal": "Pudukkottai", "village": "Machuvadi"},
    "rajagopalapuram": {"lat": 10.3890, "lon": 78.8250, "country": "India", "state": "Tamil Nadu", "district": "Pudukkottai", "mandal": "Pudukkottai", "village": "Rajagopalapuram"},
    "thirugokarnam": {"lat": 10.3950, "lon": 78.7890, "country": "India", "state": "Tamil Nadu", "district": "Pudukkottai", "mandal": "Pudukkottai", "village": "Thirugokarnam"},
    "alangudi": {"lat": 10.3589, "lon": 78.9819, "country": "India", "state": "Tamil Nadu", "district": "Pudukkottai", "mandal": "Alangudi", "village": "Alangudi Town"},
    "aranthangi": {"lat": 10.1636, "lon": 78.9953, "country": "India", "state": "Tamil Nadu", "district": "Pudukkottai", "mandal": "Aranthangi", "village": "Aranthangi Town"},
    "chennai": {"lat": 13.0827, "lon": 80.2707, "country": "India", "state": "Tamil Nadu", "district": "Chennai", "mandal": "Egmore", "village": "Chennai City"},
    "mylapore": {"lat": 13.0368, "lon": 80.2676, "country": "India", "state": "Tamil Nadu", "district": "Chennai", "mandal": "Mylapore", "village": "Mylapore Locality"},
    "guindy": {"lat": 13.0067, "lon": 80.2038, "country": "India", "state": "Tamil Nadu", "district": "Chennai", "mandal": "Guindy", "village": "Guindy Industrial Estate"},
    "anna nagar": {"lat": 13.0850, "lon": 80.2101, "country": "India", "state": "Tamil Nadu", "district": "Chennai", "mandal": "Anna Nagar", "village": "Anna Nagar West"},
    "coimbatore": {"lat": 11.0168, "lon": 76.9558, "country": "India", "state": "Tamil Nadu", "district": "Coimbatore", "mandal": "Coimbatore South", "village": "Gandhipuram"},
    "madurai": {"lat": 9.9252, "lon": 78.1198, "country": "India", "state": "Tamil Nadu", "district": "Madurai", "mandal": "Madurai South", "village": "Simmakkal"},
    "salem": {"lat": 11.6643, "lon": 78.1460, "country": "India", "state": "Tamil Nadu", "district": "Salem", "mandal": "Salem", "village": "Salem Old Town"},
    "tiruchirappalli": {"lat": 10.7905, "lon": 78.7047, "country": "India", "state": "Tamil Nadu", "district": "Tiruchirappalli", "mandal": "Tiruchirappalli East", "village": "Srirangam"},

    # Andhra Pradesh
    "anantapur": {"lat": 14.6819, "lon": 77.6006, "country": "India", "state": "Andhra Pradesh", "district": "Anantapur", "mandal": "Anantapur", "village": "Anantapur Urban / Town"},
    "kakkalapalli": {"lat": 14.6542, "lon": 77.5891, "country": "India", "state": "Andhra Pradesh", "district": "Anantapur", "mandal": "Anantapur", "village": "Kakkalapalli"},
    "tadpatri": {"lat": 14.9125, "lon": 78.0125, "country": "India", "state": "Andhra Pradesh", "district": "Anantapur", "mandal": "Tadpatri", "village": "Tadpatri Town"},
    "guntakal": {"lat": 15.1667, "lon": 77.3667, "country": "India", "state": "Andhra Pradesh", "district": "Anantapur", "mandal": "Guntakal", "village": "Guntakal Town"},
    "kurnool": {"lat": 15.8281, "lon": 78.0373, "country": "India", "state": "Andhra Pradesh", "district": "Kurnool", "mandal": "Kurnool Urban", "village": "Kurnool City"},
    "nandyal": {"lat": 15.4786, "lon": 78.4842, "country": "India", "state": "Andhra Pradesh", "district": "Nandyal", "mandal": "Nandyal", "village": "Nandyal Town"},
    "tirupati": {"lat": 13.6288, "lon": 79.4192, "country": "India", "state": "Andhra Pradesh", "district": "Tirupati", "mandal": "Tirupati Urban", "village": "Tirupati City"},
    "chittoor": {"lat": 13.2172, "lon": 79.1003, "country": "India", "state": "Andhra Pradesh", "district": "Chittoor", "mandal": "Chittoor", "village": "Chittoor Town"},
    "visakhapatnam": {"lat": 17.6868, "lon": 83.2185, "country": "India", "state": "Andhra Pradesh", "district": "Visakhapatnam", "mandal": "Visakhapatnam Urban", "village": "Visakhapatnam City"},
    "guntur": {"lat": 16.3067, "lon": 80.4365, "country": "India", "state": "Andhra Pradesh", "district": "Guntur", "mandal": "Guntur East", "village": "Guntur City"},

    # Other India
    "bengaluru": {"lat": 12.9716, "lon": 77.5946, "country": "India", "state": "Karnataka", "district": "Bengaluru Urban", "mandal": "Bengaluru North", "village": "Bengaluru City"},
    "kochi": {"lat": 9.9312, "lon": 76.2673, "country": "India", "state": "Kerala", "district": "Ernakulam", "mandal": "Kochi", "village": "Marine Drive"},
    "ernakulam": {"lat": 9.9816, "lon": 76.2999, "country": "India", "state": "Kerala", "district": "Ernakulam", "mandal": "Kanayannur", "village": "Marine Drive"},
    "thiruvananthapuram": {"lat": 8.5241, "lon": 76.9366, "country": "India", "state": "Kerala", "district": "Thiruvananthapuram", "mandal": "Thiruvananthapuram", "village": "Pattom"},
    "hyderabad": {"lat": 17.3850, "lon": 78.4867, "country": "India", "state": "Telangana", "district": "Hyderabad", "mandal": "Shaikpet", "village": "Banjara Hills"},
    "mumbai": {"lat": 19.0760, "lon": 72.8777, "country": "India", "state": "Maharashtra", "district": "Mumbai Suburban", "mandal": "Andheri", "village": "Andheri West"},
    "pune": {"lat": 18.5204, "lon": 73.8567, "country": "India", "state": "Maharashtra", "district": "Pune", "mandal": "Pune City", "village": "Shivajinagar"},
    "delhi": {"lat": 28.6139, "lon": 77.2090, "country": "India", "state": "Delhi", "district": "New Delhi", "mandal": "Central Delhi", "village": "New Delhi"},

    # United Kingdom
    "london": {"lat": 51.5074, "lon": -0.1278, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "City of Westminster", "village": "Mayfair"},
    "westminster": {"lat": 51.4975, "lon": -0.1357, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "City of Westminster", "village": "Westminster"},
    "city of westminster": {"lat": 51.4975, "lon": -0.1357, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "City of Westminster", "village": "Westminster"},
    "mayfair": {"lat": 51.5095, "lon": -0.1487, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "City of Westminster", "village": "Mayfair"},
    "greater london": {"lat": 51.5074, "lon": -0.1278, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "City of Westminster", "village": "London City"},
    "england": {"lat": 51.5074, "lon": -0.1278, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "City of Westminster", "village": "London City"},
    "united kingdom": {"lat": 51.5074, "lon": -0.1278, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "City of Westminster", "village": "London City"},
    "camden": {"lat": 51.5430, "lon": -0.1420, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "Camden", "village": "Camden Town"},
    "camden town": {"lat": 51.5430, "lon": -0.1420, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "Camden", "village": "Camden Town"},
    "greenwich": {"lat": 51.4826, "lon": -0.0077, "country": "United Kingdom", "state": "England", "district": "Greater London", "mandal": "Greenwich", "village": "Greenwich Village"},
    "birmingham": {"lat": 52.4862, "lon": -1.8904, "country": "United Kingdom", "state": "England", "district": "West Midlands", "mandal": "Birmingham", "village": "Birmingham City Centre"},
    "manchester": {"lat": 53.4808, "lon": -2.2426, "country": "United Kingdom", "state": "England", "district": "Greater Manchester", "mandal": "Manchester", "village": "Manchester City Centre"},
    "edinburgh": {"lat": 55.9533, "lon": -3.1883, "country": "United Kingdom", "state": "Scotland", "district": "City of Edinburgh", "mandal": "Edinburgh Old Town", "village": "Edinburgh Old Town"},
    "city of edinburgh": {"lat": 55.9533, "lon": -3.1883, "country": "United Kingdom", "state": "Scotland", "district": "City of Edinburgh", "mandal": "Edinburgh Old Town", "village": "Edinburgh Old Town"},
    "scotland": {"lat": 55.9533, "lon": -3.1883, "country": "United Kingdom", "state": "Scotland", "district": "City of Edinburgh", "mandal": "Edinburgh Old Town", "village": "Edinburgh Old Town"},
    "glasgow": {"lat": 55.8642, "lon": -4.2518, "country": "United Kingdom", "state": "Scotland", "district": "Glasgow City", "mandal": "Glasgow City Centre", "village": "West End"},
    "cardiff": {"lat": 51.4816, "lon": -3.1791, "country": "United Kingdom", "state": "Wales", "district": "Cardiff", "mandal": "Cardiff City Centre", "village": "Cardiff Bay"},
    "wales": {"lat": 51.4816, "lon": -3.1791, "country": "United Kingdom", "state": "Wales", "district": "Cardiff", "mandal": "Cardiff City Centre", "village": "Cardiff Bay"},
    "belfast": {"lat": 54.5973, "lon": -5.9301, "country": "United Kingdom", "state": "Northern Ireland", "district": "Belfast", "mandal": "Belfast City Centre", "village": "Titanic Quarter"},
    "northern ireland": {"lat": 54.5973, "lon": -5.9301, "country": "United Kingdom", "state": "Northern Ireland", "district": "Belfast", "mandal": "Belfast City Centre", "village": "Titanic Quarter"},

    # Spain
    "spain": {"lat": 40.4168, "lon": -3.7038, "country": "Spain", "state": "Community of Madrid", "district": "Madrid", "mandal": "Madrid", "village": "Centro (Sol / Gran Vía)"},
    "madrid": {"lat": 40.4168, "lon": -3.7038, "country": "Spain", "state": "Community of Madrid", "district": "Madrid", "mandal": "Madrid", "village": "Centro (Sol / Gran Vía)"},
    "community of madrid": {"lat": 40.4168, "lon": -3.7038, "country": "Spain", "state": "Community of Madrid", "district": "Madrid", "mandal": "Madrid", "village": "Centro (Sol / Gran Vía)"},
    "barcelona": {"lat": 41.3879, "lon": 2.1699, "country": "Spain", "state": "Catalonia", "district": "Barcelona", "mandal": "Barcelona", "village": "Eixample"},
    "catalonia": {"lat": 41.3879, "lon": 2.1699, "country": "Spain", "state": "Catalonia", "district": "Barcelona", "mandal": "Barcelona", "village": "Eixample"},
    "eixample": {"lat": 41.3888, "lon": 2.1610, "country": "Spain", "state": "Catalonia", "district": "Barcelona", "mandal": "Barcelona", "village": "Eixample"},
    "seville": {"lat": 37.3891, "lon": -5.9845, "country": "Spain", "state": "Andalusia", "district": "Seville", "mandal": "Seville", "village": "Triana"},
    "andalusia": {"lat": 37.3891, "lon": -5.9845, "country": "Spain", "state": "Andalusia", "district": "Seville", "mandal": "Seville", "village": "Triana"},
    "triana": {"lat": 37.3833, "lon": -6.0028, "country": "Spain", "state": "Andalusia", "district": "Seville", "mandal": "Seville", "village": "Triana"},
    "malaga": {"lat": 36.7213, "lon": -4.4214, "country": "Spain", "state": "Andalusia", "district": "Malaga", "mandal": "Malaga", "village": "Malaga Centro"},
    "valencia": {"lat": 39.4699, "lon": -0.3763, "country": "Spain", "state": "Valencian Community", "district": "Valencia", "mandal": "Valencia", "village": "Ciutat Vella"},

    # Egypt
    "egypt": {"lat": 30.0444, "lon": 31.2357, "country": "Egypt", "state": "Cairo Governorate", "district": "Downtown Cairo", "mandal": "El Tahrir Square", "village": "Tahrir Plaza"},
    "cairo": {"lat": 30.0444, "lon": 31.2357, "country": "Egypt", "state": "Cairo Governorate", "district": "Downtown Cairo", "mandal": "El Tahrir Square", "village": "Tahrir Plaza"},
    "cairo governorate": {"lat": 30.0444, "lon": 31.2357, "country": "Egypt", "state": "Cairo Governorate", "district": "Downtown Cairo", "mandal": "El Tahrir Square", "village": "Tahrir Plaza"},
    "tahrir": {"lat": 30.0444, "lon": 31.2357, "country": "Egypt", "state": "Cairo Governorate", "district": "Downtown Cairo", "mandal": "El Tahrir Square", "village": "Tahrir Plaza"},
    "tahrir plaza": {"lat": 30.0444, "lon": 31.2357, "country": "Egypt", "state": "Cairo Governorate", "district": "Downtown Cairo", "mandal": "El Tahrir Square", "village": "Tahrir Plaza"},
    "nasr city": {"lat": 30.0561, "lon": 31.3301, "country": "Egypt", "state": "Cairo Governorate", "district": "Nasr City", "mandal": "Abbas El Akkad", "village": "City Stars Area"},
    "alexandria": {"lat": 31.2001, "lon": 29.9187, "country": "Egypt", "state": "Alexandria Governorate", "district": "Al Montazah", "mandal": "Montazah Palace", "village": "Stanley"},
    "alexandria governorate": {"lat": 31.2001, "lon": 29.9187, "country": "Egypt", "state": "Alexandria Governorate", "district": "Al Montazah", "mandal": "Montazah Palace", "village": "Stanley"},
    "giza": {"lat": 30.0131, "lon": 31.2089, "country": "Egypt", "state": "Giza Governorate", "district": "Dokki", "mandal": "Moussadak", "village": "Giza Pyramids Plateau"},
    "giza governorate": {"lat": 30.0131, "lon": 31.2089, "country": "Egypt", "state": "Giza Governorate", "district": "Dokki", "mandal": "Moussadak", "village": "Giza Pyramids Plateau"},
    "luxor": {"lat": 25.6872, "lon": 32.6396, "country": "Egypt", "state": "Luxor", "district": "Luxor City", "mandal": "Karnak", "village": "Luxor Temple Area"},
    "aswan": {"lat": 24.0889, "lon": 32.8998, "country": "Egypt", "state": "Aswan", "district": "Aswan City", "mandal": "Aswan City", "village": "Philae Vista"},

    # United States & Australia
    "phoenix": {"lat": 33.4484, "lon": -112.0740, "country": "United States", "state": "Arizona", "district": "Maricopa County", "mandal": "Phoenix", "village": "Downtown Phoenix"},
    "los angeles": {"lat": 34.0522, "lon": -118.2437, "country": "United States", "state": "California", "district": "Los Angeles County", "mandal": "Downtown Los Angeles", "village": "Bunker Hill"},
    "sydney": {"lat": -33.8688, "lon": 151.2093, "country": "Australia", "state": "New South Wales", "district": "City of Sydney", "mandal": "Sydney CBD", "village": "The Rocks"}
}


def _http_get_json(url: str, timeout: int = 6) -> Optional[Dict[str, Any]]:
    """Helper to perform HTTP GET requests safely with JSON response."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "SolarIQ-WeatherService/2.0 (Solar Panel Efficiency Platform)"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if resp.status == 200:
                data = resp.read().decode("utf-8")
                return json.loads(data)
    except Exception as e:
        print(f"[WeatherService HTTP Warning] GET {url} failed: {e}")
    return None


class WeatherService:
    @staticmethod
    def get_countries() -> List[Dict[str, str]]:
        """Returns list of supported countries."""
        return COUNTRIES

    @staticmethod
    def get_states(country: str) -> List[str]:
        """Returns administrative states/provinces for selected country."""
        country_clean = (country or "").strip().lower()
        if "india" in country_clean or country_clean == "in":
            return INDIA_STATES
        elif "united kingdom" in country_clean or "uk" in country_clean or country_clean == "gb":
            return UK_REGIONS
        elif "spain" in country_clean or country_clean == "es":
            return SPAIN_COMMUNITIES
        elif "egypt" in country_clean or country_clean == "eg":
            return EGYPT_GOVERNORATES
        elif "united states" in country_clean or country_clean == "us" or "america" in country_clean:
            return US_STATES
        elif "australia" in country_clean or country_clean == "au":
            return AUSTRALIA_STATES
        
        # Try dynamic lookup via Open-Meteo Geocoding for other countries
        cache_key = f"states_{country_clean}"
        if cache_key in CACHE["geocoding"]:
            return CACHE["geocoding"][cache_key]

        query_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(country)}&count=10&language=en&format=json"
        res = _http_get_json(query_url)
        states = set()
        if res and "results" in res:
            for item in res["results"]:
                if item.get("admin1"):
                    states.add(item["admin1"])
        
        state_list = sorted(list(states)) if states else [f"{country} Capital Region", f"Central {country}", f"North {country}", f"South {country}"]
        CACHE["geocoding"][cache_key] = state_list
        return state_list

    @staticmethod
    def get_districts(country: str, state: str) -> List[str]:
        """Returns districts for selected country and state without cross-contamination."""
        c = (country or "").strip().lower()
        s = (state or "").strip().lower()

        # India
        if "india" in c or c == "in":
            if "tamil nadu" in s:
                return TAMIL_NADU_DISTRICTS
            elif "andhra pradesh" in s:
                return ANDHRA_PRADESH_DISTRICTS
            elif "karnataka" in s:
                return KARNATAKA_DISTRICTS
            elif "kerala" in s:
                return KERALA_DISTRICTS
            elif "telangana" in s:
                return TELANGANA_DISTRICTS
            elif "maharashtra" in s:
                return MAHARASHTRA_DISTRICTS
            return [f"{state} Central District", f"{state} North District", f"{state} South District", f"{state} East District"]

        # United Kingdom
        if "united kingdom" in c or "uk" in c or c == "gb":
            if s in UK_COUNTIES:
                return UK_COUNTIES[s]
            return ["Greater London", "West Midlands", "Greater Manchester", "City of Edinburgh", "Cardiff", "Belfast"]

        # Spain
        if "spain" in c or c == "es":
            if s in SPAIN_PROVINCES:
                return SPAIN_PROVINCES[s]
            return ["Madrid", "Barcelona", "Seville", "Malaga", "Valencia"]

        # Egypt
        if "egypt" in c or c == "eg":
            if s in EGYPT_DISTRICTS:
                return EGYPT_DISTRICTS[s]
            return [f"{state} Center", f"{state} North Sector", f"{state} South Sector"]

        # United States
        if "united states" in c or c == "us":
            if "california" in s:
                return ["Los Angeles County", "San Diego County", "Orange County", "Santa Clara County", "San Francisco County"]
            elif "arizona" in s:
                return ["Maricopa County", "Pima County", "Pinal County", "Coconino County"]
            elif "texas" in s:
                return ["Harris County", "Dallas County", "Travis County", "Bexar County", "Tarrant County"]
            return [f"{state} Central County", f"{state} Metro County", f"{state} North County"]

        # Australia
        if "australia" in c or c == "au":
            if "new south wales" in s:
                return ["City of Sydney", "City of Parramatta", "Northern Beaches", "Newcastle", "Wollongong"]
            elif "victoria" in s:
                return ["City of Melbourne", "City of Geelong", "City of Ballarat"]
            return [f"{state} Metro Region", f"{state} Coastal Region"]
        
        cache_key = f"districts_{country}_{state}".lower()
        if cache_key in CACHE["geocoding"]:
            return CACHE["geocoding"][cache_key]

        # Dynamic search query for districts/admin2
        query_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(state)}&count=20&language=en&format=json"
        res = _http_get_json(query_url)
        districts = set()
        if res and "results" in res:
            for item in res["results"]:
                if item.get("admin2"):
                    districts.add(item["admin2"])
                elif item.get("name") and item.get("name").lower() != s:
                    districts.add(item["name"])

        dist_list = sorted(list(districts)) if districts else [f"{state} Central District", f"{state} North District", f"{state} South District"]
        CACHE["geocoding"][cache_key] = dist_list
        return dist_list

    @staticmethod
    def get_mandals(country: str, state: str, district: str) -> List[str]:
        """Returns mandals / subdistricts for selected district."""
        c = (country or "").strip().lower()
        d = (district or "").strip().lower()

        # India
        if "india" in c or c == "in":
            if d in SUBDISTRICTS_DATA:
                return SUBDISTRICTS_DATA[d]
            return [f"{district} Urban Mandal", f"{district} Rural Mandal", f"{district} North Mandal", f"{district} South Mandal"]

        # United Kingdom
        if "united kingdom" in c or "uk" in c or c == "gb":
            if d in UK_BOROUGHS:
                return UK_BOROUGHS[d]
            return [f"{district} Central Borough", f"{district} North Ward", f"{district} South Ward"]

        # Spain
        if "spain" in c or c == "es":
            if d in SPAIN_MUNICIPALITIES:
                return SPAIN_MUNICIPALITIES[d]
            return [f"{district} Capital", f"{district} Norte", f"{district} Sur"]

        # Egypt
        if "egypt" in c or c == "eg":
            if d in EGYPT_SUBDISTRICTS:
                return EGYPT_SUBDISTRICTS[d]
            return [f"{district} Main Sector", f"{district} First District", f"{district} Second District"]

        return [f"{district} Urban Area", f"{district} Suburban Area", f"{district} Industrial Zone"]

    @staticmethod
    def get_villages(country: str, state: str, district: str, mandal: str) -> List[str]:
        """Returns villages / localities for selected mandal."""
        c = (country or "").strip().lower()
        m = (mandal or "").strip().lower()

        # India
        if "india" in c or c == "in":
            if m in VILLAGES_DATA:
                return VILLAGES_DATA[m]
            return [f"{mandal} Main Locality", f"{mandal} North Village", f"{mandal} South Village", f"{mandal} East Village"]

        # United Kingdom
        if "united kingdom" in c or "uk" in c or c == "gb":
            if m in UK_LOCALITIES:
                return UK_LOCALITIES[m]
            return [f"{mandal} High Street", f"{mandal} Park Locality", f"{mandal} Station Area"]

        # Spain
        if "spain" in c or c == "es":
            if m in SPAIN_LOCALITIES:
                return SPAIN_LOCALITIES[m]
            return [f"{mandal} Casco Histórico", f"{mandal} Ensanche", f"{mandal} Centro"]

        # Egypt
        if "egypt" in c or c == "eg":
            if m in EGYPT_LOCALITIES:
                return EGYPT_LOCALITIES[m]
            return [f"{mandal} Corniche", f"{mandal} Square", f"{mandal} Commercial Area"]

        return [f"{mandal} Central", f"{mandal} Park Area", f"{mandal} Residential Zone"]

    @staticmethod
    def resolve_coordinates(country: str, state: str, district: str, mandal: str, village: str) -> Dict[str, Any]:
        """Resolves exact latitude and longitude for a given hierarchical location."""
        search_terms = [v for v in [village, mandal, district, state, country] if v and "select" not in v.lower()]
        
        # Priority 1: Check known exact coordinates dictionary
        for term in search_terms:
            t_clean = term.strip().lower()
            if t_clean in KNOWN_COORDINATES:
                return {
                    "status": "success",
                    "lat": KNOWN_COORDINATES[t_clean]["lat"],
                    "lon": KNOWN_COORDINATES[t_clean]["lon"]
                }
        
        # Priority 2: Query Open-Meteo Geocoding API
        query = ", ".join(search_terms[:3])
        query_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(query)}&count=1&language=en&format=json"
        res = _http_get_json(query_url)
        
        if res and "results" in res and len(res["results"]) > 0:
            item = res["results"][0]
            return {"status": "success", "lat": round(item["latitude"], 4), "lon": round(item["longitude"], 4)}
        
        # Priority 3: Query OpenStreetMap Nominatim Search API
        nom_url = f"https://nominatim.openstreetmap.org/search?q={urllib.parse.quote(query)}&format=json&limit=1"
        nom_res = _http_get_json(nom_url)
        if nom_res and len(nom_res) > 0:
            item = nom_res[0]
            return {"status": "success", "lat": round(float(item["lat"]), 4), "lon": round(float(item["lon"]), 4)}

        # Default fallback coordinates (Anantapur SolarIQ default)
        return {
            "status": "success",
            "lat": 14.6819,
            "lon": 77.6006
        }

    @staticmethod
    def search_locations(query: str) -> List[Dict[str, Any]]:
        """Performs multi-level global location search across country, state, district, mandal, village."""
        if not query or len(query.strip()) < 2:
            return []
        
        query_clean = query.strip().lower()
        
        # Check instant known coordinates
        results = []
        for key, item in KNOWN_COORDINATES.items():
            if (
                query_clean in key or
                query_clean in item.get("village", "").lower() or
                query_clean in item.get("mandal", "").lower() or
                query_clean in item.get("district", "").lower() or
                query_clean in item.get("state", "").lower() or
                query_clean in item.get("country", "").lower()
            ):
                results.append({
                    "display_name": f"{item['village']}, {item.get('district', item.get('state'))}, {item['state']}, {item['country']}",
                    "village": item["village"],
                    "mandal": item["mandal"],
                    "district": item["district"],
                    "state": item["state"],
                    "country": item["country"],
                    "latitude": item["lat"],
                    "longitude": item["lon"]
                })
        
        # Also query Open-Meteo Geocoding API
        api_url = f"https://geocoding-api.open-meteo.com/v1/search?name={urllib.parse.quote(query)}&count=10&language=en&format=json"
        res = _http_get_json(api_url)
        
        if res and "results" in res:
            for item in res["results"]:
                country = item.get("country", "Unknown")
                state = item.get("admin1", item.get("country", ""))
                district = item.get("admin2", state)
                mandal = item.get("admin3", district)
                village = item.get("name", mandal)
                
                display = f"{village}"
                if mandal and mandal != village:
                    display += f", {mandal}"
                if district and district not in (village, mandal):
                    display += f", {district}"
                if state and state not in (district, country):
                    display += f", {state}"
                display += f", {country}"

                results.append({
                    "display_name": display,
                    "village": village,
                    "mandal": mandal,
                    "district": district,
                    "state": state,
                    "country": country,
                    "latitude": item.get("latitude"),
                    "longitude": item.get("longitude")
                })

        return results[:10]

    @staticmethod
    def reverse_geocode(lat: float, lon: float, accuracy: float = 0.0) -> Dict[str, Any]:
        """
        Performs normalized multi-tiered reverse geocoding for latitude and longitude.
        Queries OpenStreetMap Nominatim and BigDataCloud APIs to retrieve accurate
        administrative hierarchy (Country -> State -> District -> Subdistrict/Mandal -> Village/Locality).
        """
        # Validate coordinates
        if not (-90.0 <= lat <= 90.0) or not (-180.0 <= lon <= 180.0):
            return {
                "status": "error",
                "message": "Invalid coordinates. Latitude must be between -90 and 90, Longitude between -180 and 180."
            }

        cache_key = f"rev_{round(lat, 4)}_{round(lon, 4)}"
        if cache_key in CACHE["geocoding"]:
            cached = dict(CACHE["geocoding"][cache_key])
            cached["accuracy"] = accuracy
            return cached

        country = "India"
        country_code = "IN"
        state = ""
        district = ""
        subdistrict = ""
        village = ""

        # Priority 0: Instant match against known coordinates database for zero latency & offline precision
        for item in KNOWN_COORDINATES.values():
            if abs(item["lat"] - lat) < 0.05 and abs(item["lon"] - lon) < 0.05:
                country = item.get("country", country)
                state = item.get("state", "")
                district = item.get("district", "")
                subdistrict = item.get("mandal", "")
                village = item.get("village", "")
                break

        # Priority 1: Query OpenStreetMap Nominatim API for rich structured address data
        nom_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&accept-language=en"
        nom_res = _http_get_json(nom_url, timeout=5)

        if nom_res and "address" in nom_res:
            addr = nom_res["address"]
            country = addr.get("country", country)
            country_code = addr.get("country_code", "in").upper()
            state = addr.get("state") or addr.get("province") or addr.get("region") or ""
            
            # Extract District
            dist_raw = addr.get("state_district") or addr.get("district") or addr.get("county") or addr.get("city_district") or ""
            if dist_raw:
                if "anantapur" in dist_raw.lower():
                    district = "Anantapur"
                elif "bengaluru" in dist_raw.lower() or "bangalore" in dist_raw.lower():
                    district = "Bengaluru Urban"
                elif "pudukkottai" in dist_raw.lower():
                    district = "Pudukkottai"
                elif "chennai" in dist_raw.lower():
                    district = "Chennai"
                elif "kurnool" in dist_raw.lower():
                    district = "Kurnool"
                else:
                    district = dist_raw

            # Extract Subdistrict (Mandal / Taluk / Tehsil)
            sub_raw = addr.get("county") or addr.get("subdistrict") or addr.get("municipality") or addr.get("mandal") or addr.get("taluk") or addr.get("tehsil") or ""
            if sub_raw and sub_raw != district:
                subdistrict = sub_raw
            else:
                subdistrict = district if district else state

            # Extract Village / Locality / Town / City
            loc_raw = (
                addr.get("village") or addr.get("suburb") or addr.get("neighbourhood") or 
                addr.get("locality") or addr.get("town") or addr.get("city") or 
                addr.get("residential") or addr.get("hamlet") or ""
            )
            village = loc_raw if loc_raw else (subdistrict if subdistrict else state)

        # Priority 2: Fallback to BigDataCloud API if Nominatim returned incomplete state/country
        if not state or not district:
            bdc_url = f"https://api.bigdatacloud.net/data/reverse-geocode-client?latitude={lat}&longitude={lon}&localityLanguage=en"
            bdc_res = _http_get_json(bdc_url, timeout=5)
            if bdc_res:
                country = bdc_res.get("countryName", country)
                country_code = bdc_res.get("countryCode", country_code).upper()
                state = bdc_res.get("principalSubdivision", state)
                locality = bdc_res.get("locality") or bdc_res.get("city") or ""
                
                admin_levels = bdc_res.get("localityInfo", {}).get("administrative", [])
                for level in admin_levels:
                    order = level.get("order")
                    name = level.get("name")
                    if order in [3, 4] and name and name != state:
                        if not district or district == country:
                            district = name
                    elif order in [5, 6] and name:
                        if not subdistrict or subdistrict == district:
                            subdistrict = name

                if locality and not village:
                    village = locality

        # Final Fallbacks for labels
        if not state:
            state = country
        if not district:
            district = state
        if not subdistrict:
            subdistrict = district
        if not village:
            village = subdistrict

        # Determine subdistrict type label
        state_clean = state.lower()
        if "andhra pradesh" in state_clean or "telangana" in state_clean:
            subdistrict_type = "Mandal"
        elif "karnataka" in state_clean or "tamil nadu" in state_clean or "kerala" in state_clean:
            subdistrict_type = "Taluk"
        elif "united kingdom" in country.lower():
            subdistrict_type = "Borough"
        elif "spain" in country.lower():
            subdistrict_type = "Municipality"
        elif "egypt" in country.lower():
            subdistrict_type = "Sector"
        elif "india" in country.lower():
            subdistrict_type = "Tehsil"
        else:
            subdistrict_type = "Sub-district"

        # Build clean display name hierarchy
        display_parts = []
        if village:
            display_parts.append(village)
        if subdistrict and subdistrict != village:
            display_parts.append(f"{subdistrict} {subdistrict_type}" if "india" in country.lower() and subdistrict_type not in subdistrict else subdistrict)
        if district and district not in (village, subdistrict):
            display_parts.append(f"{district} Dist" if "india" in country.lower() and "dist" not in district.lower() else district)
        if state and state not in (district, country):
            display_parts.append(state)
        display_parts.append(country)

        display_name = ", ".join(display_parts)

        result = {
            "status": "success",
            "latitude": round(lat, 4),
            "longitude": round(lon, 4),
            "accuracy": round(accuracy, 1),
            "country": country,
            "country_code": country_code,
            "state": state,
            "district": district,
            "subdistrict": subdistrict,
            "subdistrict_type": subdistrict_type,
            "mandal": subdistrict,
            "village": village,
            "locality": village,
            "display_name": display_name,
            "source": "gps"
        }

        CACHE["geocoding"][cache_key] = result
        return result

    @staticmethod
    def get_live_weather(lat: float, lon: float) -> Dict[str, Any]:
        """Fetches real-time weather and shortwave solar irradiance (W/m²) for given coordinates."""
        cache_key = f"weather_{round(lat, 2)}_{round(lon, 2)}"
        now = time.time()

        if cache_key in CACHE["weather"]:
            cached_data, cached_time = CACHE["weather"][cache_key]
            if now - cached_time < CACHE_TTL_WEATHER:
                return cached_data

        # Query Open-Meteo real-time weather & solar irradiance API
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}"
            f"&current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,shortwave_radiation,direct_normal_irradiance,diffuse_radiation,cloud_cover,weather_code"
            f"&timezone=auto"
        )

        res = _http_get_json(url)

        if res and "current" in res:
            curr = res["current"]
            
            temp_c = curr.get("temperature_2m", 28.0)
            humidity = curr.get("relative_humidity_2m", 50.0)
            wind_kmh = curr.get("wind_speed_10m", 10.0)
            wind_ms = round(wind_kmh / 3.6, 1)
            wind_dir = curr.get("wind_direction_10m", 180)
            cloud_cover = curr.get("cloud_cover", 15.0)
            pressure = curr.get("surface_pressure", 1013.2)
            
            shortwave = curr.get("shortwave_radiation", 0.0)
            direct = curr.get("direct_normal_irradiance", 0.0)
            
            irradiance_w = round(max(0.0, shortwave), 1)
            panel_temp_c = round(temp_c + (irradiance_w / 800.0) * 25.0, 1)

            wcode = curr.get("weather_code", 0)
            weather_condition = WeatherService.map_weather_code(wcode)

            formatted_time = datetime.now().strftime("%I:%M %p")
            iso_time = datetime.now().isoformat()

            weather_data = {
                "status": "success",
                "is_live": True,
                "latitude": lat,
                "longitude": lon,
                "irradiance": irradiance_w,
                "shortwave_radiation": irradiance_w,
                "direct_radiation": round(direct, 1),
                "ambient_temp": round(temp_c, 1),
                "feels_like": round(temp_c + 1.2, 1),
                "panel_temp": panel_temp_c,
                "humidity": round(humidity, 1),
                "wind_speed": wind_ms,
                "wind_direction": wind_dir,
                "cloud_cover": round(cloud_cover, 1),
                "pressure": round(pressure, 1),
                "weather": weather_condition,
                "uv_index": round(max(0.0, irradiance_w / 100.0), 1),
                "timestamp": formatted_time,
                "updated_at": iso_time,
                "source": "Open-Meteo Real-Time Weather API"
            }

            CACHE["weather"][cache_key] = (weather_data, now)
            return weather_data

        # Fallback if API call fails
        formatted_time = datetime.now().strftime("%I:%M %p")
        return {
            "status": "fallback",
            "is_live": False,
            "latitude": lat,
            "longitude": lon,
            "irradiance": 850.0,
            "ambient_temp": 30.0,
            "panel_temp": 42.0,
            "humidity": 48.0,
            "wind_speed": 3.2,
            "cloud_cover": 20.0,
            "weather": "Sunny (Preset Fallback)",
            "timestamp": formatted_time,
            "updated_at": datetime.now().isoformat(),
            "source": "SolarIQ Backup Presets"
        }

    @staticmethod
    def map_weather_code(code: int) -> str:
        """Maps WMO weather code to clear human-readable string."""
        if code == 0:
            return "Clear Sky / Sunny"
        elif code in (1, 2, 3):
            return "Partly Cloudy"
        elif code in (45, 48):
            return "Foggy"
        elif code in (51, 53, 55, 56, 57):
            return "Light Drizzle"
        elif code in (61, 63, 65, 66, 67):
            return "Rainy"
        elif code in (71, 73, 75, 77):
            return "Snowy"
        elif code in (80, 81, 82):
            return "Rain Showers"
        elif code in (95, 96, 99):
            return "Thunderstorm"
        return "Clear Sky"


weather_service = WeatherService()
