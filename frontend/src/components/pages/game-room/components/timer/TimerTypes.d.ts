type TimerStyles = Record<
    'player-timer'
    | 'shake'
    , string
>;

type TimerProps = {
    seconds: number;
    startTime: string;
    // onFinish: (selectedNumber?: number) => void;

};

type TimerRefType = Record<'endTime', Date>;

declare module "*/Timer.module.css" {
    const content: TimerStyles;
    export default content;
}