import enumConstants from "../../../../../constants/enum";

export const TABLE_SIZE = 5;

export const bingoColors = [
    ['#e04f8a', '#b44287', '#8a3684', '#602b83', '#391f82'],
    ['#e06582', '#b55a85', '#884f86', '#5e428c', '#34398d'],
    ['#e27e7c', '#b67384', '#89678a', '#5d5d93', '#37539c'],
    ['#e39a79', '#b68e84', '#89838f', '#5f779d', '#3b6ba9'],
    ['#e6b475', '#b8a884', '#8b9c92', '#6291a3', '#4387b6'],
    ['#e9d073', '#bbc483', '#8fb697', '#68acad', '#4ca0c4'],
    ['#eeec71', '#bedf84', '#93d29d', '#6fc6b6', '#57bbd2']
];

export const shadesOfLavaYellow = [
    ["#f49527", "#f39c32", "#f0a236", "#f0a93d", "#edae45"],
    ["#f5a127", "#f2a82f", "#f3ae37", "#f0b53f", "#eebb46"],
    ["#f2ac26", "#f4b631", "#f1bb35", "#f3c33d", "#f0cb49"],
    ["#f4b826", "#f2bf30", "#f2c838", "#f3d042", "#f2d748"],
    ["#f2c426", "#f3cb2e", "#f2d635", "#f2de3f", "#f3e64a"]
];

export const createBingoBoard = (tableSize = TABLE_SIZE): BingoArrayType => {
    const randomArr = new Array(tableSize * tableSize).fill(0).map((a, i) => a = i + 1).sort(() => Math.random() - 0.5);
    const splittedArray: BingoArrayType = [];

    for (let i = 0; i < tableSize; i++) {
        splittedArray.push([]);
        for (let j = i * tableSize; j < (i + 1) * tableSize; j++) {
            splittedArray[i].push({ value: randomArr[j], row: i, col: j % tableSize, isChecked: false });
        }
    }

    return splittedArray;
};

export const getMovement = (directionType: enumConstants.DirectionTypes): Move => {
    const directions: Record<enumConstants.DirectionTypes, Move> = {
        up(point) {
            point.row -= 1;
        },
        right(point) {
            point.col += 1;
        },
        down(point) {
            point.row += 1;
        },
        left(point) {
            point.col -= 1;
        },
        up_right(point) {
            directions.up(point);
            directions.right(point);
        },
        down_right(point) {
            directions.down(point);
            directions.right(point);
        },
        up_left(point) {
            directions.up(point);
            directions.left(point);
        },
        down_left(point) {
            directions.down(point);
            directions.left(point);
        }
    };

    return directions[directionType];
};

export const isForwardDiagonal = (point: BingoNumberType, tableSize = TABLE_SIZE) => {
    return point.row + point.col === tableSize - 1;
};

export const isBackwardDiagonal = (point: BingoNumberType) => {
    return point.row === point.col;
};

export const isCellInbound = (cell: BingoNumberType, tableSize = TABLE_SIZE) => {
    return (cell.col >= 0 && cell.col < tableSize) && (cell.row >= 0 && cell.row < tableSize);
};

export const getCellDOM = (cell: BingoNumberType) => {
    return document.getElementById(`bingo-cell-${cell.row}-${cell.col}`);
};

export const strikeTheCell = (cell: BingoNumberType) => {
    if (isCellInbound(cell)) {
        const cellDOM = getCellDOM(cell) as HTMLElement;
        const strikeBox = cellDOM?.children?.[1] as HTMLElement;
        strikeBox.style.backgroundColor = shadesOfLavaYellow[cell.row][cell.col];
        cellDOM.style.transform = 'scale(0)';

        setTimeout(() => {
            strikeBox.style.transform = 'scale(1)';
            cellDOM.style.transform = 'scale(1)';
        }, 500);
    }
};

export const selectTheCell = (clickEvent: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const cellDOM = clickEvent.target as HTMLDivElement;
    const x = clickEvent.clientX - cellDOM.offsetLeft;
    const y = clickEvent.clientY - cellDOM.offsetTop;
    const rippleBox = cellDOM.firstChild as HTMLDivElement;
    const rippleStyle = rippleBox.style;
    rippleStyle.top = `${y - 50}px`;
    rippleStyle.left = `${x - 50}px`;
    rippleStyle.transform = 'scale(2.83)';
};

