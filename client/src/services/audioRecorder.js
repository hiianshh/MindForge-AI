const MIME_TYPES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];

export async function createAudioRecorder() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
    throw new Error('Audio recording is not supported in this browser. Type your response instead.');
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type));
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
  const chunks = [];
  let resolveStopped;
  let rejectStopped;
  const stopped = new Promise((resolve, reject) => {
    resolveStopped = resolve;
    rejectStopped = reject;
  });
  stopped.catch(() => {});

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };
  recorder.onstop = () => resolveStopped(new Blob(chunks, { type: recorder.mimeType || 'audio/webm' }));
  recorder.onerror = () => rejectStopped(new Error('The audio recording could not be read. Please record again.'));
  recorder.start(1000);

  return {
    pause() {
      if (recorder.state === 'recording') recorder.pause();
    },
    resume() {
      if (recorder.state === 'paused') recorder.resume();
    },
    async stop() {
      if (recorder.state !== 'inactive') recorder.stop();
      try {
        return await stopped;
      } finally {
        stream.getTracks().forEach((track) => track.stop());
      }
    },
    dispose() {
      if (recorder.state !== 'inactive') recorder.stop();
      stream.getTracks().forEach((track) => track.stop());
    },
  };
}