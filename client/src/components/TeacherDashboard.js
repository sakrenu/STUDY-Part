// // client/src/components/TeacherDashboard.js
// import React, { useState } from 'react';
// import axios from 'axios';
// import Cropper from 'react-cropper';
// import 'cropperjs/dist/cropper.css';
// import './TeacherDashboard.css';

// const TeacherDashboard = () => {
//   const [image, setImage] = useState(null);
//   const [cropper, setCropper] = useState(null);
//   const [segmentedImage, setSegmentedImage] = useState(null);
//   const [imagePath, setImagePath] = useState(null);

//   const handleImageUpload = async (e) => {
//     const file = e.target.files[0];
//     const formData = new FormData();
//     formData.append('image', file);

//     try {
//       const response = await axios.post('http://localhost:5000/upload', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       setImagePath(response.data.image_path);
//       setImage(URL.createObjectURL(file));
//     } catch (error) {
//       console.error('Image upload error:', error);
//     }
//   };

//   const getCropData = () => {
//     if (cropper) {
//       const boundingBox = cropper.getCropBoxData();
//       return [boundingBox.left, boundingBox.top, boundingBox.width + boundingBox.left, boundingBox.height + boundingBox.top];
//     }
//     return null;
//   };

//   const handleSegmentation = async () => {
//     const boundingBox = getCropData();
//     if (!boundingBox) {
//       alert('Please select a part of the image.');
//       return;
//     }

//     try {
//       const response = await axios.post('http://localhost:5000/segment', {
//         image_path: imagePath,
//         bounding_box: boundingBox,
//       });
//       setSegmentedImage(response.data.segmented_image_path);
//     } catch (error) {
//       console.error('Segmentation error:', error);
//     }
//   };

//   return (
//     <div className="dashboard-container">
//       <h1 className="dashboard-title">Teacher Dashboard</h1>
//       <input type="file" accept="image/*" onChange={handleImageUpload} className="upload-button" />
//       {image && (
//         <div>
//           <Cropper
//             src={image}
//             style={{ height: 400, width: '100%' }}
//             aspectRatio={1}
//             guides={false}
//             onInitialized={(instance) => setCropper(instance)}
//           />
//           <button onClick={handleSegmentation} className="segment-button">
//             Segment Image
//           </button>
//         </div>
//       )}
//       {segmentedImage && (
//         <div>
//           <h2>Segmented Image</h2>
//           <img src={segmentedImage} alt="Segmented" className="segmented-image clickable-image" />
//         </div>
//       )}
//     </div>
//   );
// };

// export default TeacherDashboard;
// client/src/components/TeacherDashboard.js
import React, { useState } from 'react';
import axios from 'axios';
import Cropper from 'react-cropper';
import 'cropperjs/dist/cropper.css';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [image, setImage] = useState(null);
  const [cropper, setCropper] = useState(null);
  const [segmentedImage, setSegmentedImage] = useState(null);
  const [imagePath, setImagePath] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data && response.data.image_path) {
        setImagePath(response.data.image_path);
        setImage(URL.createObjectURL(file));
      } else {
        console.error('Image path not found in the response');
      }
    } catch (error) {
      console.error('Image upload error:', error.message || error);
    }
  };

  const getCropData = () => {
    if (cropper) {
      const cropBoxData = cropper.getCropBoxData();
      const imageData = cropper.getImageData();

      const scaleX = imageData.naturalWidth / imageData.width;
      const scaleY = imageData.naturalHeight / imageData.height;

      const x1 = Math.round(cropBoxData.left * scaleX);
      const y1 = Math.round(cropBoxData.top * scaleY);
      const x2 = Math.round((cropBoxData.left + cropBoxData.width) * scaleX);
      const y2 = Math.round((cropBoxData.top + cropBoxData.height) * scaleY);

      return [x1, y1, x2, y2];
    }
    return null;
  };

  const handleSegmentation = async () => {
    const boundingBox = getCropData();
    if (!boundingBox) {
      alert('Please select a part of the image.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/segment', {
        image_path: imagePath,
        bounding_box: boundingBox,
      });
      
      if (response.data && response.data.segmented_image_path) {
        setSegmentedImage(response.data.segmented_image_path);
      } else {
        console.error('Segmentation response is missing required data.');
      }
    } catch (error) {
      console.error('Segmentation error:', error.message || error);
      alert('An error occurred while segmenting the image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Teacher Dashboard</h1>
      <input type="file" accept="image/*" onChange={handleImageUpload} className="upload-button" />
      {image && (
        <div>
          <Cropper
            src={image}
            style={{ height: 400, width: '100%' }}
            aspectRatio={1}
            guides={false}
            onInitialized={(instance) => setCropper(instance)}
          />
          <button onClick={handleSegmentation} className="segment-button">
            Segment Image
          </button>
        </div>
      )}
      {loading && <p>Processing image segmentation...</p>}
      {/* {segmentedImage && (
        <div>
          <h2>Segmented Image</h2>
          <img src={segmentedImage} alt="Segmented" className="segmented-image clickable-image" />
        </div>
      )} */}
      {segmentedImage && (
  <div>
    <h2>Segmented Image</h2>
    <img src={segmentedImage} alt="Segmented" className="segmented-image clickable-image" />
    {console.log('Segmented Image Path:', segmentedImage)}
  </div>
)}

    </div>
  );
};

export default TeacherDashboard;
