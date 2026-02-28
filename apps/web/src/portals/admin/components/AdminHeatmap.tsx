import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Package, Truck, Layers, TrendingUp } from "lucide-react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";

// Australian postcode → approximate lat/lng lookup
const postcodeCoords: Record<string, [number, number]> = {
  "2000": [-33.8688, 151.2093], // Sydney CBD
  "2010": [-33.8780, 151.2152], // Surry Hills
  "2011": [-33.8690, 151.2270], // Elizabeth Bay
  "2020": [-33.9030, 151.2100], // Mascot
  "2025": [-33.8930, 151.2530], // Woollahra
  "2026": [-33.8890, 151.2690], // Bondi
  "2027": [-33.8600, 151.2730], // Darling Point
  "2028": [-33.8730, 151.2770], // Double Bay
  "2029": [-33.8630, 151.2840], // Rose Bay
  "2030": [-33.8520, 151.2610], // Vaucluse
  "2031": [-33.8980, 151.2540], // Clovelly
  "2032": [-33.9120, 151.2270], // Kingsford
  "2033": [-33.9200, 151.2380], // Kensington
  "2034": [-33.9280, 151.2450], // Coogee
  "2035": [-33.9190, 151.2580], // Maroubra
  "2036": [-33.9340, 151.2320], // Matraville
  "2037": [-33.8540, 151.1860], // Glebe
  "2038": [-33.8790, 151.1670], // Annandale
  "2039": [-33.8590, 151.1740], // Rozelle
  "2040": [-33.8700, 151.1570], // Leichhardt
  "2041": [-33.8500, 151.1680], // Balmain
  "2042": [-33.8900, 151.1790], // Newtown
  "2043": [-33.8960, 151.1870], // Erskineville
  "2044": [-33.9070, 151.1790], // St Peters
  "2045": [-33.8770, 151.1510], // Haberfield
  "2046": [-33.8650, 151.1440], // Five Dock
  "2047": [-33.8530, 151.1530], // Drummoyne
  "2048": [-33.8410, 151.1600], // Birchgrove
  "2049": [-33.8670, 151.1890], // Petersham
  "2050": [-33.8880, 151.1880], // Camperdown
  "2060": [-33.8350, 151.2070], // North Sydney
  "2061": [-33.8240, 151.1900], // Kirribilli
  "2065": [-33.8170, 151.1930], // Crows Nest
  "2066": [-33.8050, 151.1890], // Lane Cove
  "2067": [-33.7970, 151.1760], // Chatswood
  "2070": [-33.7690, 151.1490], // Lindfield
  "2073": [-33.7350, 151.1280], // Pymble
  "2074": [-33.7190, 151.1230], // Turramurra
  "2075": [-33.7390, 151.1560], // St Ives
  "2076": [-33.7580, 151.1640], // Wahroonga
  "2077": [-33.7200, 151.0900], // Hornsby
  "2085": [-33.7950, 151.2660], // Balgowlah
  "2088": [-33.8250, 151.2480], // Mosman
  "2089": [-33.8170, 151.2180], // Neutral Bay
  "2090": [-33.8280, 151.2320], // Cremorne
  "2095": [-33.7960, 151.2870], // Manly
  "2096": [-33.7870, 151.2750], // Curl Curl
  "2097": [-33.7720, 151.2880], // Collaroy
  "2099": [-33.7520, 151.2720], // Dee Why
  "2100": [-33.7680, 151.2520], // Brookvale
  "2110": [-33.8390, 151.1430], // Hunters Hill
  "2111": [-33.8100, 151.1120], // Gladesville
  "2112": [-33.7940, 151.1070], // Ryde
  "2113": [-33.7770, 151.1170], // Macquarie Park
  "2114": [-33.7870, 151.0840], // Eastwood
  "2115": [-33.7990, 151.0530], // Ermington
  "2116": [-33.8100, 151.0330], // Rydalmere
  "2117": [-33.8200, 151.0120], // Dundas
  "2118": [-33.7970, 151.0140], // Carlingford
  "2119": [-33.7620, 151.0770], // Beecroft
  "2120": [-33.7420, 151.0730], // Thornleigh
  "2121": [-33.7520, 151.0470], // Epping
  "2122": [-33.7750, 151.0930], // Marsfield
  "2125": [-33.7620, 151.0170], // Cherrybrook
  "2127": [-33.8170, 151.0840], // Newington
  "2128": [-33.8350, 151.0930], // Silverwater
  "2130": [-33.9020, 151.1410], // Summer Hill
  "2131": [-33.8880, 151.1330], // Ashfield
  "2132": [-33.8830, 151.1180], // Croydon
  "2133": [-33.8870, 151.1030], // Croydon Park
  "2134": [-33.8740, 151.1020], // Burwood
  "2135": [-33.8650, 151.0830], // Strathfield
  "2136": [-33.8810, 151.0870], // Burwood Heights
  "2137": [-33.8570, 151.0720], // Concord
  "2138": [-33.8440, 151.0740], // Concord West
  "2140": [-33.8710, 151.0600], // Homebush
  "2141": [-33.8650, 151.0340], // Lidcombe
  "2142": [-33.8640, 151.0070], // Granville
  "2143": [-33.8770, 151.0240], // Birrong
  "2144": [-33.8640, 150.9880], // Auburn
  "2145": [-33.8090, 150.9740], // Westmead
  "2148": [-33.7630, 150.8810], // Blacktown
  "2150": [-33.8150, 151.0050], // Parramatta
  "2151": [-33.7920, 151.0070], // North Parramatta
  "2152": [-33.8120, 150.9750], // Northmead
  "2153": [-33.7580, 150.9640], // Baulkham Hills
  "2154": [-33.7350, 150.9810], // Castle Hill
  "2155": [-33.6900, 150.9230], // Kellyville
  "2160": [-33.8780, 150.9780], // Merrylands
  "2161": [-33.8640, 150.9620], // Guildford
  "2163": [-33.8780, 150.9330], // Villawood
  "2164": [-33.8900, 150.8880], // Smithfield
  "2165": [-33.8760, 150.9090], // Fairfield
  "2166": [-33.8900, 150.9210], // Cabramatta
  "2168": [-33.9170, 150.8710], // Miller
  "2170": [-33.9210, 150.9310], // Liverpool
  "2171": [-33.9520, 150.8720], // Cecil Hills
  "2176": [-33.8570, 150.8870], // Girraween
  "2177": [-33.8470, 150.8600], // Seven Hills
  "2190": [-33.9180, 151.0290], // Greenacre
  "2191": [-33.9260, 151.0490], // Belfield
  "2192": [-33.9120, 151.0920], // Belmore
  "2193": [-33.9050, 151.1030], // Canterbury
  "2194": [-33.9150, 151.0730], // Campsie
  "2195": [-33.9280, 151.0690], // Lakemba
  "2196": [-33.9380, 151.0440], // Punchbowl
  "2197": [-33.9400, 151.0640], // Bass Hill
  "2198": [-33.9520, 151.0520], // Yagoona
  "2199": [-33.9430, 151.0280], // Bankstown
  "2200": [-33.9470, 151.0300], // Bankstown
  "2204": [-33.9000, 151.1500], // Marrickville
  "2205": [-33.9320, 151.1450], // Arncliffe
  "2206": [-33.9230, 151.1340], // Earlwood
  "2207": [-33.9470, 151.1380], // Banksia
  "2208": [-33.9530, 151.1180], // Padstow
  "2209": [-33.9690, 151.0940], // Beverly Hills
  "2210": [-33.9640, 151.0680], // Peakhurst
  "2211": [-33.9710, 151.0490], // Padstow Heights
  "2212": [-33.9580, 151.0280], // Revesby
  "2213": [-33.9560, 151.0060], // East Hills
  "2216": [-33.9500, 151.1540], // Rockdale
  "2217": [-33.9600, 151.1590], // Kogarah
  "2218": [-33.9540, 151.1340], // Carlton
  "2219": [-33.9730, 151.1350], // Sans Souci
  "2220": [-33.9610, 151.1120], // Hurstville
  "2221": [-33.9750, 151.0950], // Blakehurst
  "2222": [-33.9780, 151.0790], // Penshurst
  "2223": [-33.9860, 151.0730], // Mortdale
  "2224": [-34.0020, 151.0610], // Sylvania
  "2225": [-34.0130, 151.0460], // Oyster Bay
  "2226": [-34.0210, 151.0570], // Bonnet Bay
  "2227": [-34.0320, 151.0500], // Jannali
  "2228": [-34.0410, 151.0430], // Como
  "2229": [-34.0490, 151.0580], // Caringbah
  "2230": [-34.0630, 151.0810], // Cronulla
  "2232": [-34.0500, 151.0330], // Sutherland
  "2233": [-34.0450, 151.0170], // Engadine
  "2234": [-34.0280, 151.0120], // Menai
  "3000": [-37.8136, 144.9631], // Melbourne CBD
  "3002": [-37.8080, 144.9930], // East Melbourne
  "3003": [-37.8000, 144.9560], // West Melbourne
  "3004": [-37.8390, 144.9780], // St Kilda Road
  "3006": [-37.8260, 144.9560], // Southbank
  "3008": [-37.8120, 144.9380], // Docklands
  "3010": [-37.7980, 144.9610], // University of Melbourne
  "3011": [-37.7870, 144.8830], // Footscray
  "3012": [-37.7860, 144.8580], // Brooklyn
  "3013": [-37.7640, 144.8640], // Yarraville
  "3015": [-37.7620, 144.8870], // Newport
  "3016": [-37.7550, 144.8970], // Williamstown
  "3019": [-37.7540, 144.8440], // Braybrook
  "3020": [-37.7480, 144.8100], // Albion
  "3021": [-37.7350, 144.7870], // St Albans
  "3022": [-37.7370, 144.7620], // Deer Park
  "3023": [-37.7330, 144.7430], // Caroline Springs
  "3024": [-37.7310, 144.6500], // Wyndham Vale
  "3025": [-37.7970, 144.8120], // Altona North
  "3026": [-37.7800, 144.7980], // Laverton
  "3028": [-37.8640, 144.8300], // Altona Beach
  "3029": [-37.7950, 144.7220], // Tarneit
  "3030": [-37.8500, 144.7530], // Werribee
  "3031": [-37.7870, 144.9300], // Flemington
  "3032": [-37.7740, 144.9050], // Ascot Vale
  "3033": [-37.7530, 144.8910], // Keilor East
  "3034": [-37.7400, 144.8730], // Avondale Heights
  "3036": [-37.7180, 144.8420], // Keilor Downs
  "3037": [-37.7040, 144.7890], // Sydenham
  "3038": [-37.6910, 144.8170], // Taylors Lakes
  "3039": [-37.7660, 144.9210], // Moonee Ponds
  "3040": [-37.7540, 144.9380], // Essendon
  "3041": [-37.7440, 144.9170], // Strathmore
  "3042": [-37.7290, 144.8910], // Airport West
  "3043": [-37.6960, 144.8690], // Gladstone Park
  "3044": [-37.7230, 144.9360], // Pascoe Vale
  "3046": [-37.7050, 144.9330], // Glenroy
  "3047": [-37.6820, 144.9380], // Broadmeadows
  "3048": [-37.6600, 144.9270], // Meadow Heights
  "3049": [-37.6390, 144.9060], // Attwood
  "3050": [-37.7860, 144.9600], // Royal Melbourne Hospital
  "3051": [-37.8010, 144.9440], // North Melbourne
  "3052": [-37.7940, 144.9550], // Parkville
  "3053": [-37.8060, 144.9700], // Carlton
  "3054": [-37.7920, 144.9780], // Carlton North
  "3055": [-37.7700, 144.9570], // Brunswick West
  "3056": [-37.7670, 144.9600], // Brunswick
  "3057": [-37.7750, 144.9770], // Brunswick East
  "3058": [-37.7520, 144.9660], // Coburg
  "3060": [-37.7300, 144.9550], // Fawkner
  "3061": [-37.6710, 144.8610], // Campbellfield
  "3064": [-37.5800, 144.9370], // Craigieburn
  "3065": [-37.8020, 144.9770], // Fitzroy
  "3066": [-37.7980, 144.9870], // Collingwood
  "3067": [-37.7950, 144.9930], // Abbotsford
  "3068": [-37.7820, 144.9810], // Clifton Hill
  "3070": [-37.7700, 144.9870], // Northcote
  "3071": [-37.7600, 144.9920], // Thornbury
  "3072": [-37.7420, 144.9990], // Preston
  "3073": [-37.7180, 145.0060], // Reservoir
  "3074": [-37.7080, 145.0190], // Thomastown
  "3075": [-37.6970, 145.0400], // Lalor
  "3076": [-37.6740, 145.0270], // Epping
  "3078": [-37.7740, 145.0020], // Alphington
  "3079": [-37.7640, 145.0200], // Ivanhoe
  "3081": [-37.7410, 145.0300], // Heidelberg
  "3082": [-37.7270, 145.0610], // Mill Park
  "3083": [-37.7070, 145.0630], // Bundoora
  "3084": [-37.7480, 145.0720], // Rosanna
  "3085": [-37.7300, 145.0810], // Macleod
  "3086": [-37.7180, 145.0470], // La Trobe University
  "3088": [-37.7270, 145.1160], // Greensborough
  "3089": [-37.7450, 145.1220], // Diamond Creek
  "3095": [-37.7360, 145.0990], // Eltham
  "3101": [-37.8040, 145.0190], // Kew
  "3102": [-37.7970, 145.0400], // Kew East
  "3103": [-37.8100, 145.0460], // Balwyn
  "3104": [-37.7940, 145.0730], // Balwyn North
  "3105": [-37.7760, 145.0940], // Bulleen
  "3106": [-37.7540, 145.1050], // Templestowe
  "3107": [-37.7600, 145.0870], // Templestowe Lower
  "3108": [-37.7680, 145.0640], // Doncaster
  "3109": [-37.7810, 145.0870], // Doncaster East
  "3111": [-37.7880, 145.1270], // Donvale
  "3113": [-37.7570, 145.1470], // Warrandyte
  "3114": [-37.7540, 145.1800], // Park Orchards
  "3121": [-37.8180, 145.0050], // Richmond
  "3122": [-37.8240, 145.0290], // Hawthorn
  "3123": [-37.8320, 145.0440], // Hawthorn East
  "3124": [-37.8360, 145.0640], // Camberwell
  "3125": [-37.8340, 145.0880], // Burwood
  "3126": [-37.8230, 145.0640], // Canterbury
  "3127": [-37.8120, 145.0740], // Surrey Hills
  "3128": [-37.8090, 145.0990], // Box Hill
  "3129": [-37.8110, 145.1170], // Box Hill North
  "3130": [-37.8140, 145.1330], // Blackburn
  "3131": [-37.8200, 145.1530], // Forest Hill
  "3132": [-37.8060, 145.1520], // Mitcham
  "3133": [-37.8040, 145.1710], // Vermont
  "3134": [-37.7880, 145.1750], // Ringwood
  "3135": [-37.8120, 145.1910], // Bedford Road
  "3136": [-37.7790, 145.2120], // Croydon
  "3137": [-37.7900, 145.2350], // Kilsyth
  "3138": [-37.7750, 145.2580], // Mooroolbark
  "3139": [-37.7680, 145.2960], // Warburton
  "3140": [-37.7860, 145.2970], // Lilydale
  "3141": [-37.8330, 144.9870], // South Yarra
  "3142": [-37.8430, 144.9830], // Hawksburn
  "3143": [-37.8530, 144.9920], // Armadale
  "3144": [-37.8610, 145.0130], // Malvern
  "3145": [-37.8700, 145.0310], // Caulfield
  "3146": [-37.8580, 145.0410], // Glen Iris
  "3147": [-37.8680, 145.0630], // Ashburton
  "3148": [-37.8720, 145.0830], // Glen Waverley
  "3149": [-37.8790, 145.1240], // Mount Waverley
  "3150": [-37.8790, 145.1600], // Glen Waverley
  "3152": [-37.8490, 145.1780], // Wantirna
  "3153": [-37.8430, 145.2050], // Bayswater
  "3156": [-37.8710, 145.2320], // Ferntree Gully
  "3161": [-37.8660, 144.9960], // Caulfield North
  "3162": [-37.8800, 144.9970], // Caulfield South
  "3163": [-37.8870, 145.0130], // Carnegie
  "3165": [-37.8930, 145.0370], // Bentleigh East
  "3166": [-37.8930, 145.0540], // Oakleigh
  "3167": [-37.8990, 145.0870], // Oakleigh East
  "3168": [-37.9130, 145.1090], // Clayton
  "3169": [-37.9290, 145.1430], // Clarinda
  "3170": [-37.9020, 145.1380], // Mulgrave
  "3171": [-37.9270, 145.1220], // Springvale
  "3172": [-37.9440, 145.1440], // Springvale South
  "3173": [-37.9530, 145.1230], // Keysborough
  "3174": [-37.9490, 145.1620], // Noble Park
  "3175": [-37.9700, 145.1670], // Dandenong
  "3177": [-37.9850, 145.2100], // Doveton
  "3178": [-37.8560, 145.2190], // Rowville
  "3179": [-37.8540, 145.2340], // Scoresby
  "3180": [-37.8390, 145.2200], // Knoxfield
  "3181": [-37.8530, 144.9770], // Prahran
  "3182": [-37.8660, 144.9800], // St Kilda
  "3183": [-37.8680, 144.9760], // St Kilda East
  "3184": [-37.8790, 144.9780], // Elwood
  "3185": [-37.8810, 144.9890], // Elsternwick
  "3186": [-37.8910, 144.9900], // Brighton
  "3187": [-37.9000, 144.9930], // Brighton East
  "3188": [-37.9140, 144.9940], // Hampton
  "3189": [-37.9210, 145.0020], // Moorabbin
  "3190": [-37.9270, 144.9880], // Highett
  "3191": [-37.9330, 144.9940], // Sandringham
  "3192": [-37.9310, 145.0170], // Cheltenham
  "3193": [-37.9430, 145.0080], // Beaumaris
  "3194": [-37.9530, 145.0020], // Mentone
  "3195": [-37.9650, 145.0750], // Mordialloc
  "3196": [-37.9780, 145.1070], // Chelsea
  "3197": [-38.0050, 145.1180], // Carrum
  "3198": [-38.0270, 145.1180], // Seaford
  "3199": [-38.0430, 145.1190], // Frankston
  "3200": [-38.0660, 145.1330], // Frankston North
  "3201": [-38.0880, 145.1410], // Carrum Downs
  "3202": [-38.1050, 145.1460], // Heatherton
  "3204": [-37.9160, 145.0210], // Bentleigh
  "3205": [-37.8420, 144.9560], // South Melbourne
  "3206": [-37.8520, 144.9540], // Albert Park
  "3207": [-37.8350, 144.9210], // Port Melbourne
  "4000": [-27.4698, 153.0251], // Brisbane CBD
  "4001": [-27.4698, 153.0251], // Brisbane CBD (PO)
  "4002": [-27.4698, 153.0251], // Brisbane CBD (PO)
  "4003": [-27.4698, 153.0251], // Brisbane CBD (PO)
  "4004": [-27.4530, 153.0450], // Spring Hill
  "4005": [-27.4500, 153.0530], // New Farm
  "4006": [-27.4590, 153.0350], // Fortitude Valley
  "4007": [-27.4350, 153.0590], // Hamilton
  "4008": [-27.4170, 153.0780], // Pinkenba
  "4009": [-27.4280, 153.0680], // Eagle Farm
  "4010": [-27.4290, 153.0420], // Albion
  "4011": [-27.4200, 153.0360], // Clayfield
  "4012": [-27.4010, 153.0320], // Nundah
  "4013": [-27.3870, 153.0440], // Northgate
  "4014": [-27.3850, 153.0680], // Banyo
  "4017": [-27.3520, 153.0780], // Sandgate
  "4018": [-27.3360, 153.0720], // Shorncliffe
  "4019": [-27.2430, 153.0990], // Clontarf
  "4020": [-27.2720, 153.0890], // Redcliffe
  "4021": [-27.2300, 153.0710], // Kippa-Ring
  "4022": [-27.2090, 153.0520], // Rothwell
  "4025": [-27.3850, 153.1430], // Moreton Island
  "4029": [-27.4560, 153.0250], // Royal Brisbane Hospital
  "4030": [-27.4560, 153.0160], // Windsor
  "4031": [-27.4370, 153.0020], // Lutwyche
  "4032": [-27.4190, 153.0070], // Kedron
  "4034": [-27.3940, 153.0130], // Aspley
  "4035": [-27.3750, 153.0050], // Albany Creek
  "4036": [-27.3510, 152.9820], // Bald Hills
  "4037": [-27.3260, 152.9760], // Eatons Hill
  "4051": [-27.4270, 152.9730], // Alderley
  "4053": [-27.4070, 152.9800], // Everton Park
  "4054": [-27.3870, 152.9620], // Arana Hills
  "4055": [-27.3650, 152.9570], // Ferny Hills
  "4059": [-27.4550, 152.9970], // Kelvin Grove
  "4060": [-27.4470, 152.9620], // Ashgrove
  "4061": [-27.4590, 152.9550], // The Gap
  "4064": [-27.4720, 152.9890], // Milton
  "4065": [-27.4350, 152.9430], // Bardon
  "4066": [-27.4770, 152.9650], // Toowong
  "4067": [-27.4880, 152.9790], // St Lucia
  "4068": [-27.4950, 152.9580], // Indooroopilly
  "4069": [-27.5150, 152.9190], // Fig Tree Pocket
  "4070": [-27.5350, 152.8800], // Brookfield
  "4072": [-27.4900, 152.9470], // Taringa
  "4073": [-27.5050, 152.9370], // Kenmore
  "4074": [-27.5220, 152.9170], // Bellbowrie
  "4075": [-27.5130, 152.9690], // Corinda
  "4076": [-27.5290, 152.9520], // Darra
  "4077": [-27.5390, 152.9340], // Sumner
  "4078": [-27.5440, 152.9700], // Forest Lake
  "4101": [-27.4820, 153.0200], // South Brisbane
  "4102": [-27.4930, 153.0430], // Woolloongabba
  "4103": [-27.5090, 153.0360], // Annerley
  "4104": [-27.4970, 153.0170], // Fairfield
  "4105": [-27.5120, 153.0090], // Moorooka
  "4106": [-27.5300, 153.0210], // Rocklea
  "4107": [-27.5410, 153.0350], // Salisbury
  "4108": [-27.5530, 153.0470], // Archerfield
  "4109": [-27.5630, 153.0580], // Sunnybank
  "4110": [-27.5830, 153.0290], // Acacia Ridge
  "4111": [-27.5530, 153.0730], // Nathan
  "4112": [-27.5800, 153.0810], // Kuraby
  "4113": [-27.5800, 153.0570], // Eight Mile Plains
  "4114": [-27.6140, 153.0830], // Woodridge
  "4115": [-27.6260, 153.0950], // Algester
  "4116": [-27.6350, 153.1060], // Calamvale
  "4117": [-27.6480, 153.1180], // Berrinba
  "4118": [-27.6650, 153.1330], // Browns Plains
  "4119": [-27.6860, 153.1570], // Underwood
  "4120": [-27.5020, 153.0510], // Stones Corner
  "4121": [-27.4970, 153.0530], // Holland Park
  "4122": [-27.5270, 153.0700], // Mansfield
  "4123": [-27.5590, 153.1100], // Rochedale
  "4124": [-27.6550, 153.1520], // Greenbank
  "4125": [-27.7050, 153.1660], // Munruben
  "4127": [-27.5860, 153.1230], // Daisy Hill
  "4128": [-27.6090, 153.1460], // Shailer Park
  "4129": [-27.6350, 153.1610], // Loganholme
  "4130": [-27.6660, 153.1830], // Carbrook
  "4131": [-27.5780, 153.1570], // Meadowbrook
  "4132": [-27.6210, 153.1200], // Marsden
  "4133": [-27.6530, 153.1180], // Chambers Flat
  "4151": [-27.4820, 153.0490], // Coorparoo
  "4152": [-27.4980, 153.0770], // Camp Hill
  "4153": [-27.5110, 153.0920], // Belmont
  "4154": [-27.4890, 153.1210], // Gumdale
  "4155": [-27.5080, 153.1500], // Chandler
  "4156": [-27.5250, 153.1130], // Upper Mt Gravatt
  "4157": [-27.5400, 153.1580], // Capalaba
  "4158": [-27.4770, 153.1400], // Lota
  "4159": [-27.4780, 153.1560], // Manly West
  "4160": [-27.4690, 153.1620], // Wynnum West
  "4161": [-27.4600, 153.1670], // Wynnum
  "4163": [-27.4460, 153.1840], // Cleveland
  "4164": [-27.4680, 153.1970], // Thornlands
  "4165": [-27.5100, 153.2050], // Victoria Point
  "4169": [-27.4880, 153.0330], // Kangaroo Point
  "4170": [-27.4650, 153.0780], // Morningside
  "4171": [-27.4730, 153.0640], // Balmoral
  "4172": [-27.4580, 153.0860], // Murarrie
  "4173": [-27.4710, 153.1040], // Tingalpa
  "4174": [-27.4930, 153.1100], // Hemmant
  "4178": [-27.4480, 153.1140], // Lytton
  "4179": [-27.4520, 153.1260], // Lota
  "5000": [-34.9285, 138.6007], // Adelaide CBD
  "5006": [-34.9190, 138.5870], // North Adelaide
  "6000": [-31.9505, 115.8605], // Perth CBD
  "6003": [-31.9410, 115.8700], // Northbridge
  "7000": [-42.8821, 147.3272], // Hobart
  "0800": [-12.4634, 130.8456], // Darwin
  "2600": [-35.2809, 149.1300], // Canberra
  "0000": [-25.2744, 133.7751], // Center of Australia (unknown)
};

const getCoords = (postcode: string): [number, number] | null => {
  return postcodeCoords[postcode] || null;
};

// Scale circle radius based on value
const getRadius = (value: number, max: number, min = 8, maxR = 40) => {
  if (max === 0) return min;
  return min + ((value / max) * (maxR - min));
};

// Intentional data-viz palette: each hex colour maps to an ingredient category
// for Leaflet CircleMarker fills/strokes and the map legend. These do not need
// to follow theme tokens.
const categoryHeatColors: Record<string, string> = {
  "Seafood": "#3b82f6",
  "Produce": "#22c55e",
  "Dairy": "#eab308",
  "Meat": "#ef4444",
  "Herbs": "#10b981",
  "Dry Goods": "#d97706",
  "Pantry": "#f97316",
  "Bakery": "#f59e0b",
  "Beverages": "#06b6d4",
  "Other": "#6b7280",
};

// Auto-fit map to markers
const FitBounds = ({ positions }: { positions: [number, number][] }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
    }
  }, [positions, map]);
  return null;
};

interface AdminHeatmapProps {
  className?: string;
}

const AdminHeatmap = ({ className }: AdminHeatmapProps) => {
  const [activeLayer, setActiveLayer] = useState<"demand" | "vendors" | "both">("both");

  // Demand insights data
  const { data: demandData } = useQuery({
    queryKey: ["admin-heatmap-demand"],
    queryFn: async () => {
      const { data } = await supabase
        .from("demand_insights")
        .select("*")
        .order("total_quantity", { ascending: false });
      return data || [];
    },
  });

  // Vendor locations
  const { data: vendorData } = useQuery({
    queryKey: ["admin-heatmap-vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendor_profiles")
        .select("id, business_name, postcode, delivery_areas, status, categories");
      return data || [];
    },
  });

  // Org venue locations
  const { data: venueData } = useQuery({
    queryKey: ["admin-heatmap-venues"],
    queryFn: async () => {
      const { data } = await supabase
        .from("org_venues")
        .select("id, name, postcode, org_id");
      return data || [];
    },
  });

  // Aggregate demand by postcode
  const demandByPostcode = (demandData || []).reduce<Record<string, { total: number; categories: Record<string, number> }>>((acc, d) => {
    if (!acc[d.postcode]) acc[d.postcode] = { total: 0, categories: {} };
    acc[d.postcode].total += Number(d.total_quantity);
    acc[d.postcode].categories[d.ingredient_category] =
      (acc[d.postcode].categories[d.ingredient_category] || 0) + Number(d.total_quantity);
    return acc;
  }, {});

  const maxDemand = Math.max(...Object.values(demandByPostcode).map(d => d.total), 1);

  // Positions for fit bounds
  const allPositions: [number, number][] = [];
  if (activeLayer !== "vendors") {
    Object.keys(demandByPostcode).forEach(pc => {
      const coords = getCoords(pc);
      if (coords) allPositions.push(coords);
    });
  }
  if (activeLayer !== "demand") {
    (vendorData || []).forEach(v => {
      if (v.postcode) {
        const coords = getCoords(v.postcode);
        if (coords) allPositions.push(coords);
      }
    });
  }

  // Fallback center (Sydney)
  const center: [number, number] = allPositions.length > 0
    ? allPositions[0]
    : [-33.8688, 151.2093];

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Platform Heatmap
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={activeLayer === "demand" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("demand")}
              className="gap-1"
            >
              <Package className="w-3.5 h-3.5" /> Demand
            </Button>
            <Button
              variant={activeLayer === "vendors" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("vendors")}
              className="gap-1"
            >
              <Truck className="w-3.5 h-3.5" /> Vendors
            </Button>
            <Button
              variant={activeLayer === "both" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveLayer("both")}
              className="gap-1"
            >
              <Layers className="w-3.5 h-3.5" /> Both
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] w-full relative">
          <MapContainer
            center={center}
            zoom={10}
            className="h-full w-full z-0"
            style={{ background: "hsl(var(--muted))" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitBounds positions={allPositions} />

            {/* Demand circles */}
            {(activeLayer === "demand" || activeLayer === "both") &&
              Object.entries(demandByPostcode).map(([postcode, data]) => {
                const coords = getCoords(postcode);
                if (!coords) return null;
                const topCategory = Object.entries(data.categories).sort((a, b) => b[1] - a[1])[0];
                const color = topCategory ? (categoryHeatColors[topCategory[0]] || "#f97316") : "#f97316";

                return (
                  <CircleMarker
                    key={`demand-${postcode}`}
                    center={coords}
                    radius={getRadius(data.total, maxDemand)}
                    pathOptions={{
                      color,
                      fillColor: color,
                      fillOpacity: 0.35,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[180px]">
                        <p className="font-bold flex items-center gap-1">
                          <span>📍</span> {postcode === "0000" ? "Unknown" : postcode}
                        </p>
                        <p className="text-muted-foreground mb-2">Ingredient Demand</p>
                        {Object.entries(data.categories)
                          .sort((a, b) => b[1] - a[1])
                          .map(([cat, qty]) => (
                            <div key={cat} className="flex justify-between text-xs py-0.5">
                              <span>{cat}</span>
                              <span className="font-mono font-medium">{qty.toLocaleString()}</span>
                            </div>
                          ))}
                        <div className="border-t mt-2 pt-1 font-semibold text-xs flex justify-between">
                          <span>Total</span>
                          <span>{data.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}

            {/* Vendor markers */}
            {(activeLayer === "vendors" || activeLayer === "both") &&
              (vendorData || []).map((vendor) => {
                const coords = vendor.postcode ? getCoords(vendor.postcode) : null;
                if (!coords) return null;

                return (
                  <CircleMarker
                    key={`vendor-${vendor.id}`}
                    center={coords}
                    radius={10}
                    // Data-viz colour: indigo-500 distinguishes vendor markers from demand circles
                    pathOptions={{
                      color: "#6366f1",
                      fillColor: "#6366f1",
                      fillOpacity: 0.6,
                      weight: 3,
                    }}
                  >
                    <Popup>
                      <div className="text-sm min-w-[160px]">
                        <p className="font-bold flex items-center gap-1">
                          <span>🚚</span> {vendor.business_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{vendor.postcode}</p>
                        {vendor.categories && vendor.categories.length > 0 && (
                          <p className="text-xs mt-1">Categories: {vendor.categories.join(", ")}</p>
                        )}
                        {vendor.status && (
                          <p className="text-xs">Status: {vendor.status}</p>
                        )}
                        {vendor.delivery_areas && (vendor.delivery_areas as string[]).length > 0 && (
                          <p className="text-xs mt-1">
                            Delivers to: {(vendor.delivery_areas as string[]).join(", ")}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
          </MapContainer>
        </div>

        {/* Legend */}
        <div className="p-4 border-t flex flex-wrap items-center gap-4 text-xs">
          {(activeLayer === "demand" || activeLayer === "both") && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-orange-500/40 border-2 border-orange-500" />
              <span className="text-muted-foreground">Ingredient Demand (size = volume)</span>
            </div>
          )}
          {(activeLayer === "vendors" || activeLayer === "both") && (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-indigo-500/60 border-2 border-indigo-500" />
              <span className="text-muted-foreground">Vendor Locations</span>
            </div>
          )}
          {(activeLayer === "demand" || activeLayer === "both") &&
            Object.entries(categoryHeatColors).slice(0, 6).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-muted-foreground">{cat}</span>
              </div>
            ))
          }
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminHeatmap;
