import urllib.request
import os
import time
import copy
import random

# Helper
def dl(url, path):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as r, open(path, 'wb') as f:
            f.write(r.read())
        print(f"Saved {path}")
        time.sleep(0.1)
    except Exception as e:
        print(f"Error {path}: {e}")

def parse_qs(qs):
    return dict(x.split('=') for x in qs.split('&'))

def stringify(p):
    return "&".join([f"{k}={v}" for k, v in p.items()])

# --- 1. Roster Definition (Refined for Professionalism) ---
# "Less concerned", no sunglasses in business.
# Removed 'Squint', 'Eating', 'UpDown' where they might look unprofessional/concerned.

ROSTER = [
    { "role": "CISO", "base": "avatarStyle=Transparent&topType=NoHair&accessoriesType=Blank&facialHairType=BeardMajestic&facialHairColor=Red&clotheType=CollarSweater&clotheColor=Gray02&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Pale" },
    { "role": "Engineer", "base": "avatarStyle=Transparent&topType=LongHairNotTooLong&accessoriesType=Blank&hairColor=SilverGray&facialHairType=Blank&clotheType=Hoodie&clotheColor=Heather&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=DarkBrown" },
    { "role": "Hunter", "base": "avatarStyle=Transparent&topType=ShortHairShortFlat&accessoriesType=Round&hairColor=Blonde&facialHairType=BeardLight&facialHairColor=Auburn&clotheType=ShirtVNeck&clotheColor=Black&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Light" },
    { "role": "Investigator", "base": "avatarStyle=Transparent&topType=Hijab&accessoriesType=Round&hatColor=Blue03&clotheType=ShirtVNeck&clotheColor=Gray02&eyeType=Default&eyebrowType=Default&mouthType=Twinkle&skinColor=Brown" },
    { "role": "Manager", "base": "avatarStyle=Transparent&topType=ShortHairDreads01&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=Hoodie&clotheColor=Gray02&eyeType=Side&eyebrowType=Default&mouthType=Twinkle&skinColor=Black" },
    { "role": "Analyst_Sr", "base": "avatarStyle=Transparent&topType=ShortHairTheCaesarSidePart&accessoriesType=Blank&hairColor=Red&facialHairType=BeardMedium&facialHairColor=Black&clotheType=BlazerSweater&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Twinkle&skinColor=Tanned" },
    { "role": "Developer", "base": "avatarStyle=Transparent&topType=LongHairMiaWallace&accessoriesType=Blank&hairColor=Platinum&facialHairType=Blank&clotheType=ShirtScoopNeck&clotheColor=Gray02&eyeType=Default&eyebrowType=Default&mouthType=Serious&skinColor=Light" },
    { "role": "Admin", "base": "avatarStyle=Transparent&topType=ShortHairShortFlat&accessoriesType=Blank&hairColor=BrownDark&facialHairType=BeardMedium&facialHairColor=BrownDark&clotheType=ShirtCrewNeck&clotheColor=Black&eyeType=Side&eyebrowType=Default&mouthType=Default&skinColor=DarkBrown" },
    { "role": "Analyst_Jr", "base": "avatarStyle=Transparent&topType=LongHairBun&accessoriesType=Prescription02&hairColor=PastelPink&facialHairType=Blank&clotheType=BlazerShirt&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Default&skinColor=Light" },
    { "role": "Architect", "base": "avatarStyle=Transparent&topType=LongHairShavedSides&accessoriesType=Blank&facialHairType=BeardMedium&facialHairColor=BlondeGolden&clotheType=ShirtScoopNeck&clotheColor=Gray02&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Serious&skinColor=Pale" },
    { "role": "Forensics", "base": "avatarStyle=Transparent&topType=LongHairFroBand&accessoriesType=Blank&hairColor=Black&facialHairType=Blank&clotheType=ShirtScoopNeck&clotheColor=Gray02&eyeType=Default&eyebrowType=DefaultNatural&mouthType=Twinkle&skinColor=Black" },
    { "role": "IR", "base": "avatarStyle=Transparent&topType=LongHairDreads&accessoriesType=Blank&hairColor=Brown&facialHairType=Blank&facialHairColor=Brown&clotheType=BlazerShirt&eyeType=Default&eyebrowType=Default&mouthType=Smile&skinColor=Brown" }
]

# --- 2. Random Rules (Business) ---
# Strict professional subset
RULES_BIZ = {
    "topType": ['NoHair','ShortHairShortFlat','ShortHairTheCaesar','ShortHairDreads01','ShortHairShortCurly','ShortHairShortRound','ShortHairSides','ShortHairTheCaesarSidePart','LongHairBob','LongHairStraight','LongHairNotTooLong','LongHairMiaWallace','Hijab','Turban','LongHairBun','LongHairFroBand'],
    "accessoriesType": ['Blank', 'Round', 'Prescription01', 'Prescription02'],
    "facialHairType": ['Blank','BeardMedium','BeardLight','BeardMajestic','MoustacheFancy'],
    "facialHairColor": ['Auburn','Black','Blonde','BlondeGolden','Brown','BrownDark','Platinum','Red'],
    "clotheType": ['BlazerShirt','BlazerSweater','CollarSweater','ShirtCrewNeck','ShirtScoopNeck','ShirtVNeck'],
    "clotheColor": ['Black','Blue01','Blue02','Blue03','Gray01','Gray02','Heather','PastelBlue','White'],
    "eyeType": ['Default', 'Side', 'Happy', 'Serious'], # Removed Squint, Close, Surprised
    "eyebrowType": ['Default', 'DefaultNatural', 'FlatNatural', 'RaisedExcitedNatural'], # Removed Sad, Frown, UpDown
    "mouthType": ['Default', 'Serious', 'Smile', 'Twinkle'], # Removed Concerned, Eating, Sad, Grimace
    "skinColor": ['Tanned','Yellow','Pale','Light','Brown','DarkBrown','Black']
}

# --- 3. Party Rules ---
RULES_PARTY = {
    "accessoriesType": ['Sunglasses', 'Wayfarers', 'Kurt'],
    "clotheType": ['GraphicShirt', 'Overall', 'Hoodie'],
    "mouthType": ['Tongue', 'Vomit', 'Scream', 'Disbelief', 'Grimace', 'Smile'],
    "eyeType": ['Wink', 'WinkWacky', 'Dizzy', 'Hearts', 'EyeRoll', 'Surprised']
}

# --- Execution ---

print("Updating Roster...")
for person in ROSTER:
    role = person["role"]
    base_params = parse_qs(person["base"])
    
    # 1. Business
    dl(f"https://avataaars.io/?{stringify(base_params)}", f"assets/roster/{role}_business.svg")
    
    # 2. Party (Derived)
    party_params = copy.deepcopy(base_params)
    party_params["accessoriesType"] = random.choice(RULES_PARTY["accessoriesType"])
    party_params["clotheType"] = "GraphicShirt"
    party_params["mouthType"] = random.choice(RULES_PARTY["mouthType"])
    party_params["eyeType"] = random.choice(RULES_PARTY["eyeType"])
    
    dl(f"https://avataaars.io/?{stringify(party_params)}", f"assets/roster/{role}_party.svg")

print("Updating Randoms...")
for i in range(60):
    # 1. Business
    p = {
        "avatarStyle": "Transparent",
        "topType": random.choice(RULES_BIZ["topType"]),
        "accessoriesType": random.choice(RULES_BIZ["accessoriesType"]),
        "hairColor": random.choice(RULES_BIZ["facialHairColor"]),
        "facialHairType": random.choice(RULES_BIZ["facialHairType"]),
        "facialHairColor": random.choice(RULES_BIZ["facialHairColor"]),
        "clotheType": random.choice(RULES_BIZ["clotheType"]),
        "clotheColor": random.choice(RULES_BIZ["clotheColor"]),
        "eyeType": random.choice(RULES_BIZ["eyeType"]),
        "eyebrowType": random.choice(RULES_BIZ["eyebrowType"]),
        "mouthType": random.choice(RULES_BIZ["mouthType"]),
        "skinColor": random.choice(RULES_BIZ["skinColor"]),
    }
    if p["topType"] in ['LongHairMiaWallace', 'LongHairNotTooLong', 'LongHairBigHair', 'LongHairBob', 'LongHairCurly', 'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand', 'Hijab', 'Turban', 'WinterHat', 'LongHairBun', 'LongHairFroBand']:
        p["facialHairType"] = "Blank"

    dl(f"https://avataaars.io/?{stringify(p)}", f"assets/random_business/avatar_{i}.svg")
    
    # 2. Party (Derived)
    p_party = copy.deepcopy(p)
    p_party["accessoriesType"] = random.choice(RULES_PARTY["accessoriesType"])
    p_party["clotheType"] = random.choice(RULES_PARTY["clotheType"])
    p_party["mouthType"] = random.choice(RULES_PARTY["mouthType"])
    p_party["eyeType"] = random.choice(RULES_PARTY["eyeType"])
    
    dl(f"https://avataaars.io/?{stringify(p_party)}", f"assets/random_party/avatar_{i}.svg")

print("Done.")