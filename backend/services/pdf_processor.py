import google.generativeai as genai
import json
import sys
import os # Added this
from dotenv import load_dotenv
from normalizer import normalize_metrics 

# Correctly call the function to load .env
load_dotenv() 

# Use os.getenv to grab the key
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

model = genai.GenerativeModel("gemini-2.0-flash")

def process_and_normalize(pdf_path):
    # This will now print in your Node terminal when called
    print(f"Extracting data from: {pdf_path}...")
    
    file_upload = genai.upload_file(path=pdf_path, mime_type="application/pdf")
    
    prompt = """
    You are a professional medical laboratory assistant. 
    Read this medical lab report carefully and extract all test results.

    RULES:
    1. EXTRACT ONLY the actual test result (the patient's value).
    2. IGNORE the reference ranges (normal levels).
    3. If the document is in Georgian or another language, keep the 'original_name'.
    4. Ensure 'value' is ONLY a number (remove ">", "<", etc.).
    5. Return ONLY a JSON array of objects.
    """
    
    response = model.generate_content([file_upload, prompt])
    
    # Debugging: This will show you what the AI is thinking
    print("--- AI RAW THOUGHTS ---")
    print(response.text) 
    
    json_text = response.text.replace('```json', '').replace('```', '').strip()
    raw_data = json.loads(json_text)

    clean_data = normalize_metrics(raw_data)
    return clean_data

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = sys.argv[1]
        final_results = process_and_normalize(path)
        # This output is caught by Node.js
        print(json.dumps(final_results))