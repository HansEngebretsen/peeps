import urllib.request
import random
import os
import time

OUTPUT_DIR = "assets/avatars"
COUNT = 60

RULES = {
    "topType": ['NoHair','ShortHairShortFlat','ShortHairTheCaesar','ShortHairDreads01','ShortHairShortCurly','ShortHairShortRound','ShortHairSides','ShortHairTheCaesarSidePart','LongHairBob','LongHairStraight','LongHairNotTooLong','LongHairMiaWallace','Hijab','Turban','LongHairBun','LongHairFroBand'],
    "accessoriesType": ['Blank', 'Round', 'Prescription01', 'Prescription02', 'Sunglasses', 'Wayfarers', 'Kurt'],
    "facialHairType": ['Blank','BeardMedium','BeardLight','BeardMajestic','MoustacheFancy'],
    "facialHairColor": ['Auburn','Black','Blonde','BlondeGolden','Brown','BrownDark','Platinum','Red'],
    "clotheType": ['BlazerShirt','BlazerSweater','CollarSweater','ShirtCrewNeck','ShirtScoopNeck','ShirtVNeck','GraphicShirt','Overall','Hoodie'],
    "clotheColor": ['Black','Blue01','Blue02','Blue03','Gray01','Gray02','Heather','PastelBlue','White'],
    "eyeType": ['Default', 'Side', 'Squint', 'Happy', 'Serious', 'Close', 'Surprised', 'Wink', 'WinkWacky', 'Dizzy', 'Hearts', 'EyeRoll'],
    "eyebrowType": ['Default', 'DefaultNatural', 'FlatNatural', 'UpDown', 'UpDownNatural', 'RaisedExcited', 'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural', 'FrownNatural'],
    "mouthType": ['Default', 'Serious', 'Smile', 'Twinkle', 'Concerned', 'Eating', 'Sad', 'Grimace', 'Tongue', 'Vomit', 'Scream', 'Disbelief'],
    "skinColor": ['Tanned','Yellow','Pale','Light','Brown','DarkBrown','Black']
}

def get_rnd(key):
    return random.choice(RULES[key])

print(f"Downloading {COUNT} avatars to {OUTPUT_DIR}...")

for i in range(COUNT):
    params = {
        "avatarStyle": "Transparent",
        "topType": get_rnd("topType"),
        "accessoriesType": get_rnd("accessoriesType"),
        "hairColor": get_rnd("facialHairColor"), # Sharing hair color palette
        "facialHairType": get_rnd("facialHairType"),
        "facialHairColor": get_rnd("facialHairColor"),
        "clotheType": get_rnd("clotheType"),
        "clotheColor": get_rnd("clotheColor"),
        "eyeType": get_rnd("eyeType"),
        "eyebrowType": get_rnd("eyebrowType"),
        "mouthType": get_rnd("mouthType"),
        "skinColor": get_rnd("skinColor"),
    }
    
    # Logic refinements
    if params["topType"] in ['LongHairMiaWallace', 'LongHairNotTooLong', 'LongHairBigHair', 'LongHairBob', 'LongHairCurly', 'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand', 'Hijab', 'Turban', 'WinterHat', 'LongHairBun', 'LongHairFroBand']:
        params["facialHairType"] = "Blank"

    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    url = f"https://avataaars.io/?{query_string}"
    
    filename = f"{OUTPUT_DIR}/avatar_{i}.svg"
    
    try:
        # User-Agent usually required
        req = urllib.request.Request(
            url, 
            data=None, 
            headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/35.0.1916.47 Safari/537.36'
            }
        )
        
        with urllib.request.urlopen(req) as response, open(filename, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
            
        print(f"[{i+1}/{COUNT}] Saved {filename}")
        time.sleep(0.2) # Be nice to the API
        
    except Exception as e:
        print(f"Error downloading {i}: {e}")

print("Done.")
