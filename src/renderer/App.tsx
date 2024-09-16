import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources';

// import './App.css';

function Hello() {
  // const [qstate, setQState] = useState<"ask"|"answer">('ask');
  const [conversation, setConversation] = useState<Array<ChatCompletionMessageParam>>([{role:"system",content:"You are helping my grandma use her computer. She doesn't understand computers that much. Answer questions in a compassionate and simple way, asking clarifying questions when necessary. She is using a Mac."}]);
  const lastAssistantMessage = conversation.findLast(message => message.role === "assistant")?.content;
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
    const client = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
    });
    if (updatedConvo.length > 0){
      const msg = await client.chat.completions.create({
        messages: updatedConvo as ChatCompletionMessageParam[], // Cast to the correct type
        model: 'gpt-4o-2024-08-06',
      });
      updatedConvo = [...updatedConvo, {role: "assistant", content: msg.choices[0].message.content}];

    }
    else{
      console.error("no input")
    }
  
    
    setConversation(updatedConvo);
    console.log("submitted")}

  return (
    <div>
      {/* <div className="Hello">
        <img width="200" alt="icon" src={icon} />
      </div> */}
      <div className="Hello">
        <h1>Ask a question</h1>
        {lastAssistantMessage && <div>{String(lastAssistantMessage)}</div>}
        <form onSubmit={handleSubmit}>
          <div>
            <textarea placeholder="Type your question here..." style={{ width: '18rem', height: 'auto', minHeight: '2rem', marginBottom: "1rem", resize: 'vertical' }} rows={1} />  
          </div>
          <div>
            <button type="submit">Submit</button> 
          </div>
        </form>
      </div>
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
