import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdMic, MdStop, MdErrorOutline, MdVolumeUp, MdPlayArrow } from 'react-icons/md';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import './RecordNotes.css';

const RecordNotes = ({ image, lessonId, regions, teacherEmail, onSave, onDone, onCancel, existingNotes, existingCoordinates }) => {
  const [currentNote, setCurrentNote] = useState(null);
  const [recordings, setRecordings] = useState({}); 
  const [notes, setNotes] = useState({});
  const [clickCoordinates, setClickCoordinates] = useState(existingCoordinates || {});
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const initialRecordings = {};
    const initialNotes = {};
    if (existingNotes) {
      Object.entries(existingNotes).forEach(([regionId, note]) => {
        if (typeof note === 'object' && note.audioUrl) {
          initialRecordings[regionId] = note.audioUrl;
        }
        initialNotes[regionId] = note;
      });
    }
    setRecordings(initialRecordings);
    setNotes(initialNotes);

    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
        mediaRecorderRef.current = null;
      }
    };
  }, [existingNotes]);

  const handleImageClick = (e) => {
    e.stopPropagation();
    if (isPreview || !imageRef.current || !regions || regions.length === 0) {
      return;
    }
    
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
        labelX: x + 100,
        labelY: y - 30,
        maskUrl: clickedRegion.mask_url,
        position: clickedRegion.position,
        regionIndex: regions.findIndex((r) => r.region_id === regionId),
      });

      setClickCoordinates(prev => ({
        ...prev,
        [regionId]: { x, y }
      }));

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

    // Allow saving if there's either audio or text
    if (!audioUrl && !recordings[currentNote.regionId] && !currentNote.text) {
      setError('Please record audio or add text before saving');
      return;
    }

    setIsSaving(true);
    try {
      const { regionId, clickX, clickY, text } = currentNote;
      const currentAudioUrl = audioUrl || recordings[regionId];
      
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
        {
          regionId,
          audioNote: currentAudioUrl,
          text: text || '',  // Include text if present
          annotation: { x: clickX, y: clickY },
        },
        { merge: true }
      );
      
      setRecordings(prev => ({
        ...prev,
        [regionId]: currentAudioUrl
      }));
      
      setClickCoordinates(prev => ({
        ...prev,
        [regionId]: { x: clickX, y: clickY }
      }));
      
      onSave(regionId, { audioUrl: currentAudioUrl, text }, { x: clickX, y: clickY });
      setCurrentNote(null);
      setAudioUrl(null);
    } catch (err) {
      setError('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
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

  const handleDoneRecording = () => {
    setIsPreview(true);
  };

  const handleSaveAll = () => {
    const allData = regions.map(region => ({
      regionId: region.region_id,
      audioNote: recordings[region.region_id] || '',
      annotation: clickCoordinates[region.region_id] || null,
    }));
    onSave(allData);
    setIsPreview(false);
    onCancel();
  };

  const handleBackToFeatures = () => {
    setIsPreview(false);
    setCurrentNote(null);
    setAudioUrl(null);
    setError(null);
    setIsRecording(false);
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
    onCancel();
  };

  const AudioIndicator = ({ audioUrl }) => {
    const audioRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);

    const togglePlay = () => {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
      }
    };

    return (
      <div className="recordnotes-audio-controls">
        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} />
        <button onClick={togglePlay} className="recordnotes-volume-button">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        </button>
      </div>
    );
  };

  if (isPreview) {
    return (
      <motion.div
        className="recordnotes-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="recordnotes-header">
          <h2>Preview Recordings</h2>
          <p>Review the recorded segments as they will appear to students.</p>
        </div>
        <div className="recordnotes-image-container" ref={containerRef}>
          <img
            src={image.url}
            alt="Segmented Image"
            className="recordnotes-base-image"
            ref={imageRef}
          />
          <div className="recordnotes-regions-overlay">
            {regions.map((region) => (
              <img
                key={region.region_id}
                src={region.mask_url}
                alt={`Segment ${region.region_id}`}
                className="recordnotes-mask"
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
              />
            ))}
            {Object.entries(recordings).map(([regionId, audioUrl]) => {
              const coords = clickCoordinates[regionId];
              if (!coords) return null;
              const labelX = coords.x + 100;
              const labelY = coords.y - 20;
              return (
                <div key={`preview-audio-${regionId}`} className="recordnotes-preview-wrapper">
                  <svg className="recordnotes-line">
                    <motion.line
                      x1={coords.x}
                      y1={coords.y}
                      x2={labelX}
                      y2={labelY}
                      stroke="#ffffff"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div
                    className="recordnotes-preview-audio"
                    style={{
                      position: 'absolute',
                      top: labelY,
                      left: labelX,
                      zIndex: 15,
                    }}
                  >
                    <AudioIndicator audioUrl={audioUrl} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="recordnotes-footer">
          <button className="recordnotes-back-button" onClick={handleBackToFeatures}>
            Back to Features
          </button>
          <button className="recordnotes-save-button" onClick={handleSaveAll}>
            Save Recordings
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className="recordnotes-container" onClick={(e) => e.stopPropagation()}>
      <div className="recordnotes-header">
        <h2>Record Audio Notes</h2>
        <p>Click directly on a colored segment to add or edit an audio note.</p>
      </div>
      <div className="recordnotes-content-wrapper">
        <div className="recordnotes-image-container" onClick={handleImageClick} ref={containerRef}>
          <img
            src={image.url}
            alt="Segmented Image"
            className="recordnotes-base-image"
            ref={imageRef}
          />
          <div className="recordnotes-regions-overlay">
            {regions.map((region) => (
              <img
                key={region.region_id}
                src={region.mask_url}
                alt={`Segment ${region.region_id}`}
                className="recordnotes-mask"
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
              />
            ))}
            <AnimatePresence>
              {currentNote && (
                <motion.div
                  className="recordnotes-recording-wrapper"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <svg className="recordnotes-line">
                    <motion.line
                      x1={currentNote.clickX}
                      y1={currentNote.clickY}
                      x2={currentNote.labelX}
                      y2={currentNote.labelY}
                      stroke="#ffffff"
                      strokeWidth="2"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
            {Object.entries(recordings).map(([regionId, audioUrl]) => {
              const coords = clickCoordinates[regionId];
              if (!coords || regionId === currentNote?.regionId) return null;
              const labelX = coords.x + 100;
              const labelY = coords.y - 20;
              return (
                <div key={`audio-${regionId}`} className="recordnotes-wrapper">
                  <svg className="recordnotes-svg">
                    <line
                      x1={coords.x}
                      y1={coords.y}
                      x2={labelX}
                      y2={labelY}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="recordnotes-line"
                    />
                  </svg>
                  <div
                    className="recordnotes-audio-preview"
                    style={{
                      position: 'absolute',
                      top: labelY,
                      left: labelX,
                      zIndex: 15,
                    }}
                  >
                    <AudioIndicator audioUrl={audioUrl} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {currentNote && (
          <div 
            className="recordnotes-controls-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="recordnotes-controls">
              {audioUrl && (
                <audio 
                  controls 
                  src={audioUrl} 
                  className="recordnotes-audio-player"
                />
              )}
              <motion.button
                className="recordnotes-record-button"
                onClick={isRecording ? handleStopRecording : handleStartRecording}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={isSaving}
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
            </div>
            <div className="recordnotes-button-group">
              <button onClick={handleSave} disabled={isSaving || isRecording}>
                {recordings[currentNote.regionId] ? 'Update' : 'Save'}
              </button>
              <button onClick={handleCancel} disabled={isSaving}>
                Cancel
              </button>
            </div>
            {error && (
              <div className="recordnotes-error">
                <MdErrorOutline size={20} /> {error}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="recordnotes-footer">
        <button className="recordnotes-back-button" onClick={onCancel}>
          Back to Features
        </button>
        <button className="recordnotes-done-button" onClick={handleDoneRecording}>
          Done Recording
        </button>
      </div>
    </motion.div>
  );
};

export default RecordNotes;