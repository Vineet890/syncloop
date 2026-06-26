import { TrashIcon } from '../ui/Icons';

export default function VideoThread({
    replies,
    comments,
    user,
    handleDeleteVideo,
    handleDeleteComment,
    activeReplyBox,
    setActiveReplyBox,
    newCommentText,
    setNewCommentText,
    handlePostComment
}) {
    if (replies.length === 0) {
        return <p className="text-muted-foreground">No replies yet. Be the first to speak!</p>;
    }

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-semibold tracking-tight">Video Thread</h3>
            {replies.map((reply) => (
                <div key={reply._id} className="p-6 border bg-card text-card-foreground rounded-xl shadow-sm">
                    
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-muted-foreground">{new Date(reply.createdAt).toLocaleString()}</span>
                        {reply.userId === user.id && (
                            <button onClick={() => handleDeleteVideo(reply._id)} className="p-2 text-muted-foreground transition-colors rounded-md hover:bg-destructive/10 hover:text-destructive" title="Delete Video">
                                <TrashIcon />
                            </button>
                        )}
                    </div>

                    <div className="relative overflow-hidden mb-6 border bg-black rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-border/50">
                        <video src={reply.videoUrl} controls className="w-full aspect-video outline-none" />
                    </div>
                    
                    <div className="p-4 mb-6 border rounded-lg bg-primary/5 border-primary/20">
                        <h4 className="flex items-center gap-2 mb-2 text-sm font-semibold text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                            AI Summary
                        </h4>
                        <p className="text-sm leading-relaxed">{reply.textContent}</p>
                    </div>

                    <div className="p-6 border rounded-xl bg-background">
                        <h4 className="mb-4 text-sm font-medium text-muted-foreground">Discussion</h4>
                        
                        <div className="flex flex-col gap-4 mb-6">
                            {(comments[reply._id] || []).filter(c => !c.parentCommentId).map(comment => (
                                <div key={comment._id} className="flex flex-col gap-2">
                                    
                                    <div className="flex items-center justify-between p-4 border bg-muted/50 rounded-2xl">
                                        <div>
                                            <strong className="text-sm text-primary">{comment.userName}: </strong>
                                            <span className="text-sm text-foreground">{comment.text}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setActiveReplyBox(activeReplyBox === comment._id ? null : comment._id)} className="px-2 py-1 text-xs font-medium transition-colors rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">Reply</button>
                                            {comment.userId === user.id && (
                                                <button onClick={() => handleDeleteComment(comment._id)} className="p-1 transition-colors rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><TrashIcon /></button>
                                            )}
                                        </div>
                                    </div>

                                    {(comments[reply._id] || []).filter(c => c.parentCommentId === comment._id).map(nestedReply => (
                                        <div key={nestedReply._id} className="flex items-center justify-between p-4 ml-8 border-l-4 border bg-muted/50 rounded-2xl border-l-primary">
                                            <div>
                                                <strong className="text-sm text-primary">{nestedReply.userName}: </strong>
                                                <span className="text-sm text-foreground">{nestedReply.text}</span>
                                            </div>
                                            {nestedReply.userId === user.id && (
                                                <button onClick={() => handleDeleteComment(nestedReply._id)} className="p-1 transition-colors rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><TrashIcon /></button>
                                            )}
                                        </div>
                                    ))}

                                    {activeReplyBox === comment._id && (
                                        <div className="flex gap-2 ml-8 mt-1">
                                            <input type="text" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder={`Reply to ${comment.userName}...`} value={newCommentText[comment._id] || ''} onChange={(e) => setNewCommentText(prev => ({ ...prev, [comment._id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(reply._id, comment._id); }} />
                                            <button className="inline-flex items-center justify-center h-9 px-4 py-2 text-sm font-medium transition-colors rounded-md shadow bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" onClick={() => handlePostComment(reply._id, comment._id)}>Send</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2">
                            <input type="text" className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" placeholder="Write a comment..." value={newCommentText[reply._id] || ''} onChange={(e) => setNewCommentText(prev => ({ ...prev, [reply._id]: e.target.value }))} onKeyDown={(e) => { if (e.key === 'Enter') handlePostComment(reply._id, null); }} />
                            <button className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md shadow bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" onClick={() => handlePostComment(reply._id, null)}>Comment</button>
                        </div>
                    </div>

                </div>
            ))}
        </div>
    );
}
