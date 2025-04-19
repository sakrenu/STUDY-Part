// import React, { useState, useRef, useEffect } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { db } from '../firebase';
// import { doc, setDoc } from 'firebase/firestore';
// import { MdUndo, MdRedo, MdErrorOutline } from 'react-icons/md';
// import './AddNotes.css';

// const AddNotes = ({ regionId, lessonId, teacherEmail, regionIndex, maskUrl, cutoutUrl, position, onSave, onCancel }) => {
//   const [note, setNote] = useState('');
//   const [history, setHistory] = useState(['']);
//   const [historyIndex, setHistoryIndex] = useState(0);
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState(null);
//   const maxChars = 500;
//   const textareaRef = useRef(null);

//   // Auto-resize textarea
//   useEffect(() => {
//     const textarea = textareaRef.current;
//     textarea.style.height = 'auto';
//     textarea.style.height = `${textarea.scrollHeight}px`;
//   }, [note]);

//   // Handle note change with history
//   const handleNoteChange = (e) => {
//     const newNote = e.target.value.slice(0, maxChars);
//     setNote(newNote);
//     const newHistory = history.slice(0, historyIndex + 1);
//     newHistory.push(newNote);
//     setHistory(newHistory);
//     setHistoryIndex(newHistory.length - 1);
//     setError(null);
//   };

//   // Undo/Redo
//   const handleUndo = () => {
//     if (historyIndex > 0) {
//       setHistoryIndex(historyIndex - 1);
//       setNote(history[historyIndex - 1]);
//     }
//   };

//   const handleRedo = () => {
//     if (historyIndex < history.length - 1) {
//       setHistoryIndex(historyIndex + 1);
//       setNote(history[historyIndex + 1]);
//     }
//   };

//   const handleSave = async () => {
//     if (!note.trim()) {
//       setError('Note cannot be empty');
//       return;
//     }
//     setIsSaving(true);
//     setError(null);
//     try {
//       await setDoc(
//         doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
//         {
//           regionId,
//           segmentIndex: regionIndex,
//           notes: note,
//           maskUrl,
//           cutoutUrl,
//           position,
//         },
//         { merge: true }
//       );
//       onSave(regionId, note);
//     } catch (err) {
//       setError('Failed to save note: ' + err.message);
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   return (
//     <motion.div
//       className="addnotes-overlay"
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       exit={{ opacity: 0 }}
//       transition={{ duration: 0.3 }}
//     >
//       <motion.div
//         className="addnotes-popup"
//         initial={{ scale: 0.8, opacity: 0 }}
//         animate={{ scale: 1, opacity: 1 }}
//         exit={{ scale: 0.8, opacity: 0 }}
//         transition={{ duration: 0.3, ease: 'easeOut' }}
//         role="dialog"
//         aria-labelledby="addnotes-title"
//         aria-describedby="addnotes-description"
//       >
//         <div className="addnotes-header">
//           <h3 id="addnotes-title">
//             <span className="addnotes-color-indicator" style={{ backgroundColor: '#e982c8' }}></span>
//             Add Notes for Segment {regionIndex + 1}
//           </h3>
//         </div>
//         <div className="addnotes-preview">
//           <img
//             src={maskUrl}
//             alt={`Segment ${regionIndex + 1} preview`}
//             className="addnotes-preview-image"
//             onError={() => console.error(`Failed to load mask: ${maskUrl}`)}
//           />
//         </div>
//         <AnimatePresence>
//           {error && (
//             <motion.div
//               className="addnotes-error"
//               initial={{ opacity: 0, y: -10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: -10 }}
//               transition={{ duration: 0.2 }}
//             >
//               <MdErrorOutline size={20} />
//               {error}
//             </motion.div>
//           )}
//         </AnimatePresence>
//         <div className="addnotes-textarea-container">
//           <textarea
//             ref={textareaRef}
//             value={note}
//             onChange={handleNoteChange}
//             placeholder="Enter notes for this segment (e.g., 'This is the main subject of the image...')"
//             className="addnotes-textarea"
//             disabled={isSaving}
//             aria-describedby="addnotes-char-count"
//           />
//           <div className="addnotes-textarea-footer">
//             <span id="addnotes-char-count" className="addnotes-char-count">
//               {note.length}/{maxChars}
//             </span>
//             <div className="addnotes-undo-redo">
//               <motion.button
//                 className="addnotes-undo-button"
//                 onClick={handleUndo}
//                 disabled={historyIndex === 0 || isSaving}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//                 title="Undo last change"
//                 aria-label="Undo last change"
//               >
//                 <MdUndo size={20} />
//               </motion.button>
//               <motion.button
//                 className="addnotes-redo-button"
//                 onClick={handleRedo}
//                 disabled={historyIndex === history.length - 1 || isSaving}
//                 whileHover={{ scale: 1.1 }}
//                 whileTap={{ scale: 0.9 }}
//                 title="Redo last change"
//                 aria-label="Redo last change"
//               >
//                 <MdRedo size={20} />
//               </motion.button>
//             </div>
//           </div>
//         </div>
//         <div className="addnotes-buttons">
//           <motion.button
//             className="addnotes-save-button"
//             onClick={handleSave}
//             disabled={isSaving}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             aria-label="Save note"
//           >
//             {isSaving ? (
//               <span className="addnotes-spinner"></span>
//             ) : (
//               'Save Note'
//             )}
//           </motion.button>
//           <motion.button
//             className="addnotes-cancel-button"
//             onClick={onCancel}
//             disabled={isSaving}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             aria-label="Cancel and close"
//           >
//             Cancel
//           </motion.button>
//         </div>
//       </motion.div>
//     </motion.div>
//   );
// };

// export default AddNotes;
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { MdUndo, MdRedo, MdErrorOutline } from 'react-icons/md';
import './AddNotes.css';

const AddNotes = ({ regionId, lessonId, teacherEmail, regionIndex, maskUrl, cutoutUrl, position, onSave, onCancel, initialNote }) => {
  const [note, setNote] = useState(initialNote || '');
  const [history, setHistory] = useState([initialNote || '']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const maxChars = 500;
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [note]);

  // Handle note change with history
  const handleNoteChange = (e) => {
    const newNote = e.target.value.slice(0, maxChars);
    setNote(newNote);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newNote);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setError(null);
  };

  // Undo/Redo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setNote(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setNote(history[historyIndex + 1]);
    }
  };

  const handleSave = async () => {
    if (!note.trim()) {
      setError('Note cannot be empty');
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await setDoc(
        doc(db, 'Teachers', teacherEmail, 'Lessons', lessonId, 'Segments', regionId),
        {
          regionId,
          segmentIndex: regionIndex,
          notes: note,
          maskUrl,
          cutoutUrl,
          position,
        },
        { merge: true }
      );
      onSave(regionId, note);
    } catch (err) {
      setError('Failed to save note: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="addnotes-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="addnotes-popup"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        role="dialog"
        aria-labelledby="addnotes-title"
        aria-describedby="addnotes-description"
      >
        <div className="addnotes-header">
          <h3 id="addnotes-title">
            <span className="addnotes-color-indicator" style={{ backgroundColor: '#e982c8' }}></span>
            {initialNote ? 'Edit Notes' : 'Add Notes'} for Segment {regionIndex + 1}
          </h3>
        </div>
        <div className="addnotes-preview">
          <img
            src={maskUrl}
            alt={`Segment ${regionIndex + 1} preview`}
            className="addnotes-preview-image"
            onError={() => console.error(`Failed to load mask: ${maskUrl}`)}
          />
        </div>
        <AnimatePresence>
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
        </AnimatePresence>
        <div className="addnotes-textarea-container">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={handleNoteChange}
            placeholder="Enter notes for this segment (e.g., 'This is the main subject of the image...')"
            className="addnotes-textarea"
            disabled={isSaving}
            aria-describedby="addnotes-char-count"
          />
          <div className="addnotes-textarea-footer">
            <span id="addnotes-char-count" className="addnotes-char-count">
              {note.length}/{maxChars}
            </span>
            <div className="addnotes-undo-redo">
              <motion.button
                className="addnotes-undo-button"
                onClick={handleUndo}
                disabled={historyIndex === 0 || isSaving}
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
                disabled={historyIndex === history.length - 1 || isSaving}
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
        <div className="addnotes-buttons">
          <motion.button
            className="addnotes-save-button"
            onClick={handleSave}
            disabled={isSaving}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Save note"
          >
            {isSaving ? (
              <span className="addnotes-spinner"></span>
            ) : (
              'Save Note'
            )}
          </motion.button>
          <motion.button
            className="addnotes-cancel-button"
            onClick={onCancel}
            disabled={isSaving}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Cancel and close"
          >
            Cancel
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddNotes;