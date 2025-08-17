const fs = require('fs');
const path = require('path');

// Test data
const testText = `
Patient Medical Record
Date: 2024-01-15

Lab Results:
- GFR: 12 mL/min/1.73m²
- Creatinine: 4.2 mg/dL
- BUN: 45 mg/dL
- Proteinuria: 4.1 g/day
- Blood Pressure: 145/95 mmHg

Diagnosis: CKD Stage 5 with DM and HTN
Complications: Anemia, fluid overload

Medications:
- ACE inhibitor
- ESA therapy
- Iron supplementation
`;

console.log('🧪 CKD Appeals AI - System Integration Test');
console.log('==========================================\n');

// Test 1: Check if server is running
async function testServerHealth() {
  console.log('1. Testing Server Health...');
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    if (data.status === 'OK') {
      console.log('✅ Server is healthy and running');
      return true;
    } else {
      console.log('❌ Server health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Server not accessible:', error.message);
    return false;
  }
}

// Test 2: Test knowledge base
async function testKnowledgeBase() {
  console.log('\n2. Testing Knowledge Base...');
  try {
    const response = await fetch('http://localhost:3001/knowledge-base');
    const data = await response.json();
    if (data.terminology && data.guidelines && data.appealCriteria) {
      console.log('✅ Knowledge base loaded successfully');
      console.log(`   - Abbreviations: ${data.terminology.abbreviationCount}`);
      console.log(`   - Guidelines: ${data.guidelines.monitoringFrequency} monitoring frequencies`);
      console.log(`   - Appeal criteria: ${data.appealCriteria.approvalIndicators} approval indicators`);
      return true;
    } else {
      console.log('❌ Knowledge base incomplete');
      return false;
    }
  } catch (error) {
    console.log('❌ Knowledge base test failed:', error.message);
    return false;
  }
}

// Test 3: Test document processing
async function testDocumentProcessing() {
  console.log('\n3. Testing Document Processing...');
  try {
    const formData = new FormData();
    const blob = new Blob([testText], { type: 'text/plain' });
    formData.append('document', blob, 'test-record.txt');

    const response = await fetch('http://localhost:3001/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data.clinicalData && data.expandedData) {
      console.log('✅ Document processing successful');
      console.log(`   - GFR extracted: ${data.clinicalData.gfr}`);
      console.log(`   - Complications found: ${data.clinicalData.complications.length}`);
      console.log(`   - Abbreviations expanded: ${data.expandedData.expansions.length}`);
      return data;
    } else {
      console.log('❌ Document processing failed');
      return null;
    }
  } catch (error) {
    console.log('❌ Document processing test failed:', error.message);
    return null;
  }
}

// Test 4: Test decision analysis
async function testDecisionAnalysis(uploadResult) {
  console.log('\n4. Testing Decision Analysis...');
  try {
    const response = await fetch('http://localhost:3001/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clinicalData: uploadResult.clinicalData,
        extractedText: uploadResult.extractedText,
      }),
    });

    const data = await response.json();
    if (data.decision && data.auditEntry) {
      console.log('✅ Decision analysis successful');
      console.log(`   - Decision: ${data.decision.decision}`);
      console.log(`   - Confidence: ${(data.decision.confidence * 100).toFixed(0)}%`);
      console.log(`   - Rationale points: ${data.decision.rationale.length}`);
      return true;
    } else {
      console.log('❌ Decision analysis failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Decision analysis test failed:', error.message);
    return false;
  }
}

// Test 5: Test task management
async function testTaskManagement() {
  console.log('\n5. Testing Task Management...');
  try {
    // Create a task
    const createResponse = await fetch('http://localhost:3001/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test CKD Appeal Case',
        description: 'Integration test task'
      }),
    });

    const createData = await createResponse.json();
    if (createData.task && createData.task.id) {
      console.log('✅ Task creation successful');
      
      // Get all tasks
      const getResponse = await fetch('http://localhost:3001/tasks');
      const getData = await getResponse.json();
      if (getData.tasks && getData.tasks.length > 0) {
        console.log('✅ Task retrieval successful');
        console.log(`   - Tasks found: ${getData.tasks.length}`);
        return true;
      }
    }
    
    console.log('❌ Task management failed');
    return false;
  } catch (error) {
    console.log('❌ Task management test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runIntegrationTests() {
  console.log('Starting integration tests...\n');

  const results = {
    serverHealth: await testServerHealth(),
    knowledgeBase: await testKnowledgeBase(),
    documentProcessing: await testDocumentProcessing(),
    decisionAnalysis: false,
    taskManagement: await testTaskManagement(),
  };

  if (results.documentProcessing) {
    results.decisionAnalysis = await testDecisionAnalysis(results.documentProcessing);
  }

  console.log('\n📊 Integration Test Results');
  console.log('==========================');
  console.log(`Server Health: ${results.serverHealth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Knowledge Base: ${results.knowledgeBase ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Document Processing: ${results.documentProcessing ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Decision Analysis: ${results.decisionAnalysis ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task Management: ${results.taskManagement ? '✅ PASS' : '❌ FAIL'}`);

  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;

  console.log(`\nOverall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All integration tests passed! System is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Please review the system before deployment.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runIntegrationTests().catch(console.error);
}

module.exports = { runIntegrationTests };
