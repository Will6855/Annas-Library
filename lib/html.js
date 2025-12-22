const generateHomePage = (baseUrl) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPDS Server</title>
  <style>
    body {
      font-family: sans-serif;
      margin: 20px;
      line-height: 1.6;
    }
    h1 { margin-bottom: 20px; }
    code {
      background: #f0f0f0;
      padding: 2px 6px;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <h1>OPDS Server</h1>
  
  <p>Add this URL to your e-reader:</p>
  <code>${baseUrl}/opds</code>
  
  <p>Supported Apps: Readest, Moon+ Reader, FBReader, Aldiko, KOReader, ReadEra</p>
</body>
</html>
`;

module.exports = { generateHomePage };