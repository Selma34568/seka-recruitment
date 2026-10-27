
import re

CITIES = {
    "warszawa": "Warszawa",
    "warsaw": "Warszawa",
    "kraków": "Kraków",
    "krakow": "Kraków",
    "cracow": "Kraków",
    "poznań": "Poznań",
    "poznan": "Poznań",
    "wrocław": "Wrocław",
    "wroclaw": "Wrocław",
    "katowice": "Katowice",
}

def parse_application_email(subject: str, body: str):
    text = f"{subject}\n{body}"

    found_cities = {
        canonical
        for name, canonical in CITIES.items()
        if re.search(
            rf"(?<!\w){re.escape(name)}(?!\w)",
            text,
            flags=re.IGNORECASE,
        )
    }

    city = (
        next(iter(found_cities))
        if len(found_cities) == 1
        else None
    )

    position = None

    patterns = [
        r"(?:position|stanowisko|rola)\s*:\s*([^\n,;]+)",
        r"(?:application for|aplikacja na stanowisko|"
        r"aplikuję na stanowisko)\s+([^\n,;]+)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            position = match.group(1).strip(" .")
            break

    return {
        "city": city,
        "position": position,
    }
