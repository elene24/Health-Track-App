import google.generativeai as genai
import json
import sys
# This line connects the two files
from normalizer import normalize_metrics 

genai.configure(api_key="YOUR_API_KEY")
model = genai.GenerativeModel("gemini-1.5-flash")

def process_and_normalize(pdf_path):
    # 1. AI Extraction
    print(f"Extracting data from: {pdf_path}...")
    file_upload = genai.upload_file(path=pdf_path, mime_type="application/pdf")
    
    prompt = """
You are a professional medical laboratory assistant. 
    Read this medical lab report carefully and extract all test results.

    RULES:
    1. EXTRACT ONLY the actual test result (the patient's value).
    2. IGNORE the reference ranges (normal levels).
    3. If the document is in Georgian or another language, keep the 'original_name' 
       as it appears, but try to identify the English 'name'.
    4. Ensure the 'value' is ONLY a number (remove any ">", "<", or characters).
    5. Ensure the 'unit' matches the standard measurement for that specific test.

    Return ONLY a JSON array of objects:
    [
      {"name": "English Name", "original_name": "Name from PDF", "value": 12.3, "unit": "mg/dL"}
    ]
    """
    
    response = model.generate_content([file_upload, prompt])
    response = model.generate_content([file_upload, prompt])
    
    # --- DEBUGGING LINES ---
    print("--- AI RAW THOUGHTS ---")
    print(response.text) 
    # -----------------------
    
    # Clean and parse AI response
    json_text = response.text.replace('```json', '').replace('```', '').strip()
    raw_data = json.loads(json_text)

    # 2. RUN NORMALIZATION (Your second file's logic)
    # This step fixes the Georgian names into English dashboard names
    clean_data = normalize_metrics(raw_data)
    
    return clean_data

if __name__ == "__main__":
    # If you run: python pdf_processor.py report.pdf
    if len(sys.argv) > 1:
        path = sys.argv[1]
        final_results = process_and_normalize(path)
        print(json.dumps(final_results, indent=2, ensure_ascii=False))