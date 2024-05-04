const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json({ limit: '50mb' })); // Set the limit to a value suitable for your use case
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
const PORT = process.env.PORT || 5000;
app.use(express.static(path.join(__dirname, '../intern-project-frontend', 'build')));

// MongoDB connection
mongoose.connect('mongodb://localhost/Project', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define MongoDB schemas and models
const fileSchema = new mongoose.Schema({
  filename: String,
  type: String,
  file: Buffer, // New field to store file data
});


const questionSchema = new mongoose.Schema({
  id:String,
  text: String,
  sender: String,
});
const responseSchema=new mongoose.Schema({
  text:String,
});
const File = mongoose.model('File', fileSchema, 'Files');
const Question = mongoose.model('Question', questionSchema, 'Questions');
const Response= mongoose.model('Response',responseSchema,'Responses');

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
});



// API route for handling file uploads
app.post('/api/file', upload.single('file'), async (req, res) => {
  try {
    console.log('File Upload Request Received:', req.file);

    if (!req.file) {
      throw new Error('No file received.');
    }
    const { originalname, mimetype, buffer } = req.file;

    const newFile = new File({
      filename: originalname,
      type: mimetype,
      file: buffer, // Store the file data directly
    });
    await newFile.save();
    res.json({ success: true, message: 'File uploaded successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to upload file' });
  }
});

// API route for handling chat messages
app.post('/api/questions', async (req, res) => {
  try {
    console.log('Question Submission Request Received:', req.body);
    const { id, text } = req.body; // Extract 'id' and 'text' from the request body
    console.log('Received ID from Frontend:', id);
    const newQuestion = new Question({
      id: id,
      text: text,
      sender: 'user',
    });

    await newQuestion.save();


    // Simulate a bot response (replace with actual bot logic)
    const botResponse = 'Bot response goes here';

    res.json({ success: true, response: botResponse });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to save question' });
  }
});
app.get('/api/questions', async (req, res) => {
  try {
    // Fetch all questions from MongoDB
    const questions = await Question.find();

    res.json(questions);
    console.log(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch questions' });
  }
});
app.get('/api/files', async (req, res) => {
  try {
    const files = await File.find();
    res.json(files);
    console.log(files);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to fetch files' });
  }
});
// Handle cleanup on unload (assuming userId is passed in the request body)
// API route for handling data cleanup
app.delete('/api/clearData', async (req, res) => {
  try {
    await File.deleteMany({});
    await Question.deleteMany({});

    res.json({ success: true, message: 'Data cleared successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to clear data' });
  }
});

app.post('/api/questions/update/:id', async (req, res) => {
  try {
    const { text } = req.body;
    console.log(text);

    const updatedQuestion = await Question.findByIdAndUpdate(
      req.params.id,
      { text },
      { new: true }
    );

    if (!updatedQuestion) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, updatedQuestion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Failed to update question' });
  }
});



app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../intern-project-frontend', 'build', 'index.html'));
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
