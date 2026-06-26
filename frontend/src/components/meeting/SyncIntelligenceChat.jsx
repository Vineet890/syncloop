import { useRef, useEffect } from 'react';

export default function SyncIntelligenceChat({ 
    chatMessages, 
    chatInput, 
    setChatInput, 
    handleSendMessage, 
    isChatting 
}) {
    const chatScrollRef = useRef(null);

    useEffect(() => {
        if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }, [chatMessages]);

    return (
        <div className="flex flex-col p-6 border bg-card text-card-foreground rounded-2xl shadow-sm h-[500px]">
            <h3 className="flex items-center gap-2 mb-4 text-lg font-semibold tracking-tight">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                Sync Intelligence
            </h3>
            <div ref={chatScrollRef} className="flex flex-col flex-1 gap-4 pr-2 mb-4 overflow-y-auto">
                {chatMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-70">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-4"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                        <p className="text-sm">Ask me to summarize the thread, list action items, or find specific details.</p>
                    </div>
                ) : (
                    chatMessages.map((msg, idx) => (
                        <div key={idx} className={`p-4 max-w-[85%] text-sm rounded-2xl ${msg.role === 'user' ? 'self-end bg-primary text-primary-foreground rounded-tr-none' : 'self-start bg-muted text-foreground rounded-tl-none'}`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    ))
                )}
            </div>
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-4 border-t mt-auto">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask a question..." className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" disabled={isChatting} />
                <button type="submit" className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md shadow bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" disabled={isChatting}>Send</button>
            </form>
        </div>
    );
}
