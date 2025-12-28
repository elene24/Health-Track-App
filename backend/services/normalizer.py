# backend/services/normalizer.py

# Mapping Georgian/Abbreviated names to your official Dashboard names
METRIC_MAPPING = {
    # Coagulation Panel (from your PDF)
    "პროთრომბინის დრო pt": "Prothrombin Time",
    "პროთრომბინის ინდექსი pi": "Prothrombin Index",
    "inr": "INR",
    "ფიბრინოგენი": "Fibrinogen",
    "fibr": "Fibrinogen",
    
    # Common Blood Work
    "ჰემოგლობინი": "Hemoglobin",
    "hgb": "Hemoglobin",
    "hb": "Hemoglobin",
    "wbc": "WBC Count"
}

def normalize_metrics(extracted_data):
    """
    Takes a list of metrics from the AI and standardizes their names.
    Input: [{"name": "პროთრომბინის დრო PT", "value": 11, "unit": "sec"}]
    """
    for entry in extracted_data:
        # Clean the name: lowercase and strip extra spaces
        raw_name = entry.get('name', '').lower().strip()
        
        # Check if the name (or a part of it) is in our mapping
        # We use a 'lookup' to handle names like "Hemoglobin (Hgb)"
        matched_name = None
        for key in METRIC_MAPPING:
            if key in raw_name:
                matched_name = METRIC_MAPPING[key]
                break
        
        # Add the standardized name to the entry
        entry['standard_name'] = matched_name or entry['name']
        
    return extracted_dat