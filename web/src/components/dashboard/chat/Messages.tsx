import Message from "components/dashboard/chat/Message";
import Spinner from "components/Spinner";
import Style from "components/Style";
import { MESSAGES_PER_PAGE } from "config";
import { ReactionsContext } from "contexts/ReactionsContext";
import { useUser } from "contexts/UserContext";
import { useChannelById } from "hooks/useChannels";
import { useDirectMessageById } from "hooks/useDirects";
import { useMessagesByChat } from "hooks/useMessages";
import { useContext, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";
import { useParams } from "react-router-dom";

export default function Messages({ lastRead, filter }: { lastRead: number | null, filter: string }) {
  const { t } = useTranslation();
  const { channelId, dmId } = useParams();

  const [page, setPage] = useState(1);
  const { value: messages, loading } = useMessagesByChat(
    channelId || dmId,
    page
  );

  const [editMessage, setEditMessage] = useState("");

  const {checkedMessages, setCheckedMessages, setIsSelecting} = useContext(ReactionsContext);
  useEffect(() => {
    console.log(checkedMessages);
  }, [checkedMessages]);

  const handleSelect = (checked: boolean, message : any) => {
    if (checked) {
      console.log('1');
      setCheckedMessages([...checkedMessages, message]);
    } else {
      console.log('2');
      setCheckedMessages(checkedMessages.filter((i: any) => i.objectId !== message?.objectId));
    }
  }

  const { user } = useUser();
  const { value: channel } = useChannelById(channelId);
  const { value: direct } = useDirectMessageById(dmId);

  const chat = channel || direct;

  const { ref, inView } = useInView();

  const equalDate = (date1: any, date2: any) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    d1?.setHours(d1?.getHours() + 8);
    d2?.setHours(d2?.getHours() + 8);
    return d1?.getDate() === d2?.getDate();
  }

  const formattedDate = (date: any) => {
    const d = new Date(date);
    d?.setHours(d?.getHours() + 8);
    const today = new Date(new Date().toDateString());
    const dDate = new Date(d.toDateString());
    if (Math.floor((today - dDate) / 86400000) === 0) {
      return t('Today');
    }
    if (Math.floor((today - dDate) / 86400000) === 1) {
      return t('Yesterday');
    }
    return d?.toLocaleDateString("zh-CN", { year:"numeric", day:"numeric", month:"long"});
  }

  useEffect(() => {
    if (inView) setPage(page + 1);
  }, [inView]);

  useEffect(() => {
    setPage(1);
  }, [channelId, dmId]);

  const displayMessages = useMemo(
    () => (
      <div
        className="flex flex-1 flex-col-reverse overflow-y-auto m-1"
        id="contentMain"
      >
        {messages?.reduce((result: any, message: any) => {
          const regex = new RegExp(filter, "gi");
          const matchedText = message?.text.match(regex) === null ? "" : message?.text.match(regex)[0];
          const text = matchedText === "" ? message?.text : message?.text.replace(regex, `<span style="border-radius: 0.25rem; color: white; background-color: color: #daf0ff;">${matchedText}</span>`);
          result.push({...message, text});
          return result;
        }, []).map((message: any, index: number) => (
          <>
            <Style css={`
              .date-show {
                unicode-bidi: plaintext;
              }
              
              .date-show::before {
                content: attr(data-text);
              }
            `} />
            <Message
              key={message?.objectId}
              index={index}
              message={message}
              previousSameSender={
                index !== messages?.length
                  ? messages[index + 1]?.senderId === message?.senderId
                  : false
              }
              previousMessageDate={messages[index + 1]?.createdAt}
              editMessage={editMessage}
              setEditMessage={setEditMessage}
              handleSelect={handleSelect}
            >
              {lastRead !== null &&
                lastRead + 1 === message?.counter &&
                chat &&
                lastRead !== chat?.lastMessageCounter &&
                message?.senderId !== user?.uid && (
                  <div className="flex w-full items-center">
                    <div className="h-px w-full mx-3 my-3 th-bg-brred" />
                    <div className="font-medium text-sm mx-3 th-color-brred">
                      New
                    </div>
                  </div>
                )}
            </Message>
            {(index === messages?.length - 1 || (index < messages?.length - 1 && !equalDate(message?.createdAt, messages[index + 1]?.createdAt))) && (
              <div className="flex w-full justify-center items-center">
                <div className="h-px w-full ml-3 my-3 th-bg-forbr" />
                <span className="font-medium w-60 px-2 py-1 text-xs th-color-for th-border-for border text-center rounded-xl date-show" data-text={formattedDate(message?.createdAt)}></span>
                <div className="h-px w-full mr-3 my-3 th-bg-forbr" />
              </div>
            )}
          </>
        ))}
        {loading && messages?.length === 0 && (
          <div className="flex w-full items-center py-10 justify-center">
            <Spinner />
          </div>
        )}
        {!loading &&
          messages?.length > 0 &&
          messages?.length === page * MESSAGES_PER_PAGE && (
            <div ref={ref} className="opacity-0 w-full" />
          )}
      </div>
    ),
    [messages, loading, chat, lastRead, page, editMessage, filter, setIsSelecting]
  );

  return <>{displayMessages}</>;
}
