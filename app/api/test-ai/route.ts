import { type NextRequest, NextResponse } from "next/server"
import { generateContextualQuestions, enhanceResponse } from "@/lib/anthropic-helper"
import { currentUser } from "@clerk/nextjs/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET - Test page for AI endpoints
 * POST - Run actual tests
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user using Clerk session cookies (for browser access)
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    // Check if API key is configured
    const apiKeyConfigured = !!process.env.home_visit_general_key

    // Return HTML test page
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>AI Endpoints Test</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 1200px;
      margin: 40px auto;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    h1 { color: #5E3989; }
    .status {
      padding: 10px;
      border-radius: 4px;
      margin: 10px 0;
    }
    .status.success { background: #d4edda; color: #155724; }
    .status.error { background: #f8d7da; color: #721c24; }
    .status.info { background: #d1ecf1; color: #0c5460; }
    .test-section {
      margin: 30px 0;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .test-section h2 {
      margin-top: 0;
      color: #5E3989;
    }
    button {
      background: #5E3989;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      cursor: pointer;
      margin: 5px;
    }
    button:hover { background: #4a2d6f; }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    textarea, input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-family: inherit;
      margin: 5px 0;
    }
    textarea { min-height: 100px; }
    .result {
      margin-top: 15px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 4px;
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 12px;
    }
    .loading { color: #666; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🤖 AI Endpoints Test Page</h1>
    
    <div class="status ${apiKeyConfigured ? 'success' : 'error'}">
      <strong>API Key Status:</strong> ${apiKeyConfigured ? '✅ Configured' : '❌ Not Found'}
      <br>
      <small>Environment Variable: home_visit_general_key</small>
    </div>

    <div class="test-section">
      <h2>1. Test Question Generation</h2>
      <p>Generate context-aware questions for a field type:</p>
      
      <label>Field Type:</label>
      <select id="fieldType" style="width: 100%; padding: 8px; margin: 5px 0;">
        <option value="behaviors">Behaviors</option>
        <option value="school">School Performance</option>
        <option value="medical">Medical/Therapy</option>
      </select>

      <label>Child Name (optional):</label>
      <input type="text" id="childName" placeholder="Test Child" />

      <label>Child Age (optional):</label>
      <input type="number" id="childAge" placeholder="10" />

      <label>Placement Duration in Months (optional):</label>
      <input type="number" id="placementDuration" placeholder="6" />

      <button onclick="testQuestions()">Generate Questions</button>
      <div id="questionsResult" class="result" style="display: none;"></div>
    </div>

    <div class="test-section">
      <h2>2. Test Response Enhancement</h2>
      <p>Enhance a brief response to be more professional:</p>
      
      <label>Original Text:</label>
      <textarea id="originalText" placeholder="Child seems fine, school is okay">Child seems fine, school is okay</textarea>

      <label>Field Type:</label>
      <select id="enhanceFieldType" style="width: 100%; padding: 8px; margin: 5px 0;">
        <option value="behaviors">Behaviors</option>
        <option value="school">School Performance</option>
        <option value="medical">Medical/Therapy</option>
      </select>

      <button onclick="testEnhancement()">Enhance Response</button>
      <div id="enhanceResult" class="result" style="display: none;"></div>
    </div>
  </div>

  <script>
    async function testQuestions() {
      const resultDiv = document.getElementById('questionsResult');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<span class="loading">Generating questions...</span>';

      const fieldType = document.getElementById('fieldType').value;
      const childName = document.getElementById('childName').value;
      const childAge = document.getElementById('childAge').value;
      const placementDuration = document.getElementById('placementDuration').value;

      const context = {};
      if (childName) context.childName = childName;
      if (childAge) context.childAge = parseInt(childAge);
      if (placementDuration) context.placementDuration = parseInt(placementDuration);

      try {
        const response = await fetch('/api/visit-forms/ai-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fieldType, context })
        });

        const data = await response.json();
        
        if (data.success) {
          resultDiv.innerHTML = '<strong>✅ Success!</strong>\\n\\n' +
            '<strong>Generated Questions:</strong>\\n' +
            data.questions.map((q, i) => \`\${i + 1}. \${q}\`).join('\\n');
        } else {
          resultDiv.innerHTML = '<strong>❌ Error:</strong>\\n' + JSON.stringify(data, null, 2);
        }
      } catch (error) {
        resultDiv.innerHTML = '<strong>❌ Request Failed:</strong>\\n' + error.message;
      }
    }

    async function testEnhancement() {
      const resultDiv = document.getElementById('enhanceResult');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<span class="loading">Enhancing response...</span>';

      const originalText = document.getElementById('originalText').value;
      const fieldType = document.getElementById('enhanceFieldType').value;

      try {
        const response = await fetch('/api/visit-forms/ai-enhance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalText, fieldType })
        });

        const data = await response.json();
        
        if (data.success) {
          resultDiv.innerHTML = '<strong>✅ Success!</strong>\\n\\n' +
            '<strong>Original:</strong>\\n' + data.originalText + '\\n\\n' +
            '<strong>Enhanced:</strong>\\n' + data.enhancedText;
        } else {
          resultDiv.innerHTML = '<strong>❌ Error:</strong>\\n' + JSON.stringify(data, null, 2);
        }
      } catch (error) {
        resultDiv.innerHTML = '<strong>❌ Request Failed:</strong>\\n' + error.message;
      }
    }
  </script>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    })
  } catch (error) {
    console.error("❌ [TEST-AI] Error:", error)
    return NextResponse.json(
      {
        error: "Failed to load test page",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

