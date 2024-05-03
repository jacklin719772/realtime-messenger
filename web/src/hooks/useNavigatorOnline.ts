import { useEffect, useState } from "react"

const goOnlineStatus = () => typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;

export const useNavigatorOnline = () => {
    const [status, setStatus] = useState(goOnlineStatus());

    const setOnline = () => setStatus(true);
    const setOffline = () => setStatus(false);

    useEffect(() => {
        window.addEventListener('online', setOnline);
        window.addEventListener('offline', setOffline);

        return () => {
            window.addEventListener('online', setOnline);
            window.addEventListener('offline', setOffline);
        }
    }, []);
    
    return status;
}