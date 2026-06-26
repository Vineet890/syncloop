import { CameraIcon } from '../ui/Icons';

export default function VideoRecorder({
    meetingStatus,
    videoPreviewRef,
    isRecording,
    isUploading,
    cancelRecording,
    stopRecording,
    startRecording
}) {
    if (meetingStatus !== 'Open') {
        return (
            <div className="p-8 text-center border bg-card text-card-foreground rounded-2xl shadow-sm">
                <h3 className="mb-2 text-lg font-semibold text-destructive">Meeting Closed</h3>
                <p className="text-muted-foreground">No further videos can be added to this thread.</p>
            </div>
        );
    }

    return (
        <div className="p-6 border bg-card text-card-foreground rounded-2xl shadow-sm">
            <h3 className="mb-4 text-lg font-semibold tracking-tight">Record a Reply</h3>
            <div className="overflow-hidden mb-4 border rounded-xl bg-muted">
                <video ref={videoPreviewRef} autoPlay muted className={`w-full aspect-video bg-black ${isRecording ? 'block' : 'hidden'}`} />
                {!isRecording && <div className="flex items-center justify-center p-12 text-muted-foreground aspect-video">Camera Off</div>}
            </div>
            {isUploading ? (
                <button className="inline-flex items-center justify-center w-full h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md shadow bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50" disabled>⏳ Processing video & generating insights...</button>
            ) : isRecording ? (
                <div className="flex gap-4">
                    <button onClick={cancelRecording} className="flex-1 inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors border rounded-md text-destructive border-destructive hover:bg-destructive/10">
                        Cancel
                    </button>
                    <button onClick={stopRecording} className="flex-[2] inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-medium transition-colors rounded-md shadow bg-green-600 text-white hover:bg-green-700">
                        Finish & Upload
                    </button>
                </div>
            ) : (
                <button onClick={startRecording} className="flex items-center justify-center w-full gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-md shadow bg-primary text-primary-foreground hover:bg-primary/90">
                    <CameraIcon />
                    Start Camera
                </button>
            )}
        </div>
    );
}
