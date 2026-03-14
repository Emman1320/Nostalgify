// import enumConstants from "../../../../../constants/enum";

type BingoStyles = Record<
    "bingo-container"
    | "bingo-row"
    | "bingo-num"
    | "touch-ripple"
    | "strike-box"
    | "rotate"
    | "flip"
    | "stamp"
    | "success"
    | "failure"
    | "crown"
    | "meditating-crowned-man"
    | "crying-after-loss"
    | "heart-break"
    | "postgame-asset-fade"
    , string
>;
declare module "*/Bingo.module.css" {
    const content: BingoStyles;
    export default content;
}

type BingoNumberType = Record<'value' | 'row' | 'col', number> & Record<'isChecked', boolean>;

type Move = (point: BingoNumberType) => void;

type BingoProps = {
    bingoRef: React.Ref<BingoRefType>;
    updateTurn: (selectedNumber: number | undefined) => void
}

type BingoArrayType = Array<Array<BingoNumberType>>;
