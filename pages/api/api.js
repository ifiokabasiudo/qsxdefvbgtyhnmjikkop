import { Configuration, OpenAIApi } from "openai";
import { PineconeClient } from "@pinecone-database/pinecone";

// Initialize Openai
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
  });
  const openai = new OpenAIApi(configuration);
  
  if (!configuration.apiKey) {
    console.log("Error");
    // return;
  }else {
    console.log("It's working");
  }

// Declare constants

const COMPLETIONS_MODEL = "text-davinci-003";
const EMBEDDING_MODEL = "text-embedding-ada-002";

export default async function api (req, res) {
    if (!configuration.apiKey) {
        res.status(500).json({
          error: {
            message: "OpenAI API key not properly configured",
          }
        });
        return;
      }

      const question = req.body.question || '';
      if (question.trim().length === 0) {
        res.status(400).json({
          error: {
            message: "Please enter a question",
          }
        });
        return;
      }

    const query = JSON.stringify(question);

    // Initialize pinecone 
        const pinecone = new PineconeClient();
        await pinecone.init({
          environment: "us-central1-gcp",
          apiKey: "05cb4d94-686d-4d1b-b412-fb561175026b",
        });
  
    const queryEmbedding = await openai.createEmbedding({
      model: EMBEDDING_MODEL,
      input: query,
    });
  
    const xq = queryEmbedding.data.data[0].embedding; 
  
    const queryIndex = pinecone.Index("ai-prototype-1");
    
    const queryRes = await queryIndex.query({
      queryRequest: {
        namespace: "ai-prototype-1-namespace",
        vector: xq,
        topK: 1,
        includeMetadata: true
      }    
    });
  
    const finalPrompt = `
        Info: ${queryRes.matches[0].metadata.text}
        Question: According to UPDATED MERGED NOTES AND REPORTS_15_06_2023.pdf and/or ONLY THE MAN'S NOTE AFTTER REPORTS.pdf ${query}.  
        Answer:
      `;
  
      try{
        const response = await openai.createCompletion({
          model: COMPLETIONS_MODEL,
          prompt: finalPrompt,
          max_tokens: 2048,
        });
    
        const completion = response.data.choices[0].text;
        
    
        console.log(completion);
        res.status(200).send({result: completion});
  
  
      }catch(error){
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
