// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const fs = require('fs').promises;
// const pdfParse = require('pdf-parse');
// const path = require('path');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 5000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // MongoDB connection
// mongoose.connect(process.env.MONGO_URI, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
// })
// .then(() => console.log('Connected to MongoDB'))
// .catch(err => console.error('Failed to connect to MongoDB:', err));

// // Ensure uploads directory exists
// const uploadsDir = path.join(__dirname, 'uploads');
// fs.mkdir(uploadsDir, { recursive: true })
//   .then(() => console.log('Uploads directory is ready'))
//   .catch(err => console.error('Error creating uploads directory:', err));

// // Configure multer for file upload
// const storage = multer.diskStorage({
//     destination: function (req, file, cb) {
//         cb(null, uploadsDir);
//     },
//     filename: function (req, file, cb) {
//         cb(null, Date.now() + '-' + file.originalname);
//     }
// });

// const upload = multer({ storage: storage });

// // Routes
// app.get('/', (req, res) => {
//     res.send("Backend Working");
// });

// app.post('/upload', upload.array('files', 10), async (req, res) => {
//     try {
//         if (!req.files || req.files.length === 0) {
//             console.log('No files uploaded.');
//             return res.status(400).json({ error: 'No files uploaded.' });
//         }

//         console.log('Files received:', req.files.map(f => f.path));

//         const processedFiles = [];

//         for (const file of req.files) {
//             const filePath = file.path;
//             console.log('Processing file:', filePath);
//             console.log('File type:', file.mimetype);

//             if (file.mimetype === 'application/pdf') {
//                 const dataBuffer = await fs.readFile(filePath);
//                 const pdfData = await pdfParse(dataBuffer);
//                 processedFiles.push({
//                     originalName: file.originalname,
//                     textContent: pdfData.text
//                 });
//             } else {
//                 // For non-PDF files, you might want to implement different processing logic
//                 const fileContent = await fs.readFile(filePath, 'utf8');
//                 processedFiles.push({
//                     originalName: file.originalname,
//                     textContent: fileContent.slice(0, 1000) // First 1000 characters
//                 });
//             }

//             // Optionally, remove the file after processing
//             // await fs.unlink(filePath);
//         }

//         res.json({ processedFiles });
//     } catch (error) {
//         console.error('Error processing files:', error);
//         res.status(500).json({ error: 'Error processing files', details: error.message });
//     }
// });

// // Error handling middleware
// app.use((err, req, res, next) => {
//     console.error('Error stack:', err.stack);
//     res.status(500).json({ error: 'Something went wrong!', details: err.message });
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`Server is running on http://localhost:${PORT}`);
// });

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const fs = require('fs').promises;
const pdfParse = require('pdf-parse');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');  // Import the existing User model
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB:', err));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdir(uploadsDir, { recursive: true })
  .then(() => console.log('Uploads directory is ready'))
  .catch(err => console.error('Error creating uploads directory:', err));

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Authentication routes
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error registering user' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).json({ error: 'Error logging in' });
    }
});

// Middleware to verify JWT
const verifyToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Access denied' });
    }
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.userId = verified.userId;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token' });
    }
};

// Protected route example
app.get('/protected', verifyToken, (req, res) => {
    res.json({ message: 'This is a protected route', userId: req.userId });
});

// Existing file upload route (now protected)
app.post('/upload', verifyToken, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            console.log('No files uploaded.');
            return res.status(400).json({ error: 'No files uploaded.' });
        }

        console.log('Files received:', req.files.map(f => f.path));

        const processedFiles = [];

        for (const file of req.files) {
            const filePath = file.path;
            console.log('Processing file:', filePath);
            console.log('File type:', file.mimetype);

            if (file.mimetype === 'application/pdf') {
                const dataBuffer = await fs.readFile(filePath);
                const pdfData = await pdfParse(dataBuffer);
                processedFiles.push({
                    originalName: file.originalname,
                    textContent: pdfData.text
                });
            } else {
                const fileContent = await fs.readFile(filePath, 'utf8');
                processedFiles.push({
                    originalName: file.originalname,
                    textContent: fileContent.slice(0, 1000) // First 1000 characters
                });
            }

            // Optionally, remove the file after processing
            // await fs.unlink(filePath);
        }

        res.json({ processedFiles });
    } catch (error) {
        console.error('Error processing files:', error);
        res.status(500).json({ error: 'Error processing files', details: error.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error stack:', err.stack);
    res.status(500).json({ error: 'Something went wrong!', details: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});