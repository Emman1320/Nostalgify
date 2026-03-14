import React, { useEffect, useRef, useState } from 'react'
import classes from "./Timer.module.css";

const Timer: React.FC<TimerProps> = ({ seconds, startTime }) => {
    const timerRef = useRef<TimerRefType>({ endTime: new Date() });
    const [isShaking, setIsShaking] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

    useEffect(() => {
        timerRef.current.endTime = new Date(new Date(startTime).getTime() + seconds * 1000);
        const updateTimer = () => {
            const timeRemaining = Math.floor((timerRef?.current?.endTime?.getTime() - new Date().getTime()) / 1000);
            setSecondsRemaining(timeRemaining);
            return timeRemaining;
        }
        updateTimer();
        const timerInterval = setInterval(() => {
            const timeRemaining = updateTimer();
            if (timeRemaining <= 5 && timeRemaining >= 0 && !isShaking) {
                setIsShaking(true);
                setTimeout(() => {
                    setIsShaking(false);
                }, 500);
            }
            if (timeRemaining <= 0) {
                clearInterval(timerInterval);
                // setTimeout(() => {
                //     onFinish();
                // }, 1000)
            }
        }, 1000);
        return () => {
            clearInterval(timerInterval);
        }
    }, [seconds, startTime]);

    return (
        <div
            className={`${classes['player-timer']} ${isShaking ? classes['shake'] : ''}`}
            style={secondsRemaining !== null && secondsRemaining <= 5 ? { color: "red" } : {}}
        >
            {secondsRemaining !== null && (secondsRemaining > 0 ? secondsRemaining : 0)}
        </div >
    )
}

export default Timer;