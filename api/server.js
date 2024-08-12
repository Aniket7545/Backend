

// require('dotenv').config();
// const express = require('express');
// const mongoose = require('mongoose');
// const multer = require('multer');
// const cors = require('cors');
// const fs = require('fs');
// const pdf = require('pdf-parse');
// const csv = require('csv-parse/sync');
// const xlsx = require('xlsx');
// const path = require('path');

// const app = express();
// const port = process.env.PORT || 3000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log('MongoDB Connected...'))
//   .catch(err => console.log(err));

// // Define Score Schema
// const ScoreSchema = new mongoose.Schema({
//   userId: String,
//   energyEfficiency: Number,
//   wasteReduction: Number,
//   sustainableSourcing: Number,
//   carbonFootprint: Number,
//   greenScore: Number,
//   date: { type: Date, default: Date.now }
// });

// const Score = mongoose.model('Score', ScoreSchema);

// // Multer Configuration
// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, 'uploads/');
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   }
// });

// const fileFilter = (req, file, cb) => {
//   const allowedExtensions = ['.pdf', '.csv', '.xlsx'];
//   const fileExtension = path.extname(file.originalname).toLowerCase();
//   if (allowedExtensions.includes(fileExtension)) {
//     cb(null, true);
//   } else {
//     cb(new Error('Invalid file type. Only PDF, CSV, and XLSX files are allowed.'), false);
//   }
// };

// const upload = multer({ 
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
// });

// // File Validation Functions
// const validateFile = async (file, category) => {
//   const extension = path.extname(file.originalname).toLowerCase();
//   const fileContent = fs.readFileSync(file.path);

//   switch (extension) {
//     case '.pdf':
//       return validatePDF(fileContent, category);
//     case '.csv':
//       return validateCSV(fileContent, category);
//     case '.xlsx':
//       return validateXLSX(fileContent, category);
//     default:
//       return false;
//   }
// };

// const validatePDF = async (fileContent, category) => {
//   try {
//     const data = await pdf(fileContent);
//     const text = data.text.toLowerCase();
//     const keywords = getCategoryKeywords(category);
//     return keywords.some(keyword => text.includes(keyword));
//   } catch (error) {
//     console.error('Error validating PDF:', error);
//     return false;
//   }
// };

// const validateCSV = (fileContent, category) => {
//   try {
//     const records = csv.parse(fileContent, { columns: true });
//     const content = records.map(record => Object.values(record).join(' ').toLowerCase()).join(' ');
//     const keywords = getCategoryKeywords(category);
//     return keywords.some(keyword => content.includes(keyword));
//   } catch (error) {
//     console.error('Error validating CSV:', error);
//     return false;
//   }
// };

// const validateXLSX = (fileContent, category) => {
//   try {
//     const workbook = xlsx.read(fileContent);
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const content = Object.values(sheet).map(cell => cell.v).join(' ').toLowerCase();
//     const keywords = getCategoryKeywords(category);
//     return keywords.some(keyword => content.includes(keyword));
//   } catch (error) {
//     console.error('Error validating XLSX:', error);
//     return false;
//   }
// };

// const getCategoryKeywords = (category) => {
//   switch (category) {
//     case 'energyEfficiency':
//       return ['energy consumption', 'power usage', 'electricity bill', 'energy saving'];
//     case 'wasteReduction':
//       return ['waste management', 'recycling program', 'landfill diversion', 'waste reduction'];
//     case 'sustainableSourcing':
//       return ['sustainable suppliers','sustainable sourcing', 'eco-friendly materials', 'fair trade', 'ethical sourcing'];
//     case 'carbonFootprint':
//       return ['carbon emissions', 'greenhouse gas', 'carbon offset', 'CO2 reduction'];
//     default:
//       return [];
//   }
// };

// // Calculate Green Score
// const calculateGreenScore = (files) => {
//   const weights = {
//     energyEfficiency: 0.3,
//     wasteReduction: 0.2,
//     sustainableSourcing: 0.2,
//     carbonFootprint: 0.3
//   };

//   let totalScore = 0;
//   Object.keys(weights).forEach(category => {
//     const file = files[category][0];
//     const fileSize = file.size;
//     const fileExtension = path.extname(file.originalname).toLowerCase();
    
//     // Base score calculation
//     let categoryScore = 100 - (fileSize / 1024 / 1024 * 10); // 10 points deducted per MB
    
//     // Adjust score based on file type
//     switch (fileExtension) {
//       case '.pdf':
//         categoryScore *= 1.1; // 10% bonus for PDFs
//         break;
//       case '.csv':
//         categoryScore *= 1.2; // 20% bonus for CSVs
//         break;
//       case '.xlsx':
//         categoryScore *= 1.15; // 15% bonus for Excel files
//         break;
//     }

//     // Ensure score is between 0 and 100
//     categoryScore = Math.max(0, Math.min(100, categoryScore));

//     totalScore += categoryScore * weights[category];
//   });

//   return Math.round(totalScore);
// };

// // Route for uploading files and calculating scores
// app.post('/upload', upload.fields([
//   { name: 'energyEfficiency', maxCount: 1 },
//   { name: 'wasteReduction', maxCount: 1 },
//   { name: 'sustainableSourcing', maxCount: 1 },
//   { name: 'carbonFootprint', maxCount: 1 }
// ]), async (req, res) => {
//   try {
//     // Validate files
//     for (let category in req.files) {
//       const file = req.files[category][0];
//       const isValid = await validateFile(file, category);
//       if (!isValid) {
//         return res.status(400).json({ message: `Invalid file content for ${category}. Please ensure the file contains relevant data.` });
//       }
//     }

//     // Calculate green score
//     const greenScore = calculateGreenScore(req.files);

//     // Save score to MongoDB
//     const newScore = new Score({
//       userId: req.body.userId || 'anonymous', // Replace with actual user ID from authentication system
//       energyEfficiency: req.files.energyEfficiency[0].size,
//       wasteReduction: req.files.wasteReduction[0].size,
//       sustainableSourcing: req.files.sustainableSourcing[0].size,
//       carbonFootprint: req.files.carbonFootprint[0].size,
//       greenScore: greenScore
//     });

//     await newScore.save();
//     res.json({ message: 'Score calculated and saved successfully.', greenScore: greenScore });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'An error occurred while processing the files.' });
//   } finally {
//     // Clean up uploaded files
//     Object.values(req.files).forEach(fileArray => {
//       fileArray.forEach(file => {
//         fs.unlink(file.path, (err) => {
//           if (err) console.error('Error deleting file:', err);
//         });
//       });
//     });
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running on port ${port}`);
// });

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const pdf = require('pdf-parse');
const csv = require('csv-parse/sync');
const xlsx = require('xlsx');
const path = require('path');
const { json } = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
try{
mongoose.connect('mongodb+srv://aniketverma816:dataface@cluster0.nb8th.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
console.log("MongoDB Connected")
}
catch{
  console.log("Error Connecting")
}

// Connect to MongoDB
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => console.log('MongoDB Connected...'))
//   .catch(err => console.log(err));
// Define Score Schema
const ScoreSchema = new mongoose.Schema({
  userId: String,
  scoreType: {
    type: String,
    enum: ['enterprise', 'individual', 'investor'],
    required: true
  },
  scores: {
    type: Map,
    of: Number
  },
  greenScore: Number,
  date: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', ScoreSchema);

// Multer Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.csv', '.xlsx'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, CSV, and XLSX files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB file size limit
});

// File Validation Functions
const validateFile = async (file, category) => {
  if (!file) {
    throw new Error(`Missing file for ${category}`);
  }

  const extension = path.extname(file.originalname).toLowerCase();
  const fileContent = fs.readFileSync(file.path);

  let isValid;
  switch (extension) {
    case '.pdf':
      isValid = await validatePDF(fileContent, category);
      break;
    case '.csv':
      isValid = validateCSV(fileContent, category);
      break;
    case '.xlsx':
      isValid = validateXLSX(fileContent, category);
      break;
    default:
      throw new Error(`Invalid file type for ${category}. Only PDF, CSV, and XLSX files are allowed.`);
  }

  if (!isValid) {
    throw new Error(`Invalid file content for ${category}. Please ensure the file contains relevant data.`);
  }
};

const validatePDF = async (fileContent, category) => {
  try {
    const data = await pdf(fileContent);
    const text = data.text.toLowerCase();
    const keywords = getCategoryKeywords(category);
    return keywords.some(keyword => text.includes(keyword));
  } catch (error) {
    console.error('Error validating PDF:', error);
    return false;
  }
};

const validateCSV = (fileContent, category) => {
  try {
    const records = csv.parse(fileContent, { columns: true });
    const content = records.map(record => Object.values(record).join(' ').toLowerCase()).join(' ');
    const keywords = getCategoryKeywords(category);
    return keywords.some(keyword => content.includes(keyword));
  } catch (error) {
    console.error('Error validating CSV:', error);
    return false;
  }
};

const validateXLSX = (fileContent, category) => {
  try {
    const workbook = xlsx.read(fileContent);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const content = Object.values(sheet).map(cell => cell.v).join(' ').toLowerCase();
    const keywords = getCategoryKeywords(category);
    return keywords.some(keyword => content.includes(keyword));
  } catch (error) {
    console.error('Error validating XLSX:', error);
    return false;
  }
};

const getCategoryKeywords = (category) => {
  const keywordMap = {
    // Enterprise keywords
    energyEfficiency: ['energy consumption', 'power usage', 'electricity bill', 'energy saving'],
    wasteReduction: ['waste management', 'recycling program', 'landfill diversion', 'waste reduction'],
    sustainableSourcing: ['sustainable suppliers','sustainable sourcing', 'eco-friendly materials', 'fair trade', 'ethical sourcing'],
    carbonFootprint: ['carbon emissions', 'greenhouse gas', 'carbon offset', 'CO2 reduction'],
    // Individual keywords
    electricity: ['electricity','electricity consumption', 'energy usage', 'electricity bill','electric bill', 'power consumption'],
    water: ['water','water usage', 'water bill', 'water consumption', 'water saving'],
    naturalGas: ['natural gas usage', 'gas consumption', 'gas bill', 'natural gas saving'],
    //crudeOil: ['crude oil consumption', 'oil usage', 'oil bill', 'fuel consumption'],
    // Investor keywords
    investmentPortfolio: ['investment portfolio', 'stocks', 'bonds', 'assets'],
    sustainableInvestments: ['ESG investments', 'green funds', 'sustainable finance'],
    carbonCredit: ['carbon credit', 'emissions trading', 'carbon market']
  };

  return keywordMap[category] || [];
};

// Calculate Green Score
const calculateGreenScore = (files, scoreType) => {
  const weights = getWeights(scoreType);
  
  let totalScore = 0;
  Object.keys(weights).forEach(category => {
    const file = files[category][0];
    const fileSize = file.size;
    const fileExtension = path.extname(file.originalname).toLowerCase();
    
    // Base score calculation
    let categoryScore = 100 - (fileSize / 1024 / 1024 * 10); // 10 points deducted per MB
    
    // Adjust score based on file type
    switch (fileExtension) {
      case '.pdf':
        categoryScore *= 1.1; // 10% bonus for PDFs
        break;
      case '.csv':
        categoryScore *= 1.2; // 20% bonus for CSVs
        break;
      case '.xlsx':
        categoryScore *= 1.15; // 15% bonus for Excel files
        break;
    }

    // Ensure score is between 0 and 100
    categoryScore = Math.max(0, Math.min(100, categoryScore));

    totalScore += categoryScore * weights[category];
  });

  return Math.round(totalScore);
};

const getWeights = (scoreType) => {
  switch (scoreType) {
    case 'enterprise':
      return {
        energyEfficiency: 0.3,
        wasteReduction: 0.2,
        sustainableSourcing: 0.2,
        carbonFootprint: 0.3
      };
    case 'individual':
      return {
        electricity: 0.25,
        water: 0.25,
        naturalGas: 0.25,
        //crudeOil: 0.25
      };
    case 'investor':
      return {
        investmentPortfolio: 0.4,
        sustainableInvestments: 0.4,
        carbonCredit: 0.2
      };
    default:
      throw new Error('Invalid score type');
  }
};

app.get("/", (req, res) => {
  res.send(
    "hello"
  )
})

// Route for uploading files and calculating scores
app.post('/upload/:scoreType', upload.fields([
  { name: 'energyEfficiency', maxCount: 1 },
  { name: 'wasteReduction', maxCount: 1 },
  { name: 'sustainableSourcing', maxCount: 1 },
  { name: 'carbonFootprint', maxCount: 1 },
  // { name: 'electricity', maxCount: 1 },
  // { name: 'water', maxCount: 1 },
  // { name: 'naturalGas', maxCount: 1 },
  // // { name: 'crudeOil', maxCount: 1 },
  // { name: 'investmentPortfolio', maxCount: 1 },
  // { name: 'sustainableInvestments', maxCount: 1 },
  // { name: 'carbonCredit', maxCount: 1 }
]), async (req, res) => { 
  try {
    const scoreType = req.params.scoreType;
    const requiredFields = Object.keys(getWeights(scoreType));
 
    // Validate files
    for (let category of requiredFields) {
      try {
        await validateFile(req.files[category] ? req.files[category][0] : null, category);
      } catch (error) {
        return res.status(400).json({ message: error.message });
      }
    }

    // Calculate green score
    const greenScore = calculateGreenScore(req.files, scoreType);

    // Save score to MongoDB
    const newScore = new Score({
      userId: req.body.userId || 'anonymous',
      scoreType: scoreType,
      scores: Object.fromEntries(requiredFields.map(field => [field, req.files[field][0].size])),
      greenScore: greenScore 
    });
    // const newScore = new Score({
    //   userId: req.body.userId || 'anonymous',
    //   scoreType: scoreType,
    //   scores: Object.fromEntries(requiredFields.map(field => [field, req.files[field][0].size])),
    //   greenScore: greenScore
    // });

    await newScore.save();
    res.json({ message: 'Score calculated and saved successfully.', greenScore: greenScore });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while processing the files.' });
  } finally {
    // Clean up uploaded files
    if (req.files) {
      Object.values(req.files).forEach(fileArray => {
        fileArray.forEach(file => {
          fs.unlink(file.path, (err) => {
            if (err) console.error('Error deleting file:', err);
          });
        });
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});