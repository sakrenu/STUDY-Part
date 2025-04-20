import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdMic, MdStop, MdErrorOutline } from 'react-icons/md';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './RecordNotes.css';

const RecordNotes = ({ image, lessonId, regions, teacherEmail, onSave, onDone, onCancel, existingNotes, existingCoordinates }) => {
  const [currentNote, setCurrentNote] = useState(null);
  const [recordings, setRecordings] = useState({}); // Store recordings for each segment
  const [notes, setNotes] = useState(existingNotes || {});
  const [clickCoordinates, setClickCoordinates] = useState(existingCoordinates || {});
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const imageRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Initialize recordings from existing notes
  useEffect(() => {
    const initialRecordings = {};
    if (existingNotes) {
      Object.entries(existingNotes).forEach(([regionId, note]) => {
        if (note.audioUrl) {
          initialRecordings[regionId] = note.audioUrl;
        }
      });
    }
    setRecordings(initialRecordings);
  }, [existingNotes]);

  const handleImageClick = (e) => {
    if (!imageRef.current || !regions || regions.length === 0) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const scaleX = imageRef.current.naturalWidth / rect.width;
    const scaleY = imageRef.current.naturalHeight / rect.height;
    const originalX = x * scaleX;
    const originalY = y * scaleY;

    const clickedRegion = regions.find((region) => {
      const { position } = region;
      if (!position) return false;
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
        clickX: x,
        clickY: y,
        maskUrl: clickedRegion.mask_url,
        position: clickedRegion.position,
        regionIndex: regions.findIndex((r) => r.region_id === regionId),
      });

      // Set the audio URL for the current segment if it exists
      setAudioUrl(recordings[regionId] || null);
    }
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
      setError(null);
    } catch (err) {
      setError('Failed to start recording: ' + err.message);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleUploadAudio = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', new File([audioBlob], 'recording.webm', { type: 'audio/webm' }));

      const response = await fetch('http://127.0.0.1:8000/api/upload-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload audio');
      }

      const data = await response.json();
      const newAudioUrl = data.url;
      setAudioUrl(newAudioUrl);
      
      // Store the new recording for this segment
      if (currentNote?.regionId) {
        setRecordings(prev => ({
          ...prev,
          [currentNote.regionId]: newAudioUrl
        }));
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload audio: ' + err.message);
    }
  };

  const handleSave = async () => {
    if (!currentNote) {
      setError('Please select a segment first');
      return;
    }

    if (!audioUrl && !recordings[currentNote.regionId]) {
      setError('Please record audio before saving');
      return;
    }

    try {
      const { regionId, clickX, clickY, maskUrl, position, regionIndex } = currentNote;
      const currentAudioUrl = audioUrl || recordings[regionId];
      
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
        {
          regionId,
          segmentIndex: regionIndex,
          audioNote: currentAudioUrl,
          annotation: { x: clickX, y: clickY },
          maskUrl,
          position,
        },
        { merge: true }
      );

      setNotes(prev => ({
        ...prev,
        [regionId]: { audioUrl: currentAudioUrl }
      }));
      
      setClickCoordinates(prev => ({
        ...prev,
        [regionId]: { x: clickX, y: clickY }
      }));
      
      onSave(regionId, { audioUrl: currentAudioUrl }, { x: clickX, y: clickY });
      setCurrentNote(null);
      setAudioUrl(null);
    } catch (err) {
      setError('Failed to save recording: ' + err.message);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      handleStopRecording();
    }
    setCurrentNote(null);
    setError(null);
    setAudioUrl(null);
  };

  return (
    <motion.div
      className="recordnotes-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="recordnotes-header">
        <h2>Record Audio Notes</h2>
        <p>Click a segment to record audio notes.</p>
      </div>
      <div className="recordnotes-content">
        <div className="recordnotes-image-container" onClick={handleImageClick}>
          <img
            ref={imageRef}
            src={image.url}
            alt="Segmented Image"
            className="recordnotes-base-image"
          />
          <div className="recordnotes-regions-overlay">
            {regions.map((region) => (
              <div
                key={region.region_id}
                className={`recordnotes-region ${
                  currentNote?.regionId === region.region_id ? 'recordnotes-selected' : ''
                } ${recordings[region.region_id] ? 'recordnotes-has-recording' : ''}`}
              >
                <img
                  src={region.mask_url}
                  alt={`Region ${region.region_id}`}
                  className="recordnotes-mask"
                  style={{ opacity: 0.5 }}
                />
              </div>
            ))}
          </div>
        </div>
        <AnimatePresence>
          {currentNote && (
            <motion.div
              className="recordnotes-controls"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <h3>
                {recordings[currentNote.regionId] 
                  ? `Existing Recording for Segment ${currentNote.regionIndex + 1}` 
                  : `Record Notes for Segment ${currentNote.regionIndex + 1}`}
              </h3>
              <div className="recordnotes-preview">
                <img
                  src={currentNote.maskUrl}
                  alt={`Segment ${currentNote.regionIndex + 1} preview`}
                  className="recordnotes-preview-image"
                />
              </div>
              {(audioUrl || recordings[currentNote.regionId]) && (
                <div className="recordnotes-audio-preview">
                  <audio 
                    controls 
                    src={audioUrl || recordings[currentNote.regionId]} 
                    className="recordnotes-audio-player"
                  />
                </div>
              )}
              <motion.button
                className="recordnotes-record-button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {isRecording ? (
                  <>
                    <MdStop size={24} /> Stop Recording
                  </>
                ) : (
                  <>
                    <MdMic size={24} /> {recordings[currentNote.regionId] ? 'Record New' : 'Start Recording'}
                  </>
                )}
              </motion.button>
              {error && (
                <motion.div
                  className="recordnotes-error"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <MdErrorOutline size={20} /> {error}
                </motion.div>
              )}
              <div className="recordnotes-buttons">
                <motion.button
                  className="recordnotes-save-button"
                  onClick={handleSave}
                  disabled={isRecording}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {recordings[currentNote.regionId] ? 'Update Recording' : 'Save Recording'}
                </motion.button>
                <motion.button
                  className="recordnotes-cancel-button"
                  onClick={handleCancel}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isRecording ? 'Cancel' : 'Clear'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="recordnotes-footer">
        <motion.button
          className="recordnotes-back-button"
          onClick={onCancel}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Back to Features
        </motion.button>
        <motion.button
          className="recordnotes-done-button"
          onClick={onDone}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          Done Recording
        </motion.button>
      </div>
    </motion.div>
  );
};

export default RecordNotes;