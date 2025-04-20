import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { MdUndo, MdRedo, MdErrorOutline, MdAutoAwesome, MdImage, MdUploadFile, MdMic, MdStop } from 'react-icons/md';
import axios from 'axios';
import StudentPreview from './StudentPreview';
import './AddNotes.css';

const AddNotes = ({ image, lessonId, regions, teacherEmail, onSave, onDone, onCancel, existingNotes, existingCoordinates }) => {
  const [currentNote, setCurrentNote] = useState(null);
  const [notes, setNotes] = useState(existingNotes || {});
  const [clickCoordinates, setClickCoordinates] = useState(existingCoordinates || {});
  const [history, setHistory] = useState({});
  const [historyIndex, setHistoryIndex] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [useImage, setUseImage] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [compositeImageUrl, setCompositeImageUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [generatedNotes, setGeneratedNotes] = useState(null);
  const [activeTab, setActiveTab] = useState('manual');
  const [showStudentPreview, setShowStudentPreview] = useState(false);
  const [noteOrder, setNoteOrder] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  const imageRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const maxChars = 500;

  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [currentNote?.text]);

  const handleImageClick = (e) => {
    if (!imageRef.current || !regions || regions.length === 0) {
      console.log('Image ref or regions not available:', { imageRef: !!imageRef.current, regions });
      return;
    }
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const imageWidth = imageRef.current.naturalWidth;
    const imageHeight = imageRef.current.naturalHeight;
    const displayWidth = rect.width;
    const displayHeight = rect.height;
    const scaleX = imageWidth / displayWidth;
    const scaleY = imageHeight / displayHeight;
    const originalX = x * scaleX;
    const originalY = y * scaleY;

    const clickedRegion = regions.find((region) => {
      const { position } = region;
      if (!position || position.x === undefined || position.y === undefined || position.width === undefined || position.height === undefined) {
        console.log('Invalid region position:', region);
        return false;
      }
      return (
        originalX >= position.x &&
        originalX <= position.x + position.width &&
        originalY >= position.y &&
        originalY <= position.y + position.height
      );
    });

    if (clickedRegion) {
      const regionId = clickedRegion.region_id;
      setCurrentNote({
        regionId,
        text: notes[regionId]?.text || '',
        clickX: x,
        clickY: y,
        maskUrl: clickedRegion.mask_url,
        cutoutUrl: clickedRegion.cutout_url,
        position: clickedRegion.position,
        regionIndex: regions.findIndex((r) => r.region_id === regionId),
        audioUrl: notes[regionId]?.audioUrl || null,
      });
      setHistory((prev) => ({
        ...prev,
        [regionId]: prev[regionId] || [notes[regionId]?.text || ''],
      }));
      setHistoryIndex((prev) => ({
        ...prev,
        [regionId]: 0,
      }));
      setUploadedFile(null);
      setUseImage(false);
      setCustomPrompt('');
      setCompositeImageUrl(null);
      setShowPreview(false);
      setGeneratedNotes(null);
      setActiveTab('manual');
      setAudioUrl(notes[regionId]?.audioUrl || null);
    }
  };

  const handleNoteChange = (e) => {
    const newNote = e.target.value.slice(0, maxChars);
    setCurrentNote((prev) => ({ ...prev, text: newNote }));
    const regionId = currentNote.regionId;
    const newHistory = history[regionId].slice(0, historyIndex[regionId] + 1);
    newHistory.push(newNote);
    setHistory((prev) => ({
      ...prev,
      [regionId]: newHistory,
    }));
    setHistoryIndex((prev) => ({
      ...prev,
      [regionId]: newHistory.length - 1,
    }));
    setError(null);
  };

  const handleUndo = () => {
    const regionId = currentNote.regionId;
    if (historyIndex[regionId] > 0) {
      const newIndex = historyIndex[regionId] - 1;
      setHistoryIndex((prev) => ({
        ...prev,
        [regionId]: newIndex,
      }));
      setCurrentNote((prev) => ({
        ...prev,
        text: history[regionId][newIndex],
      }));
    }
  };

  const handleRedo = () => {
    const regionId = currentNote.regionId;
    if (historyIndex[regionId] < history[regionId].length - 1) {
      const newIndex = historyIndex[regionId] + 1;
      setHistoryIndex((prev) => ({
        ...prev,
        [regionId]: newIndex,
      }));
      setCurrentNote((prev) => ({
        ...prev,
        text: history[regionId][newIndex],
      }));
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['application/pdf', 'text/plain'].includes(file.type)) {
      setError('Please upload a PDF or TXT file');
      return;
    }
    setUploadedFile(file);
    setError(null);
  };

  const handleGenerateWithAI = async () => {
    if (!currentNote) return;
    setIsGenerating(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('region_id', currentNote.regionId);
      formData.append('mask_url', currentNote.maskUrl);
      formData.append('base_image_url', image.url);
      formData.append('use_image', useImage);
      if (customPrompt) {
        formData.append('custom_prompt', customPrompt);
      }
      if (uploadedFile) {
        formData.append('document', uploadedFile);
      }

      const API_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
      const response = await axios.post(`${API_URL}/generate_notes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { notes, composite_image_url } = response.data;
      setGeneratedNotes(notes);
      setCompositeImageUrl(composite_image_url);
      setShowPreview(useImage);
      setActiveTab('ai');
    } catch (err) {
      setError('Failed to generate notes: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptGeneratedNotes = () => {
    if (!generatedNotes) return;
    setCurrentNote((prev) => ({ ...prev, text: generatedNotes }));
    const regionId = currentNote.regionId;
    const newHistory = history[regionId].slice(0, historyIndex[regionId] + 1);
    newHistory.push(generatedNotes);
    setHistory((prev) => ({
      ...prev,
      [regionId]: newHistory,
    }));
    setHistoryIndex((prev) => ({
      ...prev,
      [regionId]: newHistory.length - 1,
    }));
    setGeneratedNotes(null);
    setActiveTab('manual');
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleUploadAudio(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUploadAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('upload_preset', process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset');

      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your_cloud_name'}/upload`,
        formData
      );

      const audioUrl = response.data.secure_url;
      setAudioUrl(audioUrl);
      setCurrentNote((prev) => ({ ...prev, audioUrl }));
    } catch (err) {
      setError('Failed to upload audio: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!currentNote || !currentNote.text.trim()) {
      setError('Note cannot be empty');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      const { regionId, text, clickX, clickY, maskUrl, cutoutUrl, position, regionIndex, audioUrl } = currentNote;
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
        {
          regionId,
          segmentIndex: regionIndex,
          notes: text,
          annotation: { x: clickX, y: clickY },
          maskUrl,
          cutoutUrl,
          position,
          audioUrl: audioUrl || null,
        },
        { merge: true }
      );
      setNotes((prev) => ({ ...prev, [regionId]: { text, audioUrl } }));
      setClickCoordinates((prev) => ({ ...prev, [regionId]: { x: clickX, y: clickY } }));
      setNoteOrder((prev) => [...prev.filter((id) => id !== regionId), regionId]);
      onSave(regionId, text, { x: clickX, y: clickY });
      setCurrentNote(null);
      setUploadedFile(null);
      setUseImage(false);
      setCustomPrompt('');
      setCompositeImageUrl(null);
      setShowPreview(false);
      setGeneratedNotes(null);
      setActiveTab('manual');
      setAudioUrl(null);
    } catch (err) {
      setError('Failed to save note: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelNote = () => {
    setCurrentNote(null);
    setError(null);
    setUploadedFile(null);
    setUseImage(false);
    setCustomPrompt('');
    setCompositeImageUrl(null);
    setShowPreview(false);
    setGeneratedNotes(null);
    setActiveTab('manual');
    setAudioUrl(null);
    if (isRecording) {
      handleStopRecording();
    }
  };

  const handleDone = () => {
    setShowStudentPreview(true);
  };

  if (!image || !image.url) {
    return (
      <motion.div
        className="addnotes-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="addnotes-header">
          <h2>Add Notes to Segments</h2>
          <p>Error: Image not available</p>
        </div>
        <div className="addnotes-footer">
          <motion.button
            className="addnotes-back-button"
            onClick={onCancel}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Back to Features
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="addnotes-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="addnotes-header">
        <h2>Add Notes to Segments</h2>
        <p>Click a colored segment to add or edit notes below.</p>
      </div>
      <div className="addnotes-image-container" onClick={handleImageClick}>
        <img
          src={image.url}
          alt="Segmented Image"
          className="addnotes-base-image"
          ref={imageRef}
        />
        <div className="addnotes-regions-overlay">
          {regions.map((region) => (
            <img
              key={region.region_id}
              src={region.mask_url}
              alt={`Segment ${region.region_id}`}
              className="addnotes-mask"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                opacity: 0.5,
                pointerEvents: 'none',
              }}
              onError={() => console.error(`Failed to load mask: ${region.mask_url}`)}
            />
          ))}
        </div>
      </div>
      <AnimatePresence>
        {currentNote ? (
          <motion.div
            className="addnotes-panel"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <h3>
              <span className="addnotes-color-indicator" style={{ backgroundColor: '#9b4ae2' }}></span>
              {notes[currentNote.regionId] ? 'Edit Notes' : 'Add Notes'} for Segment {currentNote.regionIndex + 1}
            </h3>
            <div className="addnotes-preview">
              <img
                src={currentNote.maskUrl}
                alt={`Segment ${currentNote.regionIndex + 1} preview`}
                className="addnotes-preview-image"
                onError={() => console.error(`Failed to load mask: ${currentNote.maskUrl}`)}
              />
            </div>
            <div className="addnotes-tabs">
              <button
                className={`addnotes-tab ${activeTab === 'manual' ? 'active' : ''}`}
                onClick={() => setActiveTab('manual')}
                aria-selected={activeTab === 'manual'}
                role="tab"
              >
                Manual Notes
              </button>
              <button
                className={`addnotes-tab ${activeTab === 'ai' ? 'active' : ''}`}
                onClick={() => setActiveTab('ai')}
                aria-selected={activeTab === 'ai'}
                role="tab"
              >
                AI Notes
              </button>
            </div>
            <motion.div
              className="addnotes-tab-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'ai' ? (
                <div className="addnotes-ai-card">
                  <motion.div
                    className="addnotes-generated-box"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: generatedNotes ? 'auto' : 0, opacity: generatedNotes ? 1 : 0 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h4>AI-Powered Notes</h4>
                    <p>{generatedNotes || 'No notes generated yet. Click "Generate with AI" to create notes.'}</p>
                    {generatedNotes && (
                      <motion.button
                        className="addnotes-accept-button"
                        onClick={handleAcceptGeneratedNotes}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        Accept Notes
                      </motion.button>
                    )}
                  </motion.div>
                  <div className="addnotes-ai-option">
                    <textarea
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="Enter a custom prompt (e.g., 'Generate notes on photosynthesis for this segment')"
                      className="addnotes-prompt-input"
                      disabled={isGenerating || isSaving || isRecording}
                    />
                  </div>
                  <div className="addnotes-ai-option">
                    <label htmlFor="use-image" className="addnotes-ai-label" title="Include the segment image to generate notes based on its visual content">
                      <input
                        type="checkbox"
                        id="use-image"
                        checked={useImage}
                        onChange={(e) => setUseImage(e.target.checked)}
                        disabled={isGenerating || isSaving || isRecording}
                      />
                      <MdImage size={18} /> Include Segment Image
                    </label>
                  </div>
                  <div className="addnotes-ai-option">
                    <label htmlFor="document-upload" className="addnotes-ai-label" title="Upload a PDF or TXT file to provide context for AI notes">
                      <MdUploadFile size={18} /> Upload Study Material (PDF/TXT)
                    </label>
                    <input
                      id="document-upload"
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="addnotes-upload-input"
                      disabled={isGenerating || isSaving || isRecording}
                    />
                    {uploadedFile && <span className="addnotes-upload-filename">{uploadedFile.name}</span>}
                  </div>
                  <motion.button
                    className="addnotes-ai-button"
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || isSaving || isRecording}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    aria-label="Generate notes with AI"
                  >
                    {isGenerating ? (
                      <span className="addnotes-spinner"></span>
                    ) : (
                      <>
                        <MdAutoAwesome size={20} /> Generate with AI
                      </>
                    )}
                  </motion.button>
                  {useImage && compositeImageUrl && (
                    <motion.div
                      className="addnotes-composite-preview"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: showPreview ? 'auto' : 0, opacity: showPreview ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <button
                        className="addnotes-preview-toggle"
                        onClick={() => setShowPreview(!showPreview)}
                        aria-label={showPreview ? 'Hide LLM image preview' : 'Show LLM image preview'}
                      >
                        {showPreview ? 'Hide LLM Image Preview' : 'Show LLM Image Preview'}
                      </button>
                      {showPreview && (
                        <img
                          src={compositeImageUrl}
                          alt="Composite image for LLM"
                          className="addnotes-composite-image"
                          onError={() => console.error(`Failed to load composite image: ${compositeImageUrl}`)}
                        />
                      )}
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="addnotes-textarea-container">
                  <textarea
                    ref={textareaRef}
                    value={currentNote.text}
                    onChange={handleNoteChange}
                    placeholder="Enter notes for this segment (e.g., 'This is the main subject of the image...')"
                    className="addnotes-textarea"
                    disabled={isSaving || isRecording}
                    aria-describedby="addnotes-char-count"
                  />
                  <div className="addnotes-textarea-footer">
                    <span id="addnotes-char-count" className="addnotes-char-count">
                      {currentNote.text.length}/{maxChars}
                    </span>
                    <div className="addnotes-undo-redo">
                      <motion.button
                        className="addnotes-undo-button"
                        onClick={handleUndo}
                        disabled={historyIndex[currentNote.regionId] === 0 || isSaving || isRecording}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Undo last change"
                        aria-label="Undo last change"
                      >
                        <MdUndo size={20} />
                      </motion.button>
                      <motion.button
                        className="addnotes-redo-button"
                        onClick={handleRedo}
                        disabled={historyIndex[currentNote.regionId] === history[currentNote.regionId].length - 1 || isSaving || isRecording}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        title="Redo last change"
                        aria-label="Redo last change"
                      >
                        <MdRedo size={20} />
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
              <motion.button
                className="addnotes-record-button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                disabled={isGenerating || isSaving}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label={isRecording ? 'Stop recording' : 'Record notes'}
              >
                {isRecording ? (
                  <>
                    <MdStop size={20} /> Stop Recording
                  </>
                ) : (
                  <>
                    <MdMic size={20} /> Record Notes
                  </>
                )}
              </motion.button>
              {audioUrl && (
                <div className="addnotes-audio-preview">
                  <audio controls src={audioUrl} className="addnotes-audio-player" />
                </div>
              )}
              {error && (
                <motion.div
                  className="addnotes-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <MdErrorOutline size={20} />
                  {error}
                </motion.div>
              )}
              <div className="addnotes-buttons">
                <motion.button
                  className="addnotes-save-button"
                  onClick={handleSave}
                  disabled={isSaving || isRecording}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Save note"
                >
                  {isSaving ? <span className="addnotes-spinner"></span> : 'Save Note'}
                </motion.button>
                <motion.button
                  className="addnotes-cancel-button"
                  onClick={handleCancelNote}
                  disabled={isSaving}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label="Clear note"
                >
                  Clear
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            className="addnotes-empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            Click a segment to add or edit notes
          </motion.div>
        )}
      </AnimatePresence>
      <div className="addnotes-footer">
        <motion.button
          className="addnotes-back-button"
          onClick={onCancel}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Back to Features
        </motion.button>
        <motion.button
          className="addnotes-done-button"
          onClick={handleDone}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Done Adding Notes
        </motion.button>
      </div>
      <AnimatePresence>
        {showStudentPreview && (
          <StudentPreview
            image={image}
            regions={regions}
            notes={notes}
            noteOrder={noteOrder}
            lessonId={lessonId}
            teacherEmail={teacherEmail}
            onClose={() => setShowStudentPreview(false)}
            onSave={() => onDone()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AddNotes;