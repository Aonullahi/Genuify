import { useState, useRef, useEffect } from 'react';

interface ActivityDisplayProps {
  activities: { activity_1: string; activity_2: string; activity_3: string };

}



const ActivityDisplay = ({ activities }: ActivityDisplayProps) => {
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const mediaRecorderRefs = useRef<{ [key: string]: MediaRecorder | null }>({});
  const [videoSrcs, setVideoSrcs] = useState<{ [key: string]: string | null }>({});
  const [isRecording, setIsRecording] = useState<{ [key: string]: boolean }>({});
  const [analysisResults, setAnalysisResults] = useState<{ [key: string]: any }>({});
  const [isProcessing, setIsProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setVideoSrcs({});
    setAnalysisResults({});
  }, [activities]);

  const startRecording = async (key: string) => {
    const constraints = {
      video: { width: 1280, height: 720 },
      audio: {
        echoCancellation: true,  // Turn on echo cancellation
        noiseSuppression: true,  // Reduce background noise
        autoGainControl: true    // Automatically adjust microphone gain to normalize volume
      }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoRefs.current[key]!.srcObject = stream;
      videoRefs.current[key]!.muted = true;
      videoRefs.current[key]!.play();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRefs.current[key] = mediaRecorder;
      let videoChunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const completeBlob = new Blob(videoChunks, { type: 'video/webm' });
        const videoUrl = URL.createObjectURL(completeBlob);
        setVideoSrcs(prev => ({ ...prev, [key]: videoUrl }));
        videoRefs.current[key]!.src = videoUrl;
        videoRefs.current[key]!.muted = false;
        videoRefs.current[key]!.play();
      };

      mediaRecorder.start();
      setIsRecording(prev => ({ ...prev, [key]: true }));
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = (key: string) => {
    mediaRecorderRefs.current[key]?.stop();
    setIsRecording(prev => ({ ...prev, [key]: false }));

    const tracks = videoRefs.current[key]?.srcObject as MediaStream;
    tracks.getTracks().forEach(track => track.stop());
    videoRefs.current[key]!.srcObject = null;
  };

  const submitVideo = async (key: string) => {
    setIsProcessing(prev => ({ ...prev, [key]: true })); // Start processing
    if (!videoSrcs[key]) {
      console.error("No video source available for submission.");
      return;
    }

    try {
      const response = await fetch(videoSrcs[key]!);
      const blob = await response.blob();
      const formData = new FormData();
      formData.append("file", blob, `${key}.webm`);

      // Also append the activity description text for this specific activity
      const activityKey = `activity_${key.split('_')[1]}`;
      formData.append("description", activities[activityKey as keyof typeof activities]);

      const uploadResponse = await fetch('/api/analyse', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`HTTP error! Status: ${uploadResponse.status}`);
      }

      const data = await uploadResponse.json();
      console.log('Upload successful:', data);
      const resultText = data.message.parts[0].text.replace(/```json\n|\n```/g, '');
      setAnalysisResults(prev => ({ ...prev, [key]: JSON.parse(resultText) }));
    } catch (error) {
      console.error("Submission error:", error);
    }
  };
  // When the analysis result is set, stop processing
  useEffect(() => {
    const keysProcessing = Object.keys(isProcessing).filter(key => isProcessing[key]);
    keysProcessing.forEach(key => {
      if (analysisResults[key]) {
        setIsProcessing(prev => ({ ...prev, [key]: false }));
      }
    });
  }, [analysisResults, isProcessing]);

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  // Define a new state to track submitted activities
  const [submittedActivities, setSubmittedActivities] = useState<Record<string, boolean>>({});
  // Function to handle submission
  const handleSubmission = async (key: string) => {
    setIsProcessing(prev => ({ ...prev, [key]: true })); // Start processing
    try {
      await submitVideo(key);
      setSubmittedActivities(prev => ({ ...prev, [key]: true })); // Set the activity as submitted
    } catch (error) {
      console.error("Error submitting video:", error);
    } finally {
      setIsProcessing(prev => ({ ...prev, [key]: false })); // End processing
    }
  };


  return (
    <div className="max-w-4xl mx-auto mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(activities).map(([key, value], index) => (
        <div key={key} className="activity-card">
          <div className="flex justify-between">
            <h3 className="font-semibold text-black ">{`Activity ${index + 1}`}</h3>
            {/* Show a tick if the activity is submitted */}
            {submittedActivities[key] && (
              <span className="text-green-500">
                <svg className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M16.707 5.293a1 1 0 0 1 0 1.414l-8 8a1 1 0 0 1-1.414 0l-4-4a1 1 0 1 1 1.414-1.414L8 12.586l7.293-7.293a1 1 0 0 1 1.414 0z" />
                </svg>
              </span>
            )}
          </div>
          <p className="mb-4 text-left">{value}</p>
          <video ref={el => videoRefs.current[key] = el} style={{ width: "100%" }} controls loop />
          <div className="flex justify-between mt-4">
            <button
              className={`record-button ${isRecording[key] ? 'recording' : ''}`}
              onClick={() => isRecording[key] ? stopRecording(key) : startRecording(key)}
            >
              {isRecording[key] ? "Stop Recording" : videoSrcs[key] ? "Restart Recording" : "Start Recording"}
            </button>

            {videoSrcs[key] && (
              <button
                className="submit-video-button"

                onClick={() => handleSubmission(key)}
              >
                Submit Video
              </button>
            )}
          </div>
          {isProcessing[key] && (
            <div className="progress-bar-container">
              <div className="progress-bar"></div>
            </div>
          )}
          {analysisResults[key] && (
            <div style={{ marginTop: '1rem' }}>
              <div className={`text-white p-2 rounded ${getScoreColor(analysisResults[key].score * 100)}`}>
                Score: {analysisResults[key].score * 100}%
              </div>
              <div className="analysis-content">
                <p className="analysis-rationale">
                  <span className="analysis-description-title">Rationale:</span>{analysisResults[key].rationale}
                </p>
                <p className="analysis-description">
                  <span className="analysis-description-title">Description:</span>
                  {analysisResults[key].video_description}
                </p>
              </div>
            </div>
          )}

        </div>
      ))}
    </div>
  );
};

export default ActivityDisplay;
