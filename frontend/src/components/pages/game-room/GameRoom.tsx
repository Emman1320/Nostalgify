import * as React from "react";
import PropTypes from "prop-types";
import Box from "@mui/material/Box";
import {
    Button,
    Divider,
    Grid2 as Grid,
    IconButton,
    Paper
} from "@mui/material";
import classes from "./GameRoom.module.css";
import { Cancel, Replay } from "@mui/icons-material";
import ConfirmationDialog from "../../common/confirmation-dialog/ConfirmationDialog";
import ChatPanel from "../../common/chat-panel/ChatPanel";
import SocketManager from "../../../utils/socket-manager";
import { useAppDispatch, useAppSelector } from "../../../store/hook";
import { exitRoom } from "../../../store/thunks";
import { changeGameStatus, selectGameStatus } from "../../../store/ui-slice";
import { clearRoom } from "../../../store/player-slice";
import enumConstants from "../../../constants/enum";
import { useSnackbar } from "../../../hooks/use-snackbar";
import Bingo from "./components/bingo/Bingo";
import Timer from "./components/timer/Timer";
import Crown from "../../common/emojis/Crown";

const GameRoom = () => {
    const POST_GAME_TRANSITION_MS = 7000;
    const POST_GAME_FADE_DURATION_MS = 600;
    const [isTriedToClose, setIsTriedToClose] = React.useState<boolean>();
    const [isChatExpanded, setIsChatExpanded] = React.useState<boolean>(false);
    const [isPostGameFading, setIsPostGameFading] = React.useState<boolean>(false);
    const [showLeaderboard, setShowLeaderboard] = React.useState<boolean>(false);
    const [winnerInfo, setWinnerInfo] = React.useState<GameOverEvent | null>(null);
    const [playerStrikes, setPlayerStrikes] = React.useState<Record<string, number>>({});
    const [isRefreshPopup, setIsRefreshPopup] = React.useState(false);
    const bingoRef = React.useRef<BingoRefType>(null);
    const allowNavigation = React.useRef(false);
    const dispatch = useAppDispatch();
    const playerDetails = useAppSelector(state => state.player);
    const gameStatus = useAppSelector(selectGameStatus);
    const { triggerSnackbar } = useSnackbar();
    const isPostGame = [enumConstants.GameStatus.WINNER, enumConstants.GameStatus.GAME_OVER].includes(gameStatus);
    const handleExitRoomConfirmationClose = () => {
        setIsTriedToClose(false);
    };
    const handleExitRoomConfirm = async () => {
        setIsTriedToClose(false);
        if (playerDetails.id) {
            try {
                await dispatch(exitRoom()).unwrap();
                dispatch(changeGameStatus(enumConstants.GameStatus.NONE));
            } catch (error: any) {
                triggerSnackbar(error?.message, "error");
            }
        }
    }

    const handleRefreshConfirm = async () => {
        setIsRefreshPopup(false);
        if (playerDetails.id) {
            try {
                await dispatch(exitRoom()).unwrap();
                allowNavigation.current = true;
                window.location.reload();
            } catch (error: any) {
                triggerSnackbar(error?.message, "error");
            }
        }
    }

    const handleRefreshCancel = () => {
        setIsRefreshPopup(false);
    }

    const isYourTurn = playerDetails.turnInfo.id === playerDetails.id;
    const leaderboardPlayers = React.useMemo(() => {
        const players = [...(playerDetails.roomPlayers || [])];
        if (!winnerInfo?.winnerId) {
            return players;
        }

        return players.sort((a, b) => {
            if (a.id === winnerInfo.winnerId) return -1;
            if (b.id === winnerInfo.winnerId) return 1;
            return 0;
        });
    }, [playerDetails.roomPlayers, winnerInfo]);

    const leaderboardScores = React.useMemo(() => {
        return leaderboardPlayers.map((player) => ({
            ...player,
            strikes: playerStrikes[player.id] ?? 0
        }));
    }, [leaderboardPlayers, playerStrikes]);

    const updateTurn = (selectedNumber: number | undefined) => {
        if (gameStatus === enumConstants.GameStatus.STARTED && isYourTurn) {
            SocketManager.socket.emit(enumConstants.SocketChannels.TURN, { playerId: playerDetails.id, selectedNumber: selectedNumber });
        }
    }

    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (allowNavigation.current) return;
            setIsRefreshPopup(true);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    React.useEffect(() => {
        if (
            gameStatus === enumConstants.GameStatus.STARTED
            && playerDetails.roomPlayers
            && playerDetails.roomPlayers.length < 2
        ) {
            // Automatically exit to home with message
            dispatch(clearRoom());
            dispatch(changeGameStatus(enumConstants.GameStatus.NONE));
            triggerSnackbar("All other players have left the room.", "error");
        }
    });

    const handleReplayRound = () => {
        SocketManager.socket.emit(enumConstants.SocketChannels.REPLAY_ROUND);
    };

    React.useEffect(() => {
        const handleWinnerEvent = (winnerEvent: GameOverEvent) => {
            setWinnerInfo(winnerEvent);
        };

        const handleStrikeUpdate = (strikeEvent: StrikeUpdateEvent) => {
            setPlayerStrikes((prev) => ({
                ...prev,
                [strikeEvent.playerId]: strikeEvent.strikes
            }));
        };

        SocketManager.socket.on(enumConstants.SocketChannels.WINNER, handleWinnerEvent);
        SocketManager.socket.on(enumConstants.SocketChannels.STRIKE_UPDATE, handleStrikeUpdate);

        return () => {
            SocketManager.socket.off(enumConstants.SocketChannels.WINNER, handleWinnerEvent);
            SocketManager.socket.off(enumConstants.SocketChannels.STRIKE_UPDATE, handleStrikeUpdate);
        };
    }, []);

    React.useEffect(() => {
        if (![enumConstants.GameStatus.WINNER, enumConstants.GameStatus.GAME_OVER].includes(gameStatus)) {
            setIsPostGameFading(false);
            setShowLeaderboard(false);
            return;
        }

        const fadeDelayTimeout = setTimeout(() => {
            setIsPostGameFading(true);
        }, POST_GAME_TRANSITION_MS - POST_GAME_FADE_DURATION_MS);

        const showLeaderboardTimeout = setTimeout(() => {
            setShowLeaderboard(true);
        }, POST_GAME_TRANSITION_MS);

        return () => {
            clearTimeout(fadeDelayTimeout);
            clearTimeout(showLeaderboardTimeout);
        };
    }, [gameStatus]);

    const sideMenuColor = {
        [enumConstants.GameStatus.GAME_OVER]: "#ff3636",
        [enumConstants.GameStatus.WINNER]: "#60ff81db",
    }
    return (
        <>
            <ConfirmationDialog
                open={isTriedToClose}
                handleClose={handleExitRoomConfirmationClose}
                handleConfirm={handleExitRoomConfirm}
            />
            <ConfirmationDialog
                open={isRefreshPopup}
                handleClose={handleRefreshCancel}
                handleConfirm={handleRefreshConfirm}
                title="Leave game?"
                message="Are you sure you want to leave the game?"
                confirmLabel="Leave"
            />
            <Grid
                container
                sx={{
                    height: "100vh",
                    width: "100vw",
                    overflow: "hidden",
                    backgroundColor: "#1e1e2f",
                    display: "flex",
                    position: "relative",
                }}
            >
                <Grid size={{ xs: 3 }}>
                    <Paper
                        elevation={3}
                        sx={{
                            backgroundColor: sideMenuColor?.[gameStatus as keyof typeof sideMenuColor] ?? "#6060ffdb",
                            transition: "1s background-color ease-in-out",
                            height: "100%",
                            minHeight: 0,
                            display: "flex",
                            justifyContent: "flex-start",
                            borderRadius: 0,
                            flexDirection: "column",
                            position: "relative",
                        }}
                    >
                        {!showLeaderboard && !isChatExpanded && (
                            <div className={classes["left-panel-main"]}>
                                <div className={isPostGameFading ? classes["postgame-fade"] : ""}>
                                    <Box>
                                        <IconButton onClick={() => setIsTriedToClose(true)}>
                                            <Cancel sx={{ color: "#fff" }} fontSize="large" />
                                        </IconButton>
                                    </Box>
                                    <Box
                                        display="flex"
                                        alignItems="baseline"
                                        justifyContent="center"
                                        gap={1}
                                    >
                                        <div className={classes["game-header-prefix"]}>The Game Of</div>
                                        <div className={classes["game-header"]}>Bingo</div>
                                    </Box>
                                </div>
                                <div className={`${classes["player-info-list-container"]} ${isPostGameFading ? classes["postgame-fade"] : ""}`}>
                                    {playerDetails.roomPlayers?.map((player, index) => {
                                        const isWinner = player.id === winnerInfo?.winnerId;

                                        return (
                                            <Paper
                                                className={`${classes["player-info-list-item-container"]} ${isWinner ? classes["player-info-list-item-container-winner"] : ""}`}
                                                key={`player-item-${index}`}
                                                elevation={4}
                                            >
                                                <div className={`${classes["player-info-list-item"]} ${isWinner ? classes["player-info-list-item-winner"] : ""}`}>
                                                    {player.name}
                                                    {isWinner && player.id !== playerDetails.id && (
                                                        <span className={classes["winner-crown"]}>
                                                            <Crown autoplay loop />
                                                        </span>
                                                    )}
                                                </div>
                                                {!isPostGame && playerDetails.turnInfo.id === player?.id ?
                                                    <Timer seconds={playerDetails.turnInfo.roundTime ?? 30} startTime={playerDetails.turnInfo.time} /> : ""
                                                }
                                            </Paper>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                        <ChatPanel
                            expanded={isChatExpanded || showLeaderboard}
                            onExpandToggle={() => setIsChatExpanded(prev => !prev)}
                            showExpandToggle={!showLeaderboard}
                            className={isPostGameFading && !showLeaderboard ? classes["postgame-fade"] : ""}
                        />
                    </Paper>
                </Grid>
                <Grid
                    size={{
                        xs: 9,
                    }}
                    className={isPostGameFading && !showLeaderboard ? classes["postgame-fade"] : ""}
                    sx={{
                        height: "100vh",
                        overflow: "hidden",
                        minHeight: 0,
                        alignItems: showLeaderboard ? "stretch" : "center",
                        justifyContent: showLeaderboard ? "stretch" : "space-evenly",
                        // p: 3,
                    }}
                    id="bingo-container"
                    container
                >
                    {/* <button onClick={updateTurn}>send turn</button> */}
                    {!showLeaderboard && <Bingo bingoRef={bingoRef} updateTurn={updateTurn} />}
                    {showLeaderboard && (
                        <div className={classes["leaderboard-panel-right"]}>
                            <div className={`${classes["leaderboard-panel"]} ${classes["leaderboard-enter"]}`}>
                                <div className={classes["leaderboard-title"]}>Leaderboard</div>
                                <Divider sx={{ borderColor: "rgba(255,255,255,0.35)" }} />
                                <div className={classes["leaderboard-list"]}>
                                    {leaderboardScores.map((player, index) => (
                                        <div
                                            key={player.id}
                                            className={`${classes["leaderboard-item"]} ${player.id === winnerInfo?.winnerId ? classes["leaderboard-item-winner"] : ""}`}
                                        >
                                            <div className={classes["leaderboard-rank"]}>#{index + 1}</div>
                                            <div className={`${classes["leaderboard-name"]} ${player.id === winnerInfo?.winnerId ? classes["leaderboard-name-winner"] : ""}`}>
                                                {player.name}
                                                {player.id === playerDetails.id ? " (You)" : ""}
                                                {player.id === winnerInfo?.winnerId && (
                                                    <span className={classes["leaderboard-winner-crown"]}>
                                                        <Crown autoplay loop />
                                                    </span>
                                                )}
                                            </div>
                                            <div className={classes["leaderboard-score"]}>Strikes: {player.strikes}</div>
                                            <div className={classes["leaderboard-badge"]}>
                                                {player.id === winnerInfo?.winnerId ? "Winner" : "Finished"}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={classes["leaderboard-actions"]}>
                                    <Button
                                        variant="contained"
                                        startIcon={<Replay />}
                                        onClick={handleReplayRound}
                                        className={classes["replay-button"]}
                                    >
                                        REPLAY
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Grid>
            </Grid >
        </>
    );
}

GameRoom.propTypes = {
    window: PropTypes.func,
    setOpenWaitingRoom: PropTypes.func,
};

export default GameRoom;
