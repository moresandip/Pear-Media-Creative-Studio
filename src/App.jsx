import React, { useState, useEffect } from 'react'
import { Sparkles, Image as ImageIcon, Check, Loader2, Upload, Send, Settings, X, RefreshCw, Download } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { enhancePrompt, generateImage, analyzeImage } from './utils/api'

function App() {
  const [activeTab, setActiveTab] = useState('text')
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '')
  const [hfKey, setHfKey] = useState(localStorage.getItem('hf_api_key') || import.meta.env.VITE_HF_API_KEY || '')
  const [showSettings, setShowSettings] = useState(false)
  
  // Debug logging
  useEffect(() => {
    console.log('Gemini Key loaded:', geminiKey ? 'Yes (hidden)' : 'No')
    console.log('HF Key loaded:', hfKey ? 'Yes (hidden)' : 'No')
    console.log('Env Gemini:', import.meta.env.VITE_GEMINI_API_KEY ? 'Yes' : 'No')
    console.log('Env HF:', import.meta.env.VITE_HF_API_KEY ? 'Yes' : 'No')
  }, [])
  
  // Text Workflow State
  const [userPrompt, setUserPrompt] = useState('')
  const [enhancedPrompt, setEnhancedPrompt] = useState('')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState(null)
  
  // Image Workflow State
  const [uploadedImage, setUploadedImage] = useState(null)
  const [uploadedImageBase64, setUploadedImageBase64] = useState(null)
  const [imageAnalysis, setImageAnalysis] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [variationImage, setVariationImage] = useState(null)

  const saveKeys = () => {
    localStorage.setItem('gemini_api_key', geminiKey)
    localStorage.setItem('hf_api_key', hfKey)
    setShowSettings(false)
  }

  const handleEnhance = async () => {
    console.log('Enhance clicked. Prompt:', userPrompt)
    console.log('Gemini key present:', !!geminiKey)
    if (!userPrompt) {
      alert('Please enter a prompt to enhance.')
      return
    }
    if (!geminiKey) {
      alert('Gemini API key is missing. Please add it in Settings.')
      setShowSettings(true)
      return
    }
    setIsEnhancing(true)
    console.log('Calling enhancePrompt...')
    try {
      const enhanced = await enhancePrompt(userPrompt, geminiKey)
      console.log('Enhancement success:', enhanced)
      setEnhancedPrompt(enhanced)
    } catch (error) {
      console.error('Full error object:', error)
      console.error('Error response:', error.response)
      const errorMsg = error.response?.data?.error?.message || error.message || 'Unknown error'
      alert(`Enhancement failed: ${errorMsg}`)
    } finally {
      setIsEnhancing(false)
    }
  }

  const handleGenerate = async (prompt) => {
    if (!prompt) return
    if (!hfKey) {
      alert('Hugging Face API key is missing. Please add it in Settings.')
      setShowSettings(true)
      return
    }
    setIsGenerating(true)
    try {
      const imgUrl = await generateImage(prompt, hfKey)
      if (activeTab === 'text') setGeneratedImage(imgUrl)
      else setVariationImage(imgUrl)
    } catch (error) {
      alert(`Generation failed: ${error.message}`)
      console.error('Generation error:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setUploadedImage(reader.result)
        const base64 = reader.result.split(',')[1]
        setUploadedImageBase64(base64)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAnalyze = async () => {
    if (!uploadedImageBase64) {
      alert('Please upload an image first.')
      return
    }
    if (!geminiKey) {
      alert('Gemini API key is missing. Please add it in Settings.')
      setShowSettings(true)
      return
    }
    setIsAnalyzing(true)
    try {
      const analysis = await analyzeImage(uploadedImageBase64, geminiKey)
      setImageAnalysis(analysis)
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message || 'Unknown error'
      alert(`Analysis failed: ${errorMsg}`)
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">
          <Sparkles className="logo-icon" />
          <h1>Pear Media <span>Creative Studio</span></h1>
        </div>
        <div className="header-actions">
          <nav className="nav">
            <button 
              className={activeTab === 'text' ? 'active' : ''} 
              onClick={() => setActiveTab('text')}
            >
              <Sparkles size={18} />
              Text Studio
            </button>
            <button 
              className={activeTab === 'image' ? 'active' : ''} 
              onClick={() => setActiveTab('image')}
            >
              <ImageIcon size={18} />
              Style Lab
            </button>
          </nav>
          <button className="btn-icon" onClick={() => setShowSettings(true)}>
            <Settings size={20} />
          </button>
        </div>
      </header>

      <main className="main">
        <AnimatePresence mode="wait">
          {activeTab === 'text' ? (
            <motion.div 
              key="text-workflow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="workflow-container"
            >
              <div className="workflow-header">
                <h2>Text-to-Image Workflow</h2>
                <p>Enhance your prompts with AI before generating stunning visuals.</p>
              </div>

              <div className="workflow-grid">
                <div className="workflow-column">
                  <div className="card">
                    <h3 className="card-title">1. Input Description</h3>
                    <textarea 
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="Describe what you want to create (e.g., 'A futuristic city in the clouds')..." 
                    />
                    <button 
                      className="btn-primary" 
                      onClick={handleEnhance}
                      disabled={isEnhancing || !userPrompt}
                    >
                      {isEnhancing ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                      {isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}
                    </button>
                  </div>

                  {enhancedPrompt && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="card mt-4"
                    >
                      <h3 className="card-title">2. Enhanced Version (Approved)</h3>
                      <textarea 
                        value={enhancedPrompt}
                        onChange={(e) => setEnhancedPrompt(e.target.value)}
                        className="textarea-enhanced"
                      />
                      <button 
                        className="btn-primary btn-generate" 
                        onClick={() => handleGenerate(enhancedPrompt)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <ImageIcon size={18} />}
                        {isGenerating ? 'Generating Image...' : 'Generate AI Image'}
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="workflow-column">
                  <div className="result-container card">
                    <h3 className="card-title">Final Masterpiece</h3>
                    <div className="image-display">
                      {isGenerating ? (
                        <div className="loading-state">
                          <Loader2 className="animate-spin" size={48} />
                          <p>Painting your imagination...</p>
                        </div>
                      ) : generatedImage ? (
                        <div className="image-wrapper">
                          <img src={generatedImage} alt="AI Generated" />
                          <a href={generatedImage} download="generated-image.png" className="btn-float">
                            <Download size={20} />
                          </a>
                        </div>
                      ) : (
                        <div className="empty-state">
                          <ImageIcon size={64} />
                          <p>Your image will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="image-workflow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="workflow-container"
            >
              <div className="workflow-header">
                <h2>Image Variation Lab</h2>
                <p>Upload an image to analyze its style and generate variations.</p>
              </div>

              <div className="workflow-grid">
                <div className="workflow-column">
                  <div className="card">
                    <h3 className="card-title">1. Upload Source</h3>
                    <div className="upload-container">
                      {uploadedImage ? (
                        <div className="preview-container">
                          <img src={uploadedImage} alt="Preview" />
                          <button className="btn-close" onClick={() => {setUploadedImage(null); setUploadedImageBase64(null); setImageAnalysis('');}}>
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <label className="dropzone">
                          <input type="file" hidden onChange={handleImageUpload} accept="image/*" />
                          <Upload size={48} />
                          <p>Click to upload image</p>
                        </label>
                      )}
                    </div>
                    <button 
                      className="btn-primary mt-4" 
                      onClick={handleAnalyze}
                      disabled={!uploadedImage || isAnalyzing}
                    >
                      {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                      {isAnalyzing ? 'Analyzing Style...' : 'Analyze & Extract Style'}
                    </button>
                  </div>

                  {imageAnalysis && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="card mt-4"
                    >
                      <h3 className="card-title">2. Style Analysis</h3>
                      <div className="analysis-text">
                        {imageAnalysis}
                      </div>
                      <button 
                        className="btn-primary mt-4" 
                        onClick={() => handleGenerate(imageAnalysis)}
                        disabled={isGenerating}
                      >
                        {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
                        Generate Variation
                      </button>
                    </motion.div>
                  )}
                </div>

                <div className="workflow-column">
                  <div className="result-container card">
                    <h3 className="card-title">Variation Result</h3>
                    <div className="image-display">
                      {isGenerating ? (
                        <div className="loading-state">
                          <Loader2 className="animate-spin" size={48} />
                          <p>Generating variation...</p>
                        </div>
                      ) : variationImage ? (
                        <div className="image-wrapper">
                          <img src={variationImage} alt="Variation" />
                          <a href={variationImage} download="variation.png" className="btn-float">
                            <Download size={20} />
                          </a>
                        </div>
                      ) : (
                        <div className="empty-state">
                          <ImageIcon size={64} />
                          <p>Variation image will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="modal-header">
                <h3>API Configuration</h3>
                <button className="btn-icon" onClick={() => setShowSettings(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="input-group">
                  <label>Gemini API Key (Text/Vision)</label>
                  <input 
                    type="password" 
                    value={geminiKey} 
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder="Enter Gemini API Key"
                  />
                </div>
                <div className="input-group">
                  <label>Hugging Face API Key (Image Gen)</label>
                  <input 
                    type="password" 
                    value={hfKey} 
                    onChange={(e) => setHfKey(e.target.value)}
                    placeholder="Enter HF API Key"
                  />
                </div>
                <p className="hint">Keys are saved locally in your browser.</p>
              </div>
              <div className="modal-footer">
                <button className="btn-primary w-full" onClick={saveKeys}>
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="footer">
        <p>&copy; 2026 Pear Media. Built with Gemini & Hugging Face.</p>
      </footer>
    </div>
  )
}

export default App
