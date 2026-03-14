import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import bingoImage from '../../../assets/bingo.avif';
import { CircularProgress, Grid2 as Grid, IconButton, Paper, Slide, Tooltip } from '@mui/material';
import classes from "./WaitingRoom.module.css";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { Cancel, ExitToApp, PlayArrow } from '@mui/icons-material';
import CustomButton from '../../common/custom-button/CustomButton';
import ConfirmationDialog from '../../common/confirmation-dialog/ConfirmationDialog';
import SocketManager from '../../../utils/socket-manager';
import { useAppDispatch, useAppSelector } from '../../../store/hook';
import ChatPanel from '../../common/chat-panel/ChatPanel';
import { changeGameStatus, selectGameStatus } from '../../../store/ui-slice';
import enumConstants from '../../../constants/enum';
import { exitRoom } from '../../../store/thunks';
import { useSnackbar } from '../../../hooks/use-snackbar';


const WaitingRoom = () => {
    const [isContentCopied, setIsContentCopied] = React.useState(false);
    const [isTriedToClose, setIsTriedToClose] = React.useState(false);
    const [isRefreshPopup, setIsRefreshPopup] = React.useState(false);
    const playerDetails = useAppSelector(state => state.player);
    const gameStatus = useAppSelector(selectGameStatus);
    const dispatch = useAppDispatch();
    const { triggerSnackbar } = useSnackbar();
    const isInWaitingRoom = gameStatus === enumConstants.GameStatus.WAITING;
    const allowNavigation = React.useRef(false);

    React.useEffect(() => {
        if (!isInWaitingRoom) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (allowNavigation.current) return;
            setIsRefreshPopup(true);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isInWaitingRoom]);

    const handleContentCopy = () => {
        navigator.clipboard.writeText(playerDetails.roomId);
        setIsContentCopied(true);
        setTimeout(() => {
            setIsContentCopied(false);
        }, 1000)
    }

    const handleExitRoomConfirmationClose = () => {
        setIsTriedToClose(false);
    }

    const handleExitRoomConfirm = async () => {
        setIsTriedToClose(false);
        if (playerDetails.id && playerDetails.roomId) {
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
        if (playerDetails.id && playerDetails.roomId) {
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

    const openGameRoom = (notifyRoom = false) => {
        if (notifyRoom) {
            SocketManager.socket.emit(enumConstants.SocketChannels.START_GAME);
        }
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
            <Slide direction="up" in={gameStatus === enumConstants.GameStatus.WAITING} mountOnEnter unmountOnExit>
                <Grid
                    container
                    sx={{
                        height: '100%',
                        width: "100%",
                        overflow: 'auto',
                        position: 'absolute',
                        zIndex: 10,
                        top: 0,
                        backgroundColor: '#1e1e2f',
                        display: 'flex'
                    }}
                >
                    <Grid size={{ xs: 3 }}>
                        <Paper
                            elevation={3}
                            sx={{
                                backgroundColor: '#6060ffdb',
                                height: '100%',
                                minHeight: 0,
                                borderRadius: 0,
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                        >
                            <ChatPanel expanded={true} showExpandToggle={false} />
                        </Paper>
                    </Grid>
                    <Grid container direction={"column"} size={{ xs: 6 }} sx={{ height: "100vh", overflow: 'auto' }}>
                        <Grid p={1} pb={0}>
                            <IconButton title="Exit Room" onClick={() => setIsTriedToClose(true)}>
                                <ExitToApp sx={{ color: "#fff" }} fontSize='large' />
                            </IconButton>
                        </Grid>
                        <Grid p={3}>
                            <div className={classes['player-list']}>
                                <h1 className={classes['player-list-header']}>Players</h1>
                                {!playerDetails.roomPlayers ? <CircularProgress size="30px" /> : playerDetails.roomPlayers.map((player) =>
                                    <div key={player?.id} className={`${classes["player-card-container"]} ${playerDetails.id === player?.id && classes["highlight-player"]}`}>
                                        <div
                                            className={classes['player-card']}>
                                            {player?.name} {playerDetails.id === player?.id && "(You)"}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Grid>
                    </Grid>
                    <Grid size={{ xs: 3 }}>
                        <Paper
                            elevation={3}
                            sx={{
                                backgroundColor: '#6060ff',
                                height: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                                flexDirection: "column",
                            }}>
                            <Box>
                                <img src={bingoImage} alt='' className={classes['waiting-room-game-preview']} />
                                <div className={classes['game-preview-header']}>
                                    Bingo
                                </div>
                                <div className={classes['game-preview-description']}>
                                    A game of chance with 25 numbers and the players with most number of strikes win.
                                </div>
                            </Box>
                            <div className={classes['roomId-response']}>
                                <div className={classes['roomId-header']}>Room ID </div>
                                <div className={classes['roomId']}>
                                    <div>{playerDetails.roomId}</div>
                                    <Tooltip placement='top' title={isContentCopied ? "Copied to clipboard" : "Copy ID"}>
                                        <div className={classes['content-copy']}>
                                            <ContentCopyIcon onClick={handleContentCopy} />
                                        </div>
                                    </Tooltip>
                                </div>
                            </div>
                            <div className={classes['game-action']}>
                                <CustomButton
                                    onClick={openGameRoom.bind(null, true)}
                                    sx={{
                                        backgroundColor: '#7FFFD4',
                                        transform: 'scale(1.2)',
                                        margin: '0 1rem 1rem 0',
                                        ...((playerDetails.roomPlayers?.length ?? 0) < 2 ? { opacity: 0.5, pointerEvents: 'none' } : {})
                                    }}
                                    icon={<PlayArrow fontSize='large' />}
                                >
                                    Play
                                </CustomButton>
                            </div>
                        </Paper>
                    </Grid>
                </Grid>
            </Slide >
        </>
    );
}

WaitingRoom.propTypes = {
    window: PropTypes.func,
    setOpenWaitingRoom: PropTypes.func
};

export default WaitingRoom;
