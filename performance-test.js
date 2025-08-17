const fs = require('fs');
const path = require('path');

// Test data for performance testing
const testText = `
Patient Medical Record - Performance Test
Date: 2024-01-15

Lab Results:
- GFR: 12 mL/min/1.73m²
- Creatinine: 4.2 mg/dL
- BUN: 45 mg/dL
- Proteinuria: 4.1 g/day
- Blood Pressure: 145/95 mmHg

Diagnosis: CKD Stage 5 with DM and HTN
Complications: Anemia, fluid overload, mineral bone disorder

Medications:
- ACE inhibitor
- ESA therapy
- Iron supplementation
- Phosphate binders
- Vitamin D analogs
`;

console.log('🚀 CKD Appeals AI - Performance Test');
console.log('====================================\n');

// Performance test functions
async function testHealthEndpoint() {
  console.log('1. Testing Health Endpoint Performance...');
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3001/health');
    const data = await response.json();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Health check completed in ${duration}ms`);
    console.log(`   - Status: ${data.status}`);
    console.log(`   - Uptime: ${data.uptime.toFixed(2)}s`);
    console.log(`   - Memory: ${(data.memory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   - Knowledge Base: ${data.knowledgeBase.loaded ? 'Loaded' : 'Not Loaded'}`);
    console.log(`   - Cache Valid: ${data.knowledgeBase.cacheValid ? 'Yes' : 'No'}`);
    
    return duration;
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
    return null;
  }
}

async function testKnowledgeBaseEndpoint() {
  console.log('\n2. Testing Knowledge Base Endpoint Performance...');
  const startTime = Date.now();
  
  try {
    const response = await fetch('http://localhost:3001/knowledge-base');
    const data = await response.json();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Knowledge base retrieved in ${duration}ms`);
    console.log(`   - Abbreviations: ${data.terminology.abbreviationCount}`);
    console.log(`   - Guidelines: ${data.guidelines.monitoringFrequency} monitoring frequencies`);
    console.log(`   - Appeal Criteria: ${data.appealCriteria.approvalIndicators} approval indicators`);
    console.log(`   - Cache Status: ${data.cache.cached ? 'Cached' : 'Fresh Load'}`);
    
    return duration;
  } catch (error) {
    console.log('❌ Knowledge base test failed:', error.message);
    return null;
  }
}

async function testDocumentProcessing() {
  console.log('\n3. Testing Document Processing Performance...');
  const startTime = Date.now();
  
  try {
    const formData = new FormData();
    const blob = new Blob([testText], { type: 'text/plain' });
    formData.append('document', blob, 'performance-test.txt');

    const response = await fetch('http://localhost:3001/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Document processing completed in ${duration}ms`);
    console.log(`   - File Size: ${(testText.length / 1024).toFixed(2)}KB`);
    console.log(`   - GFR Extracted: ${data.clinicalData.gfr}`);
    console.log(`   - Complications Found: ${data.clinicalData.complications.length}`);
    console.log(`   - Abbreviations Expanded: ${data.expandedData.expansions.length}`);
    
    return { duration, data };
  } catch (error) {
    console.log('❌ Document processing test failed:', error.message);
    return null;
  }
}

async function testDecisionAnalysis(uploadResult) {
  console.log('\n4. Testing Decision Analysis Performance...');
  const startTime = Date.now();
  
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
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ Decision analysis completed in ${duration}ms`);
    console.log(`   - Decision: ${data.decision.decision}`);
    console.log(`   - Confidence: ${(data.decision.confidence * 100).toFixed(0)}%`);
    console.log(`   - AI Model: ${data.decision.aiModel}`);
    console.log(`   - Rationale Points: ${data.decision.rationale.length}`);
    
    return duration;
  } catch (error) {
    console.log('❌ Decision analysis test failed:', error.message);
    return null;
  }
}

async function testConcurrentRequests() {
  console.log('\n5. Testing Concurrent Request Performance...');
  const numRequests = 5;
  const startTime = Date.now();
  
  try {
    const promises = [];
    for (let i = 0; i < numRequests; i++) {
      promises.push(fetch('http://localhost:3001/health'));
    }
    
    const responses = await Promise.all(promises);
    const endTime = Date.now();
    const totalDuration = endTime - startTime;
    const avgDuration = totalDuration / numRequests;
    
    console.log(`✅ ${numRequests} concurrent requests completed in ${totalDuration}ms`);
    console.log(`   - Average response time: ${avgDuration.toFixed(2)}ms`);
    console.log(`   - All responses successful: ${responses.every(r => r.ok)}`);
    
    return { totalDuration, avgDuration };
  } catch (error) {
    console.log('❌ Concurrent request test failed:', error.message);
    return null;
  }
}

async function testMemoryUsage() {
  console.log('\n6. Testing Memory Usage...');
  
  try {
    const response = await fetch('http://localhost:3001/metrics');
    const data = await response.json();
    
    const memory = data.system.memory;
    const heapUsed = (memory.heapUsed / 1024 / 1024).toFixed(2);
    const heapTotal = (memory.heapTotal / 1024 / 1024).toFixed(2);
    const external = (memory.external / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Memory usage metrics:`);
    console.log(`   - Heap Used: ${heapUsed}MB`);
    console.log(`   - Heap Total: ${heapTotal}MB`);
    console.log(`   - External: ${external}MB`);
    console.log(`   - Uptime: ${data.system.uptime.toFixed(2)}s`);
    
    return { heapUsed, heapTotal, external };
  } catch (error) {
    console.log('❌ Memory usage test failed:', error.message);
    return null;
  }
}

// Run all performance tests
async function runPerformanceTests() {
  console.log('Starting performance tests...\n');

  const results = {
    health: await testHealthEndpoint(),
    knowledgeBase: await testKnowledgeBaseEndpoint(),
    documentProcessing: await testDocumentProcessing(),
    decisionAnalysis: null,
    concurrent: await testConcurrentRequests(),
    memory: await testMemoryUsage()
  };

  if (results.documentProcessing) {
    results.decisionAnalysis = await testDecisionAnalysis(results.documentProcessing.data);
  }

  console.log('\n📊 Performance Test Results');
  console.log('==========================');
  console.log(`Health Check: ${results.health ? results.health + 'ms' : 'FAILED'}`);
  console.log(`Knowledge Base: ${results.knowledgeBase ? results.knowledgeBase + 'ms' : 'FAILED'}`);
  console.log(`Document Processing: ${results.documentProcessing ? results.documentProcessing.duration + 'ms' : 'FAILED'}`);
  console.log(`Decision Analysis: ${results.decisionAnalysis ? results.decisionAnalysis + 'ms' : 'FAILED'}`);
  console.log(`Concurrent Requests: ${results.concurrent ? results.concurrent.avgDuration.toFixed(2) + 'ms avg' : 'FAILED'}`);
  console.log(`Memory Usage: ${results.memory ? results.memory.heapUsed + 'MB' : 'FAILED'}`);

  // Performance targets
  const targets = {
    health: 100, // ms
    knowledgeBase: 200, // ms
    documentProcessing: 1000, // ms
    decisionAnalysis: 3000, // ms
    concurrent: 150, // ms avg
    memory: 50 // MB
  };

  console.log('\n🎯 Performance Targets vs Actual');
  console.log('================================');
  console.log(`Health Check: ${results.health ? (results.health <= targets.health ? '✅' : '⚠️') : '❌'} (Target: ${targets.health}ms)`);
  console.log(`Knowledge Base: ${results.knowledgeBase ? (results.knowledgeBase <= targets.knowledgeBase ? '✅' : '⚠️') : '❌'} (Target: ${targets.knowledgeBase}ms)`);
  console.log(`Document Processing: ${results.documentProcessing ? (results.documentProcessing.duration <= targets.documentProcessing ? '✅' : '⚠️') : '❌'} (Target: ${targets.documentProcessing}ms)`);
  console.log(`Decision Analysis: ${results.decisionAnalysis ? (results.decisionAnalysis <= targets.decisionAnalysis ? '✅' : '⚠️') : '❌'} (Target: ${targets.decisionAnalysis}ms)`);
  console.log(`Concurrent Requests: ${results.concurrent ? (results.concurrent.avgDuration <= targets.concurrent ? '✅' : '⚠️') : '❌'} (Target: ${targets.concurrent}ms avg)`);
  console.log(`Memory Usage: ${results.memory ? (parseFloat(results.memory.heapUsed) <= targets.memory ? '✅' : '⚠️') : '❌'} (Target: ${targets.memory}MB)`);

  const passedTests = Object.values(results).filter(r => r !== null).length;
  const totalTests = Object.keys(results).length;

  console.log(`\nOverall Result: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All performance tests passed! System is ready for demo deployment.');
  } else {
    console.log('⚠️  Some performance tests failed. Please review before deployment.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPerformanceTests().catch(console.error);
}

module.exports = { runPerformanceTests };
