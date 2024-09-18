import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import { useState, useEffect, useRef } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';
// import { ipcRenderer } from 'electron';

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        send(channel: string, ...args: any[]): void;
      };
    };
  }
}

// import './App.css';

function Hello() {
  // const [qstate, setQState] = useState<"ask"|"answer">('ask');
  const [conversation, setConversation] = useState<Array<ChatCompletionMessageParam>>([{role:"system",content:"You are helping my grandma use her computer. She doesn't understand computers that much. Answer questions in a compassionate and simple way, asking clarifying questions when necessary. Provide only up to three sentences of answer and provide a clear actionable step with visual descriptions. Do not rely upon keyboard commands as it is difficult for her to carry them out.She is using a Mac."}]);
  useEffect(() => {
    const storedConversation = localStorage.getItem('conversation');
    console.log("storedConversation",storedConversation)
    if (storedConversation) {
      console.log("setting conversation")
      setConversation(JSON.parse(storedConversation));
    }
  }, []);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (contentRef.current) {
        const { offsetHeight } = contentRef.current;
        window.resizeTo(window.outerWidth, offsetHeight + 100); // Adjust height with some padding
      }
    });

    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current);
      }
    };
  }, []);


  const lastAssistantMessage = conversation.findLast(message => message.role === "assistant")?.content;
  console.log("APIkey",process.env.REACT_APP_OPENAI_API_KEY)

  const handleSubmit =  async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent default form submission
    const target = e.currentTarget; // Get the current target
    const textarea = target.querySelector('textarea') as HTMLTextAreaElement; // Cast to HTMLTextAreaElement
    let updatedConvo: ChatCompletionMessageParam[] = [...conversation, {role: "user", content: textarea.value}]; // Ensure type matches
    // const msg = await anthropic.messages.create({
    //   model: "claude-3-5-sonnet-20240620",
    //   max_tokens: 1024,
    //   system: "You are helping my grandma use her computer. Answer questions in a compassionate and simple way, asking clarifying questions when necessary.",
    //   messages: [updatedConvo],
    // });
    console.log(process.env.REACT_APP_OPENAI_API_KEY)
    // dotenv.config(); // Load environment variables
     
    if (updatedConvo.length > 0){
      const msg = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ conversation: updatedConvo }),
      }).then(res => res.json()).then(data => {
        updatedConvo = [...updatedConvo, {role: "assistant", content: data}];
      }).catch(err => {
        console.error(err);
        updatedConvo = [...updatedConvo, {role: "assistant", content: "Could not connect to assistant. It could be because your internet is down or it could be a problem on our end."}];
      });

    }
    else{
      console.error("no input")
    }
  
    
    setConversation(updatedConvo);
    localStorage.setItem('conversation', JSON.stringify(updatedConvo));
    console.log("submitted")}

  return (
    <div ref={contentRef}>
      {/* <div className="Hello">
        <img width="200" alt="icon" src={icon} />
      </div> */}
      <div className="Hello">
        <h1>Ask a question</h1>
        <form onSubmit={handleSubmit}>
          <div>
            <textarea placeholder="Type your question here..." style={{ width: '18rem', height: 'auto', minHeight: '2rem', marginBottom: "1rem", resize: 'vertical' }} rows={1} />  
          </div>
          <div>
            <button type="submit">Submit</button> 
          </div>
        </form>
        {lastAssistantMessage && <div>{String(lastAssistantMessage)}</div>}
      </div>
      <button 
        onClick={() => window.close()}
        style={{ position: 'fixed', bottom: '20px', left: '20px' }}
      >
        Hide
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
