import { Dialog, Transition } from '@headlessui/react';
import { PauseIcon, PlayIcon, SearchIcon, StopIcon, XIcon } from '@heroicons/react/outline';
import { useTheme } from 'contexts/ThemeContext';
import { Fragment, useContext, useEffect, useRef, useState } from 'react'
import Forward from "components/dashboard/chat/Forward";
import { ReactionsContext } from 'contexts/ReactionsContext';
import Style from 'components/Style';
import { useAudioRecorder } from "@sarafhbk/react-audio-recorder";
// import AudioReactRecorder, { RecordState } from 'audio-react-recorder'

export default function VoiceMessage() {
  const { themeColors } = useTheme();
  const {visibleAudioRecorder, setVisibleAudioRecorder, voiceBlob, setVoiceBlob} = useContext(ReactionsContext);
  const cancelButtonRef = useRef(null);

  const {
    audioResult,
    timer,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    status,
    errorMessage,
  } = useAudioRecorder();

  console.log(stopRecording);

  const audioFileBlob = async (url: string) => {
    const obj = await fetch(url);
    console.log(obj);
    const blob = await obj.blob();
    console.log(blob);
    const extension = blob.type.split("/").length > 1 ? blob.type.split("/")[1] : "wav";
    const remadeFile = new File([blob], `record.${extension}`, {type: blob.type});
    setVoiceBlob(remadeFile);
    setVisibleAudioRecorder(false);
  }

  useEffect(() => {
    if (audioResult && audioResult !== "") {
      audioFileBlob(audioResult);
    }
  }, [audioResult]);
  
  return (
    <Transition.Root show={visibleAudioRecorder} as={Fragment}>
      <Dialog
        as="div"
        static
        className="fixed z-10 inset-0 overflow-y-auto"
        initialFocus={cancelButtonRef}
        open={visibleAudioRecorder}
        onClose={setVisibleAudioRecorder}
      >
        <Style css={`
          input:focus {
            border: none
          }
        `} />
        <div className="flex items-end justify-center pt-4 px-4 pb-20 text-center sm:block sm:p-0 max-h-450">
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
              className="inline-block align-bottom rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full"
            >
              <div
                className="pl-8 p-6 pb-4 flex justify-between items-center"
              >
                <h5
                  style={{ color: themeColors?.foreground }}
                  className="font-bold max-w-full truncate"
                >
                  Voice Message
                </h5>
                <div
                  role="button"
                  tabIndex={0}
                  className="cursor-pointer focus:outline-none"
                  onClick={() => setVisibleAudioRecorder(false)}
                >
                  <XIcon
                    className="h-5 w-5"
                    style={{ color: themeColors?.foreground }}
                  />
                </div>
              </div>
              <div>
                <div
                  className="space-y-6 pt-2 pb-8 border-t th-border-selbg rounded">
                  <div className="w-full flex flex-1 flex-col px-5 pt-1">
                    <div className="mx-5 pb-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <audio controls src={audioResult} className="w-full" />
                          <div className="ml-2 flex justify-between items-center w-28">
                            {status === "idle" && (
                              <button className="button border th-border-selbg p-2 rounded" onClick={startRecording}>
                                <PlayIcon className="w-6 h-6 th-color-for" />
                              </button>
                            )}
                            {status === "recording" && (
                              <button className="button border th-border-selbg p-2 rounded" onClick={pauseRecording}>
                                <PauseIcon className='w-6 h-6 th-color-for' />
                              </button>
                            )}
                            {status === "paused" && (
                              <button className="button border th-border-selbg p-2 rounded" onClick={resumeRecording}>
                                <PlayIcon className="w-6 h-6 th-color-for" />
                              </button>
                            )}
                            <button className="button border th-border-selbg p-2 rounded" onClick={stopRecording}>
                              <StopIcon className="w-6 h-6 th-color-for" />
                            </button>
                          </div>
                        </div>
                        {errorMessage && 
                          <div className="text-base th-color-for">
                            Error: <span className="font-bold th-color-red">{errorMessage}</span>
                          </div>
                        }
                        <div className="pt-2 text-center text-base th-color-for">
                          <p>{new Date(timer * 1000).toISOString().substr(11, 8)}</p>
                        </div>
                      </div>
                      {/* <AudioReactRecorder state={recordState} onStop={onStop} /> */}
                      {/* <div>
                        <AudioReactRecorder state={recordState} onStop={onStop} />
                        <audio
                          id='audio'
                          controls
                          src={audioData ? audioData.url : null}
                        ></audio>
                        <button onClick={start}>Start</button>
                        <button onClick={stop}>Stop</button>
                      </div> */}
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
