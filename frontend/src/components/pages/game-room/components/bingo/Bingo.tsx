import React, { useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
/* eslint-disable react-hooks/exhaustive-deps */
import enumConstants from '../../../../../constants/enum';
import { useAppDispatch, useAppSelector } from '../../../../../store/hook';
import classes from "./Bingo.module.css";
import { Grid2 as Grid } from '@mui/material';
import BingoLetter from '../bingo-letter/BingoLetter';
import anime from 'animejs';
import { constants } from '../../../../../constants/constants';
import Crown from '../../../../common/emojis/Crown';
import MeditatingCrownedMan from '../../../../common/emojis/MeditatingCrownedMan';
import FailureStampImage from "../../../../../assets/failure_stamp.png";
import { changeGameStatus, selectGameStatus } from '../../../../../store/ui-slice';
import SocketManager from '../../../../../utils/socket-manager';
import {
    bingoColors,
    createBingoBoard,
    getCellDOM,
    getMovement,
    isBackwardDiagonal,
    isCellInbound,
    isForwardDiagonal,
    selectTheCell,
    strikeTheCell
} from './bingo.utils';
type OrientationArrayType = Record<enumConstants.OrientationTypes, [enumConstants.DirectionTypes, enumConstants.DirectionTypes]>

const Bingo: React.FC<BingoProps> = ({ updateTurn, bingoRef }) => {
    const POST_GAME_TRANSITION_MS = 7000;
    const POST_GAME_FADE_DURATION_MS = 600;
    const playerDetails = useAppSelector(state => state.player);
    const dispatch = useAppDispatch();
    const isYourTurn = playerDetails.turnInfo.id === playerDetails.id;
    // const isYourTurn = true;

    /**
     * This is the random bingo board for the player
     */
    const initialBingoBoard = useMemo(() => createBingoBoard(), []);
    const bingoArrayRef = useRef<BingoArrayType>(initialBingoBoard);

    const [selectedNumbers, setSelectedNumbers] = useState<Array<number>>([]);
    const [strikes, setStrikes] = useState<number>(0);
    const [isPostGameAssetFading, setIsPostGameAssetFading] = useState<boolean>(false);
    const gameStatus = useAppSelector(selectGameStatus);

    const moveThroughCheckedPath = (
        point: BingoNumberType,
        move: Move
    ): boolean => {
        move(point);
        if (!isCellInbound(point)) {
            return true;
        }

        const newPoint = { ...bingoArrayRef.current[point.row][point.col] };
        if (newPoint.isChecked) {
            return moveThroughCheckedPath(newPoint, move);
        }
        return false;
    };

    const strikeThePath = async (point: BingoNumberType, move: Move, shouldStrikeFirstCell = true): Promise<void> => {
        if (shouldStrikeFirstCell) {
            strikeTheCell(point);
        }
        move(point);
        if (!isCellInbound(point)) {
            return;
        }

        const newPoint = { ...bingoArrayRef.current[point.row][point.col] };
        if (newPoint.isChecked) {
            await new Promise<void>((resolve) => {
                setTimeout(() => resolve(), 100);
            });
            return strikeThePath(newPoint, move);
        }
    };

    /**
     * This function handles the selected number by the player
     * @param {BingoNumberType} selectedNumber 
     */
    const onSelectNumber = (selectedNumber: BingoNumberType, event: React.MouseEvent<HTMLDivElement, MouseEvent> | null, shouldUpdateTurn = true) => {
        if ((shouldUpdateTurn && !isYourTurn) || selectedNumbers.includes(selectedNumber.value)) {
            return;
        }

        // First see where it landed
        // if on the crucial diag points check diag too along row and column
        // if on other part of board check only row and column

        selectedNumber.isChecked = true;
        // colorTheCell(selectedNumber, 'white')
        if (event) {
            selectTheCell(event);
        }
        /**
         * These are the direction pairs that could strike a bingo
         * Default orientations are vertical and horizontal
         */
        const orientationTypes: OrientationArrayType = {
            vertical: [enumConstants.DirectionTypes.UP, enumConstants.DirectionTypes.DOWN],
            horizontal: [enumConstants.DirectionTypes.LEFT, enumConstants.DirectionTypes.RIGHT],
            forward_diagonal: [enumConstants.DirectionTypes.DOWN_LEFT, enumConstants.DirectionTypes.UP_RIGHT],
            backward_diagonal: [enumConstants.DirectionTypes.UP_LEFT, enumConstants.DirectionTypes.DOWN_RIGHT]
        };

        /**
         * This array must contain the orientations to be analyzed for a strike
         */
        const orientationsToBeChecked = [enumConstants.OrientationTypes.HORIZONTAL, enumConstants.OrientationTypes.VERTICAL];

        // Seeing where it landed
        if (isForwardDiagonal(selectedNumber)) {
            // This means the selected point is among the forward slanted diagonal /
            orientationsToBeChecked.push(enumConstants.OrientationTypes.FORWARD_DIAGONAL);
        }
        if (isBackwardDiagonal(selectedNumber)) {
            // This means the selected point is among the backward slanted diagonal \
            orientationsToBeChecked.push(enumConstants.OrientationTypes.BACKWARD_DIAGONAL);
        }

        /**
         * An object to store the strikes in the currect selection
         */
        // const strikesOnSelect = strikes;

        orientationsToBeChecked.forEach((orientation) => {
            const isStrike = orientationTypes[orientation].every((direction) => {
                // Taking copy to avoid any referenced manipulation
                const startingPoint = { ...selectedNumber };

                // Getting the movement function to the specified direction
                const move = getMovement(direction);

                // Returns whether the end is reached
                return moveThroughCheckedPath(startingPoint, move);
            });

            if (isStrike) {
                orientationTypes[orientation].forEach((direction, index) => {
                    const startingPoint = { ...selectedNumber };
                    const move = getMovement(direction);
                    strikeThePath(startingPoint, move, !!index);
                });

                setTimeout(() => {
                    setStrikes(strikes => strikes + 1);
                }, 1000);
            }
        });


        setSelectedNumbers(prev => {
            if (!prev?.includes(selectedNumber.value)) {
                return [...prev, selectedNumber.value];
            }
            return prev;
        })

        if (shouldUpdateTurn) {
            updateTurn(selectedNumber.value);
        }
    };

    useEffect(() => {
        if (strikes <= 0) {
            return;
        }

        SocketManager.socket.emit(enumConstants.SocketChannels.STRIKE_UPDATE, {
            playerId: playerDetails.id,
            strikes
        } satisfies StrikeUpdateEvent);

        if (
            strikes >= constants.NumberOfStrikesToWinBingo
            && gameStatus !== enumConstants.GameStatus.WINNER
            && gameStatus !== enumConstants.GameStatus.GAME_OVER
        ) {
            dispatch(changeGameStatus(enumConstants.GameStatus.WINNER));
            SocketManager.socket.emit(enumConstants.SocketChannels.WINNER, {
                winnerId: playerDetails.id,
                winnerName: playerDetails.name
            });
        }
    }, [gameStatus, playerDetails.id, playerDetails.name, strikes]);

    const createNormalRippleAndSelect = (selectedCell: BingoNumberType) => {
        const rippleBox = getCellDOM(selectedCell)?.firstChild as HTMLElement;
        rippleBox.style.transform = 'scale(2.83)';
        onSelectNumber(selectedCell, null, false);
    };

    useEffect(() => {
        const selectedNumber = playerDetails.turnInfo.selectedNumber;
        if (selectedNumber === undefined) {
            return;
        }

        let selectedCell = null;

        for (let i = 0; i < bingoArrayRef.current.length; i++) {
            for (let j = 0; j < bingoArrayRef.current[i].length; j++) {
                const bingoCell = bingoArrayRef.current[i][j];
                if (bingoCell.value === selectedNumber) {
                    selectedCell = bingoCell;
                }
            }
        }
        if (selectedCell) {
            createNormalRippleAndSelect(selectedCell);
        }
    }, [playerDetails.turnInfo.selectedNumber]);

    useImperativeHandle(bingoRef, () => {
        return {
            selectRandomNumber() {
                const unselectedNumber: BingoNumberType[] = [];
                console.log(selectedNumbers.length);

                bingoArrayRef.current.forEach((row) => {
                    row.forEach(num => {
                        if (!selectedNumbers.includes(num.value)) {
                            unselectedNumber.push(num);
                        }
                    });
                });
                const randomCell = unselectedNumber[Math.floor(Math.random() * unselectedNumber.length)];
                createNormalRippleAndSelect(randomCell);
                return randomCell?.value;
            }
        }
    });

    const isWinner = strikes >= constants.NumberOfStrikesToWinBingo;

    useEffect(() => {
        if (gameStatus === enumConstants.GameStatus.WINNER || gameStatus === enumConstants.GameStatus.GAME_OVER) {
            anime({
                targets: `.${classes["bingo-num"]}`,
                scale: 0,
                duration: 300,
                delay: anime.stagger(200, { grid: [5, 5], from: 'first', start: 400 }),
                easing: 'easeInOutQuad'
            })
        }
    }, [gameStatus]);

    useEffect(() => {
        if (gameStatus !== enumConstants.GameStatus.WINNER && gameStatus !== enumConstants.GameStatus.GAME_OVER) {
            setIsPostGameAssetFading(false);
            return;
        }

        const fadeTimeout = setTimeout(() => {
            setIsPostGameAssetFading(true);
        }, POST_GAME_TRANSITION_MS - POST_GAME_FADE_DURATION_MS);

        return () => {
            clearTimeout(fadeTimeout);
        };
    }, [gameStatus]);

    return (
        <>
            <Grid>
                <div className={`${classes['bingo-container']} ${isPostGameAssetFading ? classes['postgame-asset-fade'] : ''}`}>{
                    bingoArrayRef.current.map((row, r_index) => <div className={classes['bingo-row']} key={`bingo-row-${r_index}`}>
                        {row.map((num, c_index) =>
                            <div
                                className={classes['bingo-num']}
                                style={{ backgroundColor: bingoColors[r_index][c_index] }}
                                key={`bingo-num-${r_index}-${c_index}`}
                                id={`bingo-cell-${r_index}-${c_index}`}
                                onClick={onSelectNumber.bind(null, num)}
                            >
                                <div className={classes['touch-ripple']}></div>
                                <div className={classes['strike-box']}></div>
                                {num.value}
                            </div>
                        )}
                    </div>)
                }</div>
            </Grid>
            <Grid container direction="column" fontSize={50} alignItems="center" color="white" className={isPostGameAssetFading ? classes['postgame-asset-fade'] : ''}>
                {["B", "I", "N", "G", "O"].map((letter, i) =>
                    <BingoLetter
                        key={letter}
                        letterIndex={i}
                        isStriked={strikes > i}
                        isGameOver={gameStatus === enumConstants.GameStatus.GAME_OVER}
                        isWinner={isWinner}
                    >
                        {letter}
                    </BingoLetter>
                )}
            </Grid>

            {isWinner && <>
                <MeditatingCrownedMan delay={3000} className={`${classes['meditating-crowned-man']} ${isPostGameAssetFading ? classes['postgame-asset-fade'] : ''}`} />
                <Crown delay={3000} className={`${classes.crown} ${isPostGameAssetFading ? classes['postgame-asset-fade'] : ''}`} />
                <img src={"winnerstamp.svg"} alt='' className={`${classes["stamp"]} ${classes["success"]} ${isPostGameAssetFading ? classes['postgame-asset-fade'] : ''}`} />
            </>}
            {
                gameStatus === enumConstants.GameStatus.GAME_OVER && <>
                    <img src={FailureStampImage} alt='' className={`${classes["stamp"]} ${classes["failure"]} ${isPostGameAssetFading ? classes['postgame-asset-fade'] : ''}`} />
                </>
            }

        </>
    )
}

export default Bingo