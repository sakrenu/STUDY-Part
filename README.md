# StudyPart

## Overview
StudyPart is a comprehensive educational platform designed to enhance interactive learning experiences for students while streamlining teaching workflows for educators. The application combines AI-powered features with intuitive interfaces to create a modern learning ecosystem.

## Key Features
- **Interactive Learning Modes**: 
  - TalkToNotes: Voice-to-text note generation
  - LearningMode: Adaptive content delivery system
  - CoursePage: Structured curriculum management

- **Teacher Tools**:
  - QuizTeachingDashboard: Real-time assessment creation
  - TeachByPart: Modular lesson planning
  - ManageStudents: Classroom management interface
  - PointSegmentation: Visual content analysis tool

- **Content Management**:
  - Library: Centralized resource repository
  - Media Saver: Multimedia content handling
  - Note Saver: Persistent note storage

## Technology Stack
**Frontend**: 
- React.js with Tailwind CSS
- Firebase integration for real-time data
- Responsive design for cross-device compatibility

**Backend**:
- Python Flask API
- Gemini AI integration (gemini_service.py)
- Segment Anything Model (SAM) for image processing
- Firebase backend for authentication/storage

**Infrastructure**:
- Docker containerization
- RESTful API architecture
- Modular codebase structure

## Installation
1. Clone repository
2. Install dependencies:
   ```bash
   # Frontend
   cd client && npm install

   # Backend
   cd backend && pip install -r requirements.txt
   ```
3. Configure environment variables in `.env` files
4. Start Docker containers:
   ```bash
   docker-compose up
   ```

## Usage
1. Teachers can create interactive lessons using TeachByPart
2. Students engage with content through LearningMode
3. Use QuizTeachingDashboard for real-time assessments
4. Manage educational resources via the Library interface

## Contributing
Please follow standard contribution guidelines:
1. Fork the repository
2. Create feature branches
3. Submit pull requests with detailed descriptions

## License
MIT License - see LICENSE file for details

## Project Structure
```
├── client/          # React frontend
├── backend/         # Python API and services
├── Dockerfile       # Container configuration
└── README.md        # Project documentation
```

For detailed technical documentation, see the [docs/](docs/) directory.
