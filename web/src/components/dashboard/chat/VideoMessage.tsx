import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import { useTheme } from 'contexts/ThemeContext';
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { ReactionsContext } from 'contexts/ReactionsContext';
import { useReactMediaRecorder } from 'react-media-recorder';
import classNames from 'utils/classNames';

export default function VideoMessage() {
  const { themeColors } = useTheme();
  const {visibleVideoRecorder, setVisibleVideoRecorder, videoBlob, setVideoBlob} = useContext(ReactionsContext);
  const cancelButtonRef = useRef(null);
  const [hasMic, setHasMic] = useState(true);
  const [hasCamera, setHasCamera] = useState(true);
  const [audio, setAudio] = useState(false);
  const [video, setVideo] = useState(false);
  const [screen, setScreen] = useState(false);
  const [initialStream, setInitialStream] = useState<any>(null);
  const [recording, setRecording] = useState(false);

  const {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    isAudioMuted,
    muteAudio,
    unMuteAudio,
    mediaBlobUrl,
    clearBlobUrl,
    previewStream,
    error,
  } = useReactMediaRecorder({
    video: video,
    audio: audio, 
    screen: screen,
    blobPropertyBag: {
      type: 'video/mp4',
    },
    onStart: () => {
      setRecording(true);
    },
    onStop: () => {
      setRecording(false);
    }
  });

  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (ref.current && initialStream) {
      ref.current.srcObject = initialStream;
    }
  }, [initialStream]);

  const VideoPreview = ({ stream }: { stream: MediaStream | null }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
  
    useEffect(() => {
      if (videoRef.current && stream) {
        videoRef.current.srcObject = stream;
      }
    }, [stream]);
    if (!stream) {
      return <div className="text-sm font-bold py-24">Click the start button to record the video</div>;
    }
    return <video ref={videoRef} controls autoPlay className="w-full" />;
  };

  const videoFileBlob = async (url: string) => {
    console.log(url);
    const obj = await fetch(url);
    console.log(obj);
    const blob = await obj.blob();
    console.log(blob);
    const extension = blob.type.split("/").length > 1 ? blob.type.split("/")[1] : "wav";
    const remadeFile = new File([blob], `record.${extension}`, {type: blob.type});
    console.log(remadeFile);
    removeAllStream();
    setVideoBlob(remadeFile);
    setVisibleVideoRecorder(false);
    clearBlobUrl();
  }

  const handleChange = (e: any) => {
    console.log(typeof e.target.value, e.target.value);
    if (e.target.value === "1") {
      // setInitialStream(null);
      console.log(previewStream);
      console.log(initialStream);
      setVideo(true);
      setAudio(true);
      setScreen(false);
      clearBlobUrl();
    }
    if (e.target.value === "2") {
      setScreen(true);
      setAudio(false);
      setVideo(false);
      clearBlobUrl();
      // setInitialStream(null);
    }
    if (e.target.value === "3") {
      setScreen(true);
      setAudio(true);
      setVideo(false);
      clearBlobUrl();
      // setInitialStream(null);
    }
  }

  const handleClose = () => {
    setVideoBlob(null);
    setVisibleVideoRecorder(false);
    clearBlobUrl();
    removeAllStream();
  }

  const removeAllStream = () => {
    initialStream.getTracks().forEach((t: any) => {
      t.stop();
    });
    if (ref.current) {
      ref.current.srcObject = null;
    }
  }

  const detectMediaDevice =async () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        setInitialStream(stream);
        setHasCamera(true);
      })
      .catch((error) => {
        setHasCamera(false);
      })
  }

  useEffect(() => {
    if (!hasCamera || !hasMic) {
      console.log('user has no any device.');
    }
  }, [hasCamera, hasMic]);

  useEffect(() => {
    clearBlobUrl();
    setVideo(true);
    setAudio(true);
    setScreen(false);
  }, []);

  useEffect(() => {
    // setInitialStream(null);
    if (visibleVideoRecorder) {
      detectMediaDevice();
    }
    if (!visibleVideoRecorder) {
      clearBlobUrl();
    }
  }, [visibleVideoRecorder]);
  
  return (
    <Transition.Root show={visibleVideoRecorder} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 bottom-0 left-0 right-0 overflow-y-auto"
        style={{marginLeft: 318}}
        initialFocus={cancelButtonRef}
        open={visibleVideoRecorder}
        onClose={() => {}}
      >
        <div className="flex items-end justify-center pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Dialog.Overlay className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity" />
          </Transition.Child>

          {/* This element is to trick the browser into centering the modal contents. */}
          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div
              style={{ backgroundColor: themeColors?.background }}
              className="inline-block align-bottom rounded-xl border th-border-for text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full"
            >
              <div
                className="pl-8 p-6 pb-4 flex justify-between items-center"
              >
                <h5
                  style={{ color: themeColors?.foreground }}
                  className="font-bold max-w-full truncate"
                >
                  Video Recorder
                </h5>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={handleClose}
                >
                  <XIcon
                    className="h-5 w-5"
                    style={{ color: themeColors?.foreground }}
                  />
                </div>
              </div>
              <div>
                <div
                  className="space-y-6 py-2 border-t th-border-for h-[500px] max-h-[500px]">
                  <div className="w-full px-5">
                    <div className="ml-2 flex items-center">
                      <select
                        disabled={(status === "idle" || status === "acquiring_media" || status === "stopped" || error) ? false : true}
                        className="block appearance-none w-48 th-bg-bg th-color-for border th-border-for bg-color-for py-2 px-4 pr-8 mr-2 text-sm rounded leading-tight"
                        onChange={handleChange}
                      >
                        <option value={1}>Camera + Microphone</option>
                        <option value={2}>Screen</option>
                        <option value={3}>Screen + Microphone</option>
                      </select>
                      {(status === "idle" ||
                        status === "acquiring_media" ||
                        status === "stopped" ||
                        status === "paused" ||
                        error) ? (
                        <button className="button border-2 th-border-for p-2 rounded disabled:opacity-50 mr-2" onClick={startRecording} title="start">
                          <img src={`${process.env.PUBLIC_URL}/start.png`} alt="start" className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="button border-2 th-border-for p-2 rounded disabled:opacity-50 mr-2" title="recording">
                          <img src={`${process.env.PUBLIC_URL}/recording.png`} alt="recording" className="w-4 h-4" />
                        </button>
                      )}
                      {(status === "recording" ) && (
                        <button className={classNames(
                          "border-2 button th-border-for p-2 rounded disabled:opacity-50 mr-2"
                        )} disabled={status === "recording" ? false : true} onClick={pauseRecording} title="pause">
                          <img src={`${process.env.PUBLIC_URL}/pause.png`} alt="pause" className="w-4 h-4" />
                        </button>
                      )}
                      {status !== "recording" && (
                        <button className={classNames(
                          "border-2 button th-border-for p-2 rounded disabled:opacity-50 mr-2"
                        )} disabled={status === "paused" ? false : true} onClick={resumeRecording} title="resume">
                          <img src={`${process.env.PUBLIC_URL}/play.png`} alt="resume" className="w-4 h-4" />
                        </button>
                      )}
                      <button className="button border-2 th-border-for p-2 rounded disabled:opacity-50 mr-2" disabled={(status === "recording" || status === "paused") ? false : true} onClick={stopRecording} title="stop">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                        </svg>
                      </button>
                      <button className="button border-2 th-border-for p-2 rounded disabled:opacity-50 mr-2" disabled={status === "stopped" ? false : true} onClick={() => videoFileBlob(mediaBlobUrl || "")} title="save">
                        <img src={`${process.env.PUBLIC_URL}/video_camera.png`} alt="save" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full flex flex-1 flex-col px-5 pt-1">
                    <div className="mx-2 pb-2">
                      <div>
                        <div className="flex items-center justify-center h-auto th-color-for">
                          {(status === "stopped" && mediaBlobUrl && mediaBlobUrl !== "") ?
                            <video src={mediaBlobUrl} controls className="w-full" /> :
                            (<>
                              {!hasCamera ? <div className="py-20"><img className="h-40" src={`${process.env.PUBLIC_URL}/no_device.png`} alt="no device" /></div> :
                              (<>
                                {(video && !recording && initialStream) && <video ref={ref} controls autoPlay className="w-full" />}
                                {(video && !recording && !initialStream) && <div className="text-sm font-bold py-24">Click the start button to record the video</div>}
                                {(video && recording) && <VideoPreview stream={previewStream} />}
                                {(screen && !recording) && <div className="text-sm font-bold py-24">Click the start button to record the video</div>}
                                {(screen && recording) && <VideoPreview stream={previewStream} />}
                              </>)}
                            </>)
                          }
                        </div>
                        {error && 
                          <div className="bg-red-100 border-t-2 border-red-500 rounded-b text-red-900 px-4 py-3 shadow-md mt-2" role="alert">
                            <div className="flex items-center">
                              <div className="py-1"><svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/></svg></div>
                              <div>
                                <p className="font-bold text-sm th-color-for">{error}</p>
                              </div>
                            </div>
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-2" />
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
