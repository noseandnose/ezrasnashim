// Test the formatting function with real data

function testFormatting(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // Replace --- with line breaks (double breaks for spacing)
  formatted = formatted.replace(/---/g, '<br /><br />');
  
  // Process the text character by character to handle formatting markers
  let result = '';
  let lastIndex = 0;
  let isInBold = false;
  
  for (let i = 0; i < formatted.length - 1; i++) {
    // Check for ** (bold) markers
    if (formatted[i] === '*' && formatted[i + 1] === '*') {
      result += formatted.substring(lastIndex, i);
      
      if (!isInBold) {
        result += '<strong>';
      } else {
        result += '</strong>';
      }
      
      isInBold = !isInBold;
      i++; // Skip the second *
      lastIndex = i + 1;
    }
  }
  
  // Add any remaining text
  result += formatted.substring(lastIndex);
  
  return result;
}

// Test with real data
const testText = `Lashon hara is negative speech.

**Source**
Speaking lashon hara is prohibited.`;

console.log('Input:', testText);
console.log('Output:', testFormatting(testText));

// Test with simple case
const simpleTest = "This is **bold** text.";
console.log('\nSimple test:');
console.log('Input:', simpleTest);
console.log('Output:', testFormatting(simpleTest));