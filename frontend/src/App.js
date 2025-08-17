import React, { useState } from 'react';

function App() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.type === 'text/plain')) {
      setFile(selectedFile);
    } else {
      alert('Please select a PDF or text file');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setUploadResult(result);
        setActiveTab('results');
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!uploadResult) {
      alert('Please upload a document first');
      return;
    }

    setAnalyzing(true);
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

      const result = await response.json();
      if (response.ok) {
        setAnalysisResult(result);
        setActiveTab('decision');
      } else {
        alert('Analysis failed: ' + result.error);
      }
    } catch (error) {
      alert('Analysis failed: ' + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'APPROVE':
        return 'bg-green-100 border-green-500 text-green-800';
      case 'REJECT':
        return 'bg-red-100 border-red-500 text-red-800';
      case 'REVIEW':
        return 'bg-yellow-100 border-yellow-500 text-yellow-800';
      default:
        return 'bg-gray-100 border-gray-500 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">CKD Appeals AI</h1>
              <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">POC</span>
            </div>
            <div className="text-sm text-gray-500">
              Chronic Kidney Disease Appeal Analysis
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Document Upload
            </button>
            {uploadResult && (
              <button
                onClick={() => setActiveTab('results')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'results'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Processing Results
              </button>
            )}
            {analysisResult && (
              <button
                onClick={() => setActiveTab('decision')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'decision'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Decision Analysis
              </button>
            )}
          </nav>
        </div>

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="max-w-xl mx-auto">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Upload Patient Document</h2>
              <p className="text-sm text-gray-600 mb-6">
                Upload a PDF or text file containing patient medical records for CKD appeal analysis.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Document
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                
                {file && (
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm text-gray-700">
                      <strong>Selected file:</strong> {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleUpload}
                  disabled={!file || uploading}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : 'Upload and Process Document'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && uploadResult && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Document Processing Results</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clinical Data */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Extracted Clinical Data</h3>
                <div className="space-y-2">
                  {uploadResult.clinicalData.gfr && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">GFR:</span>
                      <span className="text-sm font-medium">{uploadResult.clinicalData.gfr} mL/min/1.73m²</span>
                    </div>
                  )}
                  {uploadResult.clinicalData.creatinine && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Creatinine:</span>
                      <span className="text-sm font-medium">{uploadResult.clinicalData.creatinine} mg/dL</span>
                    </div>
                  )}
                  {uploadResult.clinicalData.bun && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">BUN:</span>
                      <span className="text-sm font-medium">{uploadResult.clinicalData.bun} mg/dL</span>
                    </div>
                  )}
                  {uploadResult.clinicalData.proteinuria && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Proteinuria:</span>
                      <span className="text-sm font-medium">{uploadResult.clinicalData.proteinuria} g/day</span>
                    </div>
                  )}
                  {uploadResult.clinicalData.bloodPressure && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Blood Pressure:</span>
                      <span className="text-sm font-medium">{uploadResult.clinicalData.bloodPressure} mmHg</span>
                    </div>
                  )}
                  {uploadResult.clinicalData.diabetes && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Diabetes:</span>
                      <span className="text-sm font-medium text-green-600">Present</span>
                    </div>
                  )}
                  {uploadResult.clinicalData.complications.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Complications:</span>
                      <ul className="mt-1 space-y-1">
                        {uploadResult.clinicalData.complications.map((comp, index) => (
                          <li key={index} className="text-sm font-medium text-red-600 ml-4">
                            • {comp.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Term Expansions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Medical Term Expansions</h3>
                {uploadResult.expandedData.expansions.length > 0 ? (
                  <div className="space-y-2">
                    {uploadResult.expandedData.expansions.slice(0, 5).map((expansion, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium text-blue-600">{expansion.abbreviation}</span>
                        <span className="text-gray-600"> → {expansion.fullName}</span>
                      </div>
                    ))}
                    {uploadResult.expandedData.expansions.length > 5 && (
                      <p className="text-xs text-gray-500">
                        +{uploadResult.expandedData.expansions.length - 5} more terms
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No medical abbreviations found</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {analyzing ? 'Analyzing...' : 'Generate Decision Analysis'}
              </button>
            </div>
          </div>
        )}

        {/* Decision Tab */}
        {activeTab === 'decision' && analysisResult && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Decision Analysis</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Decision Result */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Appeal Decision</h3>
                <div className={`border-2 rounded-lg p-4 ${getDecisionColor(analysisResult.decision.decision)}`}>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">
                      {analysisResult.decision.decision}
                    </div>
                    <div className="text-sm">
                      Confidence: {(analysisResult.decision.confidence * 100).toFixed(0)}%
                    </div>
                    {analysisResult.decision.aiModel && (
                      <div className="text-xs text-gray-500 mt-1">
                        AI Model: {analysisResult.decision.aiModel}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-medium text-gray-900 mb-3">Decision Rationale</h3>
                <div className="space-y-2">
                  {analysisResult.decision.rationale.map((reason, index) => (
                    <div key={index} className="text-sm bg-white p-2 rounded border-l-4 border-blue-500">
                      {reason}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Decision Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Key Factors */}
              {analysisResult.decision.keyFactors && analysisResult.decision.keyFactors.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Key Factors</h3>
                  <div className="space-y-2">
                    {analysisResult.decision.keyFactors.map((factor, index) => (
                      <div key={index} className="text-sm bg-white p-2 rounded border-l-4 border-green-500">
                        {factor}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysisResult.decision.recommendations && analysisResult.decision.recommendations.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-md font-medium text-gray-900 mb-3">Recommendations</h3>
                  <div className="space-y-2">
                    {analysisResult.decision.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm bg-white p-2 rounded border-l-4 border-purple-500">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Audit Information */}
            <div className="mt-6 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-md font-medium text-gray-900 mb-3">Audit Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Analysis Timestamp:</span>
                  <span className="ml-2 font-medium">
                    {new Date(analysisResult.decision.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Text Length:</span>
                  <span className="ml-2 font-medium">
                    {analysisResult.decision.extractedTextLength} characters
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
