import express from "express";
import pdf from "pdf-parse";
import multer from "multer";
import cors from "cors";
import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai";
import { PineconeClient } from "@pinecone-database/pinecone";

const upload = multer(); 
const app = express();

app.use(cors());
app.use( express.json() );
app.use( express.urlencoded({ extended: true}) );

dotenv.config();

// Initialize Openai
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

  // Initialize pinecone 
  const pinecone = new PineconeClient();
  await pinecone.init({
    environment: "us-central1-gcp",
    apiKey: "05cb4d94-686d-4d1b-b412-fb561175026b",
  });


// Declare constant
const EMBEDDING_MODEL = "text-embedding-ada-002";

// PDF CUSTOMIZATION (EMBEDDING)
app.post("/api/upload/", upload.single("file"), async (req, res) => {
  // Read the PDF file into a buffer
  const buffer = req.file.buffer;
  
  if(!req.file) {
    res.status(500).json({
      err: {
      message: "Upload failed"
    }
  });
    console.log("Error");
    return;
  }
  console.log(buffer);

  if (!configuration.apiKey) {
    res.status(500).json({
      err: {
        message: "OpenAI API key not properly configured",
      }
    });
    console.log("Error");
    return;
  }else {
    console.log("It's working!!!");
    // res.write("Please wait....");
  }

  try {
   const pdfText = pdf(buffer).then(function(data) {
      // PDF text
      return data.text;   
    });
    
    pdfText.then(async function(pdfText) {
      console.log(pdfText);

      // Pinecone Configuration 
      // const client = new PineconeClient(); 

      // await client.init({ 
      //   environment: "us-central1-gcp",
      //   apiKey: "05cb4d94-686d-4d1b-b412-fb561175026b", 
      // }); 

      // const list = await client.listIndexes();
      // console.log(list);

      // if(list[0] === "ai-prototype-1") {
      //   //Delete pinecone index
      //   await client.deleteIndex({indexName: 'ai-prototype-1'}).then(console.log("Deleted Successfully"));
      // }else {
      //   console.log("There is no index");
      // }

      // function delay(ms) {
      //       return new Promise(resolve => setTimeout(resolve, ms));
      //     }

      // //Create index
      // delay(15000).then(
      //   () => {
      //     pinecone.createIndex({
      //     createRequest: {
      //       name: "ai-prototype-1",
      //       dimension: 1536,
      //     },
      //   });
      //   }
      // )
      // if(res.status(201)) {
          console.log("Created Index");

          const words = pdfText
          .split(/\n \n|\n\n/);
          console.log(words.length);  

        //Populate index
        for(var i=0; i<words.length; i++){
          try {
            const pdfEmbedding = await openai.createEmbedding({
              model: EMBEDDING_MODEL,
              input: words[i],
            });
  
            const pdfTextEmbedding = pdfEmbedding.data.data[0].embedding;
            
            const pdfIndex = pinecone.Index("ai-prototype-1");
            const upsertRequest = { vectors: [ {id: "vec" + i+1507 , values: pdfTextEmbedding, metadata: { text: words[i] }} ] , namespace: "ai-prototype-1-namespace" };
  
            //initalizing.....this will take up to 2 mins
  
            // setTimeout(() => {
              pdfIndex.upsert({ upsertRequest });
              console.log("Upsert Successfull " + i);
  
              // if(!pdfIndex.upsert({ upsertRequest })){
              //   console.log("error");
              //   return;
              // }else{
                
                // const completionPercentage = Math.floor(i/words.length*100);
                // const count = "Uploading "+ completionPercentage + "%";
                // console.log(count);
                // res.json({percentage: count});
              // }
              
            // }, 120000);
          } catch (error) {
            if (error.response) {
              console.error(error.response.status, error.response.data); 
              res.status(error.response.status).json(error.response.data);
            } else {
              console.error(`Error with request: ${error.message}`);
              res.status(500).json({
                error: {
                  message: 'An error occurred during your request.',
                }
              });
            }            
          }
        }        
      // }else {
      //   console.log("Index couldn't be created");
      // }
      
        
    }).then(() => {console.log("Done!!!")});
    }catch (error) {
      if (error.response) {
        console.error(error.response.status, error.response.data); 
        res.status(error.response.status).json(error.response.data);
      } else {
        console.error(`Error with request: ${error.message}`);
        res.status(500).json({
          error: {
            message: 'An error occurred during your request.',
          }
        });
      }
  }
});


app.listen(4000, () => {
  console.log("Server listening on port 4000");
});