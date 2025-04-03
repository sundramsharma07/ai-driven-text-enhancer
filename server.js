const express = require('express');
const bodyParser = require('body-parser');
const spellchecker = require('spellchecker');

const app = express();
const port = 3000;

// Enhanced grammar rules
const grammarRules = {
  "i": "I",
  "im": "I'm",
  "iam": "I am",
  "dont": "don't",
  "wont": "won't",
  "cant": "can't",
  "plese": "please",
  "eny": "any",
  "thing": "anything",
  "its": "it's",
  "your": "you're",
  "theyre": "they're",
  "theres": "there's",
  "will you": "would you"
};

// Serve static files
app.use(express.static('public'));
app.use(bodyParser.json());

// Text Processing Endpoint
app.post('/process', (req, res) => {
  const { text, mode } = req.body;
  
  try {
    if (!text.trim()) throw new Error("Text cannot be empty");

    let processedText = text;
    
    // Enhanced spelling correction with fallback
    const words = processedText.split(/\s+/);
    processedText = words.map(word => {
      // Convert to lowercase for checking except for proper nouns
      const lowerWord = word.toLowerCase();
      if (grammarRules[lowerWord]) {
        return grammarRules[lowerWord];
      }
      
      // First try exact match
      if (!spellchecker.isMisspelled(word)) {
        return word;
      }
      
      // Get corrections
      let corrections = spellchecker.getCorrectionsForMisspelling(word);
      
      // If no corrections, try lowercase version
      if (corrections.length === 0) {
        corrections = spellchecker.getCorrectionsForMisspelling(lowerWord);
      }
      
      // If still no corrections, try common substitutions
      if (corrections.length === 0) {
        if (word.endsWith('r') && spellchecker.isMisspelled(word.slice(0, -1))) {
          corrections = spellchecker.getCorrectionsForMisspelling(word.slice(0, -1));
          if (corrections.length > 0) {
            return corrections[0] + 'r'; // Handle cases like "stor" -> "store"
          }
        }
      }
      
      return corrections.length > 0 ? corrections[0] : word;
    }).join(' ');

    // Additional phrase-level corrections
    processedText = processedText.replace(/\bi am\b/gi, "I'm");
    processedText = processedText.replace(/\bwill you\b/gi, "would you");

    // Basic grammar correction
    Object.entries(grammarRules).forEach(([incorrect, correct]) => {
      processedText = processedText.replace(new RegExp(`\\b${incorrect}\\b`, 'gi'), correct);
    });

    res.json({ 
      success: true, 
      original: text,
      result: processedText 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});