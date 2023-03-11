//declare dependencies
require('dotenv').config({path: './.env'})
const { AzureKeyCredential, DocumentAnalysisClient } = require("@azure/ai-form-recognizer");
const fs = require('fs');
const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config
var bodyParser = require('body-parser')

//configure express
app.use(cors());

var jsonParser = bodyParser.json({limit: '5mb'})

// const allowedOrigins = ['http://localhost:3001', 'https://kidcare.azurewebsites.net/'];
// app.use(cors({
//   origin: function (origin, callback) {
//     if (allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error('Not allowed by CORS'));
//     }
//   }
// }));

app.use(cors())

app.get('/', (req,res) => {
  res.send("Hello");
})

//setup post method for express
app.post('/upldVaccData', jsonParser, async (req, res) => {
  
  let docFrmUI = req.body.previewUrl

  docFrmUI = docFrmUI.split("base64,")[1];
  const buffer = Buffer.from(docFrmUI, 'base64');
  
  const fileName = 'output.png';
  fs.writeFileSync(fileName, buffer);

  let response = await main(buffer)
  console.log(response);
  res.send(response)
  
  // .catch((error) => {
  //   console.error("An error occurred:", error);
  //   process.exit(1);
  // });

  // res.send(response);
});

const port = process.env.DEV_PORT || 3000;
app.listen(port, () => {
  console.log('Server is running on port 3000');
});

async function main(docFrmUI) {

  const endpoint = process.env.FORM_RECOGNIZER_ENDPOINT || "https://kidcareai.cognitiveservices.azure.com/";
  const credential = new AzureKeyCredential(process.env.FORM_RECOGNIZER_API_KEY || "dc933415f95246faaba6128a77f6f8ed");
  const client = new DocumentAnalysisClient(endpoint, credential);

  const modelId = process.env.FORM_RECOGNIZER_CUSTOM_MODEL_ID || "model_1";

  const poller = await client.beginAnalyzeDocument(modelId,docFrmUI);

  const {
    documents: [document],
  } = await poller.pollUntilDone();

  if (!document) {
    throw new Error("Expected at least one document in the result.");
  }

  console.log(
    "Extracted document:",
    document.docType,
    `(confidence: ${document.confidence || "<undefined>"})`
  );

  let y = document.fields['Updated table'];
  let z = y.values.map((x) => x.properties);
  z.forEach((x) => {
    x.COLUMN1 = (x.COLUMN1) ? x.COLUMN1.content : "";
    x.COLUMN2 = (x.COLUMN2) ? x.COLUMN2.content : "";
    x["Given on"] = (x["Given on"]) ? x["Given on"].content : "";
  })

  // console.log(z);
  return z;

}

