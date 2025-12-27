import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { fileContent, fileName } = await req.json();

    if (!fileContent) {
      return new Response(
        JSON.stringify({ success: false, error: 'File content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ success: false, error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Parsing health file: ${fileName}, content length: ${fileContent.length}`);

    const systemPrompt = `You are a medical data extraction assistant. Extract health metrics from blood test results or medical reports.

For each metric found, extract:
- metric_name: The name of the metric (e.g., "Blood Glucose", "Total Cholesterol", "Hemoglobin", "HDL Cholesterol", "LDL Cholesterol", "Triglycerides", "HbA1c", "Creatinine", "Urea", "Vitamin D", "TSH", "T3", "T4", "Iron", "Ferritin", "Vitamin B12", "Red Blood Cells", "White Blood Cells", "Platelets")
- metric_value: The numeric value (just the number)
- unit: The unit of measurement (e.g., "mg/dL", "g/dL", "%", "mmol/L", "ng/mL", "mIU/L", "million/µL", "thousand/µL")
- test_date: The date of the test if mentioned (in YYYY-MM-DD format). If not found, use null.

Return ONLY a JSON object with this exact structure:
{
  "success": true,
  "test_date": "YYYY-MM-DD or null",
  "metrics": [
    { "metric_name": "...", "metric_value": 123.45, "unit": "..." }
  ]
}

If no valid health metrics are found, return:
{
  "success": false,
  "error": "No health metrics found in the document"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Extract health metrics from this document:\n\n${fileContent}` }
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI usage limit reached. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: "Failed to process file" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response");
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse file content" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", content);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse extracted data" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Successfully parsed health data:", JSON.stringify(parsedResult));

    return new Response(
      JSON.stringify(parsedResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in parse-health-file:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
