# CKD Appeals AI - Proof of Concept

A comprehensive AI-driven system for analyzing Chronic Kidney Disease (CKD) insurance appeals using document processing, RAG-powered knowledge retrieval, and tri-state decision making.

## 🎯 Overview

The CKD Appeals AI system addresses the critical pain point of manual, inconsistent, and time-consuming review of patient medical data for CKD insurance appeals. This POC provides a streamlined solution that:

- **Ingests** raw patient documents (PDFs, text files)
- **Extracts** clinical data automatically using RAG technology
- **Analyzes** CKD-specific information with domain expertise
- **Generates** intelligent tri-state decisions (Approve/Reject/Review)
- **Provides** full explainability and audit trails

## 🏗️ Architecture

### Backend (Node.js + Express)
- **Document Processing**: PDF parsing and text extraction
- **RAG System**: Medical abbreviation expansion and knowledge retrieval
- **Decision Engine**: Tri-state classification with confidence scoring
- **API Endpoints**: RESTful APIs for all functionality
- **Database**: SQLite with Sequelize ORM
- **Audit System**: JSON-based logging for compliance

### Frontend (React + Tailwind CSS)
- **Upload Interface**: Drag-and-drop file upload
- **Results Display**: Clinical data visualization
- **Decision Dashboard**: Color-coded tri-state output
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live API integration

### Knowledge Base
- **100+ Medical Abbreviations**: CKD-specific terminology
- **Clinical Guidelines**: Monitoring frequencies and treatment targets
- **Appeal Criteria**: Approval/rejection indicators
- **CKD Staging**: Complete staging information
- **Complications**: Detailed complication descriptions

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. **Clone and install dependencies:**
```bash
cd ckd-appeals-ai
npm install
cd frontend
npm install
```

2. **Start the backend server:**
```bash
cd ..
npm start
```

3. **Start the frontend (in a new terminal):**
```bash
cd frontend
npm start
```

4. **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 📋 API Endpoints

### Core Endpoints
- `GET /health` - Server health check
- `GET /knowledge-base` - Knowledge base information
- `POST /upload` - Upload and process documents
- `POST /analyze` - Generate decision analysis

### Task Management
- `GET /tasks` - Retrieve all tasks
- `POST /tasks` - Create new task
- `GET /tasks/:id` - Get specific task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task

## 🧪 Testing

Run the integration test suite:
```bash
node test-integration.js
```

This will test:
- Server health and connectivity
- Knowledge base loading
- Document processing
- Decision analysis
- Task management

## 📊 Features

### Document Processing
- **PDF Support**: Automatic text extraction from PDF files
- **Text Files**: Direct processing of .txt files
- **File Size Limit**: 10MB maximum
- **Format Validation**: Automatic file type checking

### Clinical Data Extraction
- **GFR Values**: Automatic detection and parsing
- **Creatinine Levels**: Blood test result extraction
- **BUN Values**: Blood urea nitrogen detection
- **Proteinuria**: Protein excretion measurement
- **Blood Pressure**: BP reading extraction
- **Diabetes Status**: Diabetes detection
- **Complications**: CKD complication identification

### Decision Engine
- **Tri-State Output**: Approve/Reject/Review decisions
- **Confidence Scoring**: Percentage-based confidence levels
- **Rationale Generation**: Detailed decision explanations
- **Clinical Criteria**: Evidence-based decision logic

### User Interface
- **Professional Design**: Medical-grade interface
- **Color Coding**: Green (Approve), Red (Reject), Yellow (Review)
- **Responsive Layout**: Works on all screen sizes
- **Tabbed Navigation**: Intuitive workflow
- **Real-time Feedback**: Live processing updates

## 🔒 Security & Compliance

### Data Privacy
- **No PHI Storage**: Transient processing only
- **Memory Storage**: Files processed in memory
- **Audit Logging**: Comprehensive action tracking
- **HTTPS Ready**: Secure communication support

### Compliance Features
- **Audit Trails**: Complete decision logging
- **Timestamp Tracking**: All actions timestamped
- **User Action Logging**: Comprehensive activity records
- **Decision Rationale**: Full explainability

## 📈 Performance Metrics

### Success Targets
- **50% Reduction** in manual review time
- **75% Accuracy** in tri-state classification
- **80%+ Usability** scores from clinical users
- **<3 Second** response time for decisions

### Scalability
- **10-100 Concurrent Users**: Automatic scaling
- **Serverless Ready**: Vercel/Netlify deployment
- **Global Access**: CDN-based knowledge base
- **Minimal Infrastructure**: Lightweight deployment

## 🛠️ Development

### Project Structure
```
ckd-appeals-ai/
├── index.js              # Main backend server
├── knowledge-base.json   # CKD knowledge base
├── package.json          # Backend dependencies
├── frontend/             # React frontend
│   ├── src/
│   │   ├── App.js        # Main React component
│   │   └── index.css     # Tailwind CSS
│   └── package.json      # Frontend dependencies
├── test-integration.js   # Integration tests
└── README.md            # This file
```

### Key Technologies
- **Backend**: Node.js, Express, Sequelize, SQLite
- **Frontend**: React, Tailwind CSS
- **Document Processing**: pdf-parse, multer
- **Knowledge Base**: JSON-based RAG system
- **Testing**: Custom integration test suite

## 🚀 Deployment

### Local Development
```bash
# Backend
npm start

# Frontend
cd frontend && npm start
```

### Production Deployment
1. **Backend**: Deploy to Vercel/Netlify as serverless functions
2. **Frontend**: Build and deploy to static hosting
3. **Database**: Use production SQLite or migrate to PostgreSQL
4. **Knowledge Base**: Host on CDN for global access

### Environment Variables
```bash
PORT=3001                    # Backend port
NODE_ENV=production          # Environment
CORS_ORIGIN=http://localhost:3000  # Frontend URL
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is a proof of concept for CKD appeal analysis. Please ensure compliance with healthcare regulations and data privacy laws when using in production.

## 🆘 Support

For questions or issues:
1. Check the integration tests: `node test-integration.js`
2. Review the API documentation above
3. Check server logs for error details
4. Verify file upload requirements

---

**CKD Appeals AI** - Streamlining insurance appeal processing with AI-powered clinical analysis.
