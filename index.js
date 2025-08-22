const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Load environment variables from .env (if present)
require('dotenv').config();

// Initialize Gemini Pro (require valid API key)
const _googleApiKey = process.env.GOOGLE_API_KEY;
if (!_googleApiKey) {
  console.error('Missing GOOGLE_API_KEY environment variable. Set it in .env or your environment and restart the server.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(_googleApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'), false);
    }
  }
});

// Load knowledge base with caching
let knowledgeBase = null;
let knowledgeBaseCache = null;
let lastLoadTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function loadKnowledgeBase() {
  const now = Date.now();
  
  // Return cached version if still valid
  if (knowledgeBaseCache && (now - lastLoadTime) < CACHE_DURATION) {
    return knowledgeBaseCache;
  }
  
  try {
    const kbPath = path.join(__dirname, 'knowledge-base.json');
    const startTime = Date.now();
    knowledgeBase = JSON.parse(fs.readFileSync(kbPath, 'utf8'));
    const loadTime = Date.now() - startTime;
    
    // Cache the loaded knowledge base
    knowledgeBaseCache = knowledgeBase;
    lastLoadTime = now;
    
    console.log(`Knowledge base loaded successfully in ${loadTime}ms`);
    return knowledgeBase;
  } catch (error) {
    console.error('Error loading knowledge base:', error);
    knowledgeBase = { ckd_terminology: { abbreviations: {} }, clinical_guidelines: {}, appeal_criteria: {} };
    return knowledgeBase;
  }
}

// Initialize knowledge base
knowledgeBase = loadKnowledgeBase();

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

// Define the Task Model
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('CKD Appeals AI Backend is running!');
});

// Health check endpoint with performance metrics
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    knowledgeBase: {
      loaded: !!knowledgeBase,
      cacheValid: knowledgeBaseCache && (Date.now() - lastLoadTime) < CACHE_DURATION,
      lastLoadTime: new Date(lastLoadTime).toISOString()
    },
    database: {
      connected: true // SQLite is file-based, so always connected
    }
  };
  
  res.json(healthData);
});

// Performance monitoring endpoint
app.get('/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    system: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    },
    knowledgeBase: {
      cacheHitRate: knowledgeBaseCache ? 'cached' : 'fresh_load',
      lastLoadTime: new Date(lastLoadTime).toISOString()
    },
    version: '1.0.0'
  };
  
  res.json(metrics);
});

// RAG function to expand medical abbreviations and terms
function expandMedicalTerms(text) {
  const expandedText = text;
  const expansions = [];
  const currentKB = loadKnowledgeBase(); // Use cached version
  const abbreviations = currentKB.ckd_terminology.abbreviations;
  
  // Find and expand abbreviations
  for (const [abbr, fullName] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    if (regex.test(text)) {
      expansions.push({
        abbreviation: abbr,
        fullName: fullName,
        context: text.match(regex)[0]
      });
    }
  }
  
  return {
    originalText: text,
    expandedText: expandedText,
    expansions: expansions
  };
}

// Extract clinical data from text
function extractClinicalData(text) {
  const clinicalData = {
    gfr: null,
    creatinine: null,
    bun: null,
    proteinuria: null,
    bloodPressure: null,
    diabetes: null,
    complications: []
  };
  
  // Extract GFR values
  const gfrMatch = text.match(/(?:GFR|eGFR|glomerular filtration rate)[:\s]*([0-9]+(?:\.[0-9]+)?)\s*(?:mL\/min\/1\.73m²|ml\/min\/1\.73m2)/i);
  if (gfrMatch) {
    clinicalData.gfr = parseFloat(gfrMatch[1]);
  }
  
  // Extract creatinine values
  const crMatch = text.match(/(?:creatinine|Cr)[:\s]*([0-9]+(?:\.[0-9]+)?)\s*(?:mg\/dL|mg\/dl)/i);
  if (crMatch) {
    clinicalData.creatinine = parseFloat(crMatch[1]);
  }
  
  // Extract BUN values
  const bunMatch = text.match(/(?:BUN|blood urea nitrogen)[:\s]*([0-9]+(?:\.[0-9]+)?)\s*(?:mg\/dL|mg\/dl)/i);
  if (bunMatch) {
    clinicalData.bun = parseFloat(bunMatch[1]);
  }
  
  // Extract proteinuria
  const proteinMatch = text.match(/(?:proteinuria|protein)[:\s]*([0-9]+(?:\.[0-9]+)?)\s*(?:g\/day|g\/24h)/i);
  if (proteinMatch) {
    clinicalData.proteinuria = parseFloat(proteinMatch[1]);
  }
  
  // Extract blood pressure
  const bpMatch = text.match(/(?:blood pressure|BP)[:\s]*([0-9]+)\/([0-9]+)\s*(?:mmHg|mm Hg)/i);
  if (bpMatch) {
    clinicalData.bloodPressure = `${bpMatch[1]}/${bpMatch[2]}`;
  }
  
  // Check for diabetes
  if (text.match(/\b(diabetes|DM|T1DM|T2DM)\b/i)) {
    clinicalData.diabetes = true;
  }
  
  // Check for complications
  const currentKB = loadKnowledgeBase(); // Use cached version
  const complications = currentKB.ckd_terminology.complications;
  for (const [complication, details] of Object.entries(complications)) {
    if (text.toLowerCase().includes(complication.toLowerCase())) {
      clinicalData.complications.push({
        name: complication,
        description: details.description
      });
    }
  }
  
  return clinicalData;
}

// POST /upload - Upload and process documents
app.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      });
    }
    
    let extractedText = '';
    
    if (req.file.mimetype === 'application/pdf') {
      // Process PDF
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
    } else if (req.file.mimetype === 'text/plain') {
      // Process text file
      extractedText = req.file.buffer.toString('utf8');
    }
    
    if (!extractedText.trim()) {
      return res.status(400).json({
        error: 'No text content found in the uploaded file'
      });
    }
    
    // Process the extracted text
    const expandedData = expandMedicalTerms(extractedText);
    const clinicalData = extractClinicalData(extractedText);
    
    // Create audit log entry
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action: 'document_upload',
      filename: req.file.originalname,
      fileSize: req.file.size,
      extractedTextLength: extractedText.length,
      expansionsFound: expandedData.expansions.length,
      clinicalDataExtracted: Object.keys(clinicalData).filter(key => clinicalData[key] !== null && clinicalData[key] !== false).length
    };
    
    res.status(200).json({
      message: 'Document processed successfully',
      filename: req.file.originalname,
      extractedText: extractedText.substring(0, 500) + (extractedText.length > 500 ? '...' : ''),
      expandedData: expandedData,
      clinicalData: clinicalData,
      auditEntry: auditEntry
    });
    
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({
      error: 'Error processing document: ' + error.message
    });
  }
});

// POST /analyze - Analyze clinical data and generate decision using Gemini Pro
app.post('/analyze', async (req, res) => {
  try {
    const { clinicalData, extractedText } = req.body;
    
    if (!clinicalData || !extractedText) {
      return res.status(400).json({
        error: 'Clinical data and extracted text are required'
      });
    }
    
    // Prepare context for Gemini Pro
    const clinicalContext = {
      gfr: clinicalData.gfr,
      creatinine: clinicalData.creatinine,
      bun: clinicalData.bun,
      proteinuria: clinicalData.proteinuria,
      bloodPressure: clinicalData.bloodPressure,
      diabetes: clinicalData.diabetes,
      complications: clinicalData.complications.map(c => c.name)
    };
    
    // Create structured prompt for Gemini Pro
    const prompt = `
You are an expert medical reviewer specializing in Chronic Kidney Disease (CKD) insurance appeals. Your task is to analyze the provided clinical data and make a tri-state decision for a CKD appeal.

CLINICAL DATA:
${JSON.stringify(clinicalContext, null, 2)}

EXTRACTED TEXT (first 500 characters):
${extractedText.substring(0, 500)}

CKD APPEAL DECISION CRITERIA:
- APPROVE: GFR < 15 mL/min/1.73m², significant proteinuria (>3.5 g/day), severe complications, or clear progression despite optimal management
- REJECT: GFR > 60 mL/min/1.73m² without complications, reversible causes, insufficient documentation, or adequate response to therapy
- REVIEW: GFR 15-59 mL/min/1.73m², moderate proteinuria (1-3.5 g/day), incomplete records, or conflicting findings

Please provide your analysis in the following JSON format:
{
  "decision": "APPROVE|REJECT|REVIEW",
  "confidence": 0.0-1.0,
  "rationale": ["reason1", "reason2", "reason3"],
  "key_factors": ["factor1", "factor2"],
  "recommendations": ["recommendation1", "recommendation2"]
}

Focus on evidence-based decision making and provide clear rationale for your classification.
`;

    let decisionMetadata;
    let auditEntry;
    
    try {
      // Call Gemini Pro API
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = await response.text();

      // Helper: try to extract JSON from AI text (strip markdown/code fences)
      function extractJSONFromText(t) {
        if (!t || typeof t !== 'string') throw new SyntaxError('AI response is not text');
        // Remove common markdown code fences
        let cleaned = t.replace(/```\s*json\s*/gi, '');
        cleaned = cleaned.replace(/```/g, '');
        cleaned = cleaned.trim();

        // Try to locate the first JSON object in the cleaned string
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
          const candidate = cleaned.substring(firstBrace, lastBrace + 1);
          try {
            return JSON.parse(candidate);
          } catch (e) {
            // fallthrough to other heuristics
          }
        }

        // Try to extract inside a ```json ... ``` block if present
        const mdJson = t.match(/```json([\s\S]*?)```/i);
        if (mdJson && mdJson[1]) {
          const inner = mdJson[1].trim();
          try { return JSON.parse(inner); } catch (e) {}
        }

        // As a last resort, throw with the raw text attached for debugging
        const err = new SyntaxError('Unable to parse JSON from AI response');
        err.raw = t;
        throw err;
      }

      // Parse Gemini Pro response (robust extraction)
      const aiResponse = extractJSONFromText(text);
      
      decisionMetadata = {
        decision: aiResponse.decision,
        confidence: aiResponse.confidence,
        rationale: aiResponse.rationale,
        keyFactors: aiResponse.key_factors,
        recommendations: aiResponse.recommendations,
        timestamp: new Date().toISOString(),
        clinicalData: clinicalData,
        extractedTextLength: extractedText.length,
        aiModel: 'gemini-pro'
      };
      
      auditEntry = {
        timestamp: new Date().toISOString(),
        action: 'ai_decision_generated',
        decision: aiResponse.decision,
        confidence: aiResponse.confidence,
        rationale: aiResponse.rationale,
        clinicalData: clinicalData,
        aiModel: 'gemini-pro'
      };
      
    } catch (aiError) {
      if (aiError && aiError.raw) {
        console.error('Gemini Pro API parsing error. Raw AI output:\n', aiError.raw);
      }
      console.error('Gemini Pro API error:', aiError);
      
      // Fallback to rule-based decision logic
      let decision = 'REVIEW';
      let confidence = 0.5;
      let rationale = [];
      
      // Check GFR-based criteria
      if (clinicalData.gfr) {
        if (clinicalData.gfr < 15) {
          decision = 'APPROVE';
          confidence = 0.9;
          rationale.push(`GFR of ${clinicalData.gfr} mL/min/1.73m² indicates end-stage renal disease`);
        } else if (clinicalData.gfr >= 60) {
          decision = 'REJECT';
          confidence = 0.8;
          rationale.push(`GFR of ${clinicalData.gfr} mL/min/1.73m² indicates normal or mildly reduced kidney function`);
        } else {
          decision = 'REVIEW';
          confidence = 0.6;
          rationale.push(`GFR of ${clinicalData.gfr} mL/min/1.73m² requires additional clinical context`);
        }
      }
      
      // Check proteinuria
      if (clinicalData.proteinuria) {
        if (clinicalData.proteinuria > 3.5) {
          decision = 'APPROVE';
          confidence = Math.max(confidence, 0.85);
          rationale.push(`Significant proteinuria of ${clinicalData.proteinuria} g/day indicates severe kidney damage`);
        } else if (clinicalData.proteinuria < 1.0) {
          if (decision === 'APPROVE') {
            decision = 'REVIEW';
            confidence = 0.7;
          }
          rationale.push(`Mild proteinuria of ${clinicalData.proteinuria} g/day may not require immediate intervention`);
        }
      }
      
      // Check complications
      if (clinicalData.complications && clinicalData.complications.length > 0) {
        decision = 'APPROVE';
        confidence = Math.max(confidence, 0.8);
        rationale.push(`Presence of complications: ${clinicalData.complications.map(c => c.name).join(', ')}`);
      }
      
      decisionMetadata = {
        decision: decision,
        confidence: confidence,
        rationale: rationale,
        keyFactors: ['Rule-based fallback due to AI API error'],
        recommendations: ['Consider manual review'],
        timestamp: new Date().toISOString(),
        clinicalData: clinicalData,
        extractedTextLength: extractedText.length,
        aiModel: 'rule-based-fallback'
      };
      
      auditEntry = {
        timestamp: new Date().toISOString(),
        action: 'rule_based_decision_generated',
        decision: decision,
        confidence: confidence,
        rationale: rationale,
        clinicalData: clinicalData,
        aiModel: 'rule-based-fallback',
        error: aiError.message
      };
    }
    
    res.status(200).json({
      message: 'Analysis completed successfully',
      decision: decisionMetadata,
      auditEntry: auditEntry
    });
    
  } catch (error) {
    console.error('Error analyzing clinical data:', error);
    res.status(500).json({
      error: 'Error analyzing clinical data: ' + error.message
    });
  }
});

// GET /knowledge-base - Get knowledge base information
app.get('/knowledge-base', (req, res) => {
  try {
    const currentKB = loadKnowledgeBase(); // Use cached version
    res.status(200).json({
      message: 'Knowledge base retrieved successfully',
      terminology: {
        abbreviationCount: Object.keys(currentKB.ckd_terminology.abbreviations).length,
        stageCount: Object.keys(currentKB.ckd_terminology.stages).length,
        complicationCount: Object.keys(currentKB.ckd_terminology.complications).length
      },
      guidelines: {
        monitoringFrequency: Object.keys(currentKB.clinical_guidelines.monitoring_frequency).length,
        treatmentTargets: Object.keys(currentKB.clinical_guidelines.treatment_targets).length,
        medicationAdjustments: Object.keys(currentKB.clinical_guidelines.medication_adjustments).length
      },
      appealCriteria: {
        approvalIndicators: Object.keys(currentKB.appeal_criteria.approval_indicators).length,
        rejectionIndicators: Object.keys(currentKB.appeal_criteria.rejection_indicators).length,
        reviewRequired: Object.keys(currentKB.appeal_criteria.review_required).length
      },
      cache: {
        cached: knowledgeBaseCache && (Date.now() - lastLoadTime) < CACHE_DURATION,
        lastLoadTime: new Date(lastLoadTime).toISOString()
      }
    });
  } catch (error) {
    console.error('Error retrieving knowledge base:', error);
    res.status(500).json({
      error: 'Error retrieving knowledge base: ' + error.message
    });
  }
});

// POST /tasks - Create new task
app.post('/tasks', async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Validate required fields
    if (!title || title.trim() === '') {
      return res.status(400).json({
        error: 'Title is required and cannot be empty'
      });
    }
    
    // Create the task
    const task = await Task.create({
      title: title.trim(),
      description: description ? description.trim() : null,
      completed: false
    });
    
    // Return the created task with 201 status
    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      error: 'Internal server error while creating task'
    });
  }
});

// GET /tasks - Retrieve all tasks
app.get('/tasks', async (req, res) => {
  try {
    const tasks = await Task.findAll({
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      message: 'Tasks retrieved successfully',
      count: tasks.length,
      tasks: tasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }))
    });
    
  } catch (error) {
    console.error('Error retrieving tasks:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving tasks'
    });
  }
});

// GET /tasks/:id - Retrieve a specific task by ID
app.get('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID. Must be a number.'
      });
    }
    
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }
    
    res.status(200).json({
      message: 'Task retrieved successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error retrieving task:', error);
    res.status(500).json({
      error: 'Internal server error while retrieving task'
    });
  }
});

// PUT /tasks/:id - Update an existing task
app.put('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    const { title, description, completed } = req.body;
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID. Must be a number.'
      });
    }
    
    // Find the task
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }
    
    // Prepare update data (only update provided fields)
    const updateData = {};
    
    if (title !== undefined) {
      if (!title || title.trim() === '') {
        return res.status(400).json({
          error: 'Title cannot be empty if provided'
        });
      }
      updateData.title = title.trim();
    }
    
    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }
    
    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({
          error: 'Completed must be a boolean value'
        });
      }
      updateData.completed = completed;
    }
    
    // Update the task
    await task.update(updateData);
    
    // Return the updated task
    res.status(200).json({
      message: 'Task updated successfully',
      task: {
        id: task.id,
        title: task.title,
        description: task.description,
        completed: task.completed,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      error: 'Internal server error while updating task'
    });
  }
});

// DELETE /tasks/:id - Delete an existing task
app.delete('/tasks/:id', async (req, res) => {
  try {
    const taskId = parseInt(req.params.id);
    
    if (isNaN(taskId)) {
      return res.status(400).json({
        error: 'Invalid task ID. Must be a number.'
      });
    }
    
    // Find the task
    const task = await Task.findByPk(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: 'Task not found'
      });
    }
    
    // Delete the task
    await task.destroy();
    
    // Return 204 No Content status on successful deletion
    res.status(204).send();
    
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      error: 'Internal server error while deleting task'
    });
  }
});

// Initialize database and start server
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync();
    console.log('Database synced successfully. Tasks table created/updated.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Knowledge base: GET http://localhost:${PORT}/knowledge-base`);
      console.log(`Upload document: POST http://localhost:${PORT}/upload`);
      console.log(`Analyze data: POST http://localhost:${PORT}/analyze`);
      console.log(`Create task: POST http://localhost:${PORT}/tasks`);
      console.log(`Get all tasks: GET http://localhost:${PORT}/tasks`);
      console.log(`Get task by ID: GET http://localhost:${PORT}/tasks/:id`);
      console.log(`Update task: PUT http://localhost:${PORT}/tasks/:id`);
      console.log(`Delete task: DELETE http://localhost:${PORT}/tasks/:id`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
})();

module.exports = { sequelize, Task, app };
