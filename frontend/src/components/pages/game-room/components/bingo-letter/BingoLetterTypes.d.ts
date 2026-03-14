
type BingoLetterStyles = Record<
    'bingo-letter-container'
    | 'bingo-letter'
    , string
>;

type BingoLetterProps = {
    isStriked: boolean;
    isGameOver: boolean;
    letterIndex: number;
    isWinner: boolean;

}

declare module "*/BingoLetter.module.css" {
    const content: BingoLetterStyles;
    export default content;
}