import { Dialog, Transition } from '@headlessui/react';
import { XIcon } from '@heroicons/react/outline';
import { useTheme } from 'contexts/ThemeContext';
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import { ReactionsContext } from 'contexts/ReactionsContext';
import { useReactMediaRecorder } from 'react-media-recorder';
import classNames from 'utils/classNames';
import { useTranslation } from 'react-i18next';

export default function VideoMessage() {
  const { t } = useTranslation();
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
              className="inline-block align-bottom rounded-xl border th-border-for text-left shadow-xl transform transition-all sm:my-2 sm:align-middle sm:max-w-xl sm:w-full"
            >
              <div
                className="pl-8 p-6 pb-4 flex justify-between items-center"
              >
                <h5
                  style={{ color: themeColors?.foreground }}
                  className="font-bold max-w-full truncate"
                >
                  {t("Video_Recorder")}
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
                  className="space-y-2 py-2 border-t th-border-for h-[500px] max-h-450 overflow-y-auto">
                  <div className="w-full px-5">
                    <div className="ml-2 flex items-center">
                      <select
                        disabled={(status === "idle" || status === "acquiring_media" || status === "stopped" || error) ? false : true}
                        className="block appearance-none w-48 th-bg-bg th-color-for border th-border-for bg-color-for py-2 px-4 pr-8 mr-2 text-sm rounded leading-tight"
                        onChange={handleChange}
                      >
                        <option value={1}>{t("Camera")} + {t("Microphone")}</option>
                        <option value={2}>{t("Screen")}</option>
                        <option value={3}>{t("Screen")} + {t("Microphone")}</option>
                      </select>
                      {(status === "idle" ||
                        status === "acquiring_media" ||
                        status === "stopped" ||
                        status === "paused" ||
                        error) ? (
                        <button className="button border-2 th-border-for p-2 rounded disabled:opacity-50 mr-2" onClick={startRecording} title={t("Start")}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 th-color-for" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"/>
                            <circle cx="12" cy="12" r="5"/>
                          </svg>
                        </button>
                      ) : (
                        <button className="button border-2 th-border-for p-2 rounded disabled:opacity-50 mr-2" title="recording">
                          <img src={`${process.env.PUBLIC_URL}/recording.png`} alt="recording" className="w-4 h-4" />
                        </button>
                      )}
                      {(status === "recording" ) && (
                        <button className={classNames(
                          "border-2 button th-border-for p-2 rounded disabled:opacity-50 mr-2"
                        )} disabled={status === "recording" ? false : true} onClick={pauseRecording} title={t("Pause")}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 th-color-for" fill="currentColor" height="512" viewBox="0 0 512 512" width="512">
                            <path d="m425.7 86.3c-45.3-45.3-105.6-70.3-169.7-70.3s-124.4 25-169.7 70.3-70.3 105.6-70.3 169.7 25 124.4 70.3 169.7 105.6 70.3 169.7 70.3 124.4-25 169.7-70.3 70.3-105.6 70.3-169.7-25-124.4-70.3-169.7zm-169.7 377.7c-114.7 0-208-93.3-208-208s93.3-208 208-208 208 93.3 208 208-93.3 208-208 208z"/>
                            <path d="m201.1 144c-8.8 0-16 7.2-16 16v192c0 8.8 7.2 16 16 16s16-7.2 16-16v-192c0-8.8-7.1-16-16-16z"/>
                            <path d="m310.9 144c-8.8 0-16 7.2-16 16v192c0 8.8 7.2 16 16 16s16-7.2 16-16v-192c0-8.8-7.2-16-16-16z"/>
                          </svg>
                        </button>
                      )}
                      {status !== "recording" && (
                        <button className={classNames(
                          "border-2 button th-border-for p-2 rounded disabled:opacity-50 mr-2"
                        )} disabled={status === "paused" ? false : true} onClick={resumeRecording} title={t("Resume")}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 th-color-for" fill="currentColor" viewBox="0 0 512 512" width="512" height="512">
                            <path d="M437.019,74.98C388.667,26.628,324.38,0,256,0C187.619,0,123.332,26.628,74.98,74.98C26.629,123.331,0,187.619,0,256    c0,68.38,26.629,132.667,74.98,181.019C123.332,485.371,187.62,512,256,512s132.667-26.629,181.019-74.981    C485.371,388.667,512,324.379,512,256C512,187.619,485.371,123.332,437.019,74.98z M256,482C131.383,482,30,380.617,30,256    S131.383,30,256,30s226,101.383,226,226S380.617,482,256,482z"/>
                            <path d="M392.033,243.01L199.232,131.697c-4.641-2.68-10.359-2.68-15,0c-4.641,2.679-7.5,7.631-7.5,12.99v222.621    c0,5.359,2.859,10.311,7.5,12.99c2.32,1.34,4.91,2.01,7.5,2.01c2.59,0,5.18-0.67,7.5-2.009L392.033,268.99    c4.641-2.68,7.5-7.632,7.5-12.991C399.533,250.641,396.674,245.689,392.033,243.01z M206.732,341.329V170.668L354.532,256    L206.732,341.329z"/>
                          </svg>
                        </button>
                      )}
                      <button className="button border-2 th-border-for p-2 rounded disabled:opacity-50 mr-2" disabled={(status === "recording" || status === "paused") ? false : true} onClick={stopRecording} title={t("Stop")}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 th-color-for">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z" />
                        </svg>
                      </button>
                      <button className="button border-2 th-border-for p-2 rounded disabled:opacity-50 mr-2" disabled={status === "stopped" ? false : true} onClick={() => videoFileBlob(mediaBlobUrl || "")} title={t("Save")}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 th-color-for" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2">
                          <rect className="cls-1" height="6.68" width="5.73" x="7.23" y="7.2"/>
                          <polygon className="cls-1" points="12.96 10.07 12.96 11.02 15.82 13.89 16.77 13.89 16.77 7.21 15.82 7.21 12.96 10.07 12.96 10.07"/>
                          <path className="cls-1" d="M1.5,5.3v9.54a3.82,3.82,0,0,0,3.82,3.82H7.23v2.86L13,18.66h5.73a3.82,3.82,0,0,0,3.82-3.82V5.3a3.82,3.82,0,0,0-3.82-3.82H5.32A3.82,3.82,0,0,0,1.5,5.3Z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="w-full flex flex-1 flex-col px-5">
                    <div className="mx-2">
                      <div>
                        <div className="flex items-center justify-center h-auto th-color-for">
                          {(status === "stopped" && mediaBlobUrl && mediaBlobUrl !== "") ?
                            <video src={mediaBlobUrl} controls className="w-full" /> :
                            (<>
                              {!hasCamera ? <div className="py-20">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-40 th-color-for" height="512" viewBox="0 0 32 32" width="512" fill="currentColor"><path d="m31 20.133c.004.513-.034.927-.153 1.314s-.36.787-.738 1.02c-.377.232-.784.243-1.078.213-.294-.031-.521-.104-.717-.162-1.457-.438-2.932-.871-4.377-1.326v-8.969c1.419-.525 2.85-1.047 4.272-1.568.199-.072.401-.103.599-.1.59.01 1.138.324 1.463.691.434.49.674 1.092.678 1.764zm-30-9.265v11.671c0 1.645 1.354 3.005 2.997 3.005h14.938c.841 0 1.602-.358 2.147-.926l-16.747-16.747c-1.824.149-3.292 1.62-3.335 2.997zm20.933 8.943v-8.943c0-1.645-1.354-2.997-2.997-2.997h-8.944l-4.587-4.586c-.187-.193-.446-.304-.716-.302-.553 0-1 .448-1 1 0 .271.11.531.306.719 8 8 16 15.999 23.999 23.998.376.403 1.01.425 1.413.049.404-.377.427-1.01.026-1.437z"/></svg>
                              </div> :
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
