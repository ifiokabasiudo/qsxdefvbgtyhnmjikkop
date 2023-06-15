import Head from "next/head"
import react from "react"
import { useState } from "react"

export default function Home(req, res) {
    const [question, nextQuestion] = useState("");
    const [result, setResult] = useState();
    const [isLoading, setLoading] = useState(false);

    console.log(question);

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const formData = new FormData();
        const myFile = document.querySelector("input[type='file']");
        console.log(myFile);
        formData.append("file", myFile.files[0]);
    
        const response = 
        await fetch("http://localhost:4000/api/upload/", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if(response.status === 200){
          const percentage1 = document.querySelector("#percentage");
          percentage1.innerText = data.percentage.toString();
        }else if(response.status === 500){
          alert(data.err.message);
          return;
        }else{
          alert(data.error || new Error(`Request failed with status ${response.status}`));
        }    
      }
      
      const onSubmit = async (error) => {
        error.preventDefault();
        setLoading(true);

        try {
          const response = await fetch("/api/api", {
            method: "POST",
            headers: {
              "Content-Type" : "application/json",
            },
            body: JSON.stringify({ question: question }),
          });

          const data = await response.json();
          if (response.status !== 200) {
            throw data.error || new Error(`Request failed with status ${response.status}`);
          }

          setResult(data.result);

          const myDiv1 = document.querySelector("#my-paragraph");
          myDiv1.innerText = data.result.toString();

          setLoading(false);

        }catch(error){
          console.error(error);
          alert(error.message);
          setLoading(false);
        } 
      }

    return (
        <div className="body">
            <script type="module" src="C:\Users\ENGR. IFIOKABASI\Desktop\Ifiok's stuff\Coding\AI-prototype-1\backend\server.js\pdf2json.js"></script>
            {/* <h1>Upload your pdf for training</h1>
            <form>
                <label htmlFor="file" className="form-label">Choose file:</label><br/>
                <input type="file" id="file-upload" name="file-upload" className="form-control"></input>
                <button onClick={handleSubmit} className="btn btn-outline-primary q-button">Submit</button><br/>
            </form>
            <div id="percentage"></div> */}
            <div className="q-form">
            <p>If you have a calculation question. Do it yourself ohhhh!</p>
            <form>
                <label htmlFor="question" className="form-label">Query:</label><br/>
                <input type="text" 
                className="form-control"
                placeholder="Enter a query"
                id="query" 
                name="query" 
                value={question}
                onChange={({target}) => nextQuestion(target?.value)}>
                </input>
                <button onClick={onSubmit} className="btn btn-outline-primary q-button">Submit</button>
                {isLoading && <div className="loader">Processing...</div>}
            </form>
            <p id="my-paragraph"></p>
            </div>

        </div>
    );
}