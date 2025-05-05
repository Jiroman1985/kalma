exports.handler = async function(event, context) {
  // Responder con HTML que incluya las metaetiquetas necesarias
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html'
    },
    body: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Domain Verification for Meta</title>
  <meta property="og:url" content="https://calma-lab.netlify.app/" />
  <meta property="fb:app_id" content="3029546990541926" />
</head>
<body>
  <h1>Meta Domain Verification</h1>
  <p>This page is used to verify the domain for Meta/Facebook.</p>
</body>
</html>
    `
  };
}; 