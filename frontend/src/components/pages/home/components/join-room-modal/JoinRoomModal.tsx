import { TextField, Typography } from '@mui/material';
import { } from "@mui/material/colors"
import React, { useState } from 'react';
import { apiService } from '../../../../../utils/axios';
import CustomModal from '../../../../common/custom-modal/CustomModal';
import { JoinRoomModalTypes } from './JoinRoomTypes';
import enumConstants from '../../../../../constants/enum';
import { useAppDispatch, useAppSelector } from '../../../../../store/hook';
import { changeGameStatus, closeModal, selectModalType } from '../../../../../store/ui-slice';
import { createRoom, selectPlayerDetails } from '../../../../../store/player-slice';
import { AxiosError } from 'axios';

const JoinRoomModal: React.FC<JoinRoomModalTypes> = ({ game }) => {
    const [enteredRoomId, setEnteredRoomId] = useState('');
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const modalType = useAppSelector(selectModalType);
    const playerDetails = useAppSelector(selectPlayerDetails);
    const dispatch = useAppDispatch();

    const handleJoinRoom = async () => {
        setIsLoading(true);
        if (!enteredRoomId.trim().length) {
            return setError("Enter Room ID");
        }
        try {
            const playerId = playerDetails.id;
            const playerName = playerDetails.name;
            await apiService.joinRoom({ playerInfo: { id: playerId, name: playerName }, roomId: enteredRoomId });
            dispatch(createRoom({ game: game, roomId: enteredRoomId }));
            dispatch(changeGameStatus(enumConstants.GameStatus.WAITING));
            handleClose();
        } catch (error: any) {
            setError((error as AxiosError<Record<'message', string>>)?.response?.data?.message ?? error?.message);
        } finally {
            setIsLoading(false);
        }
    }

    const handleClose = () => {
        dispatch(closeModal());
    }

    return (
        <CustomModal
            open={modalType === enumConstants.ModalTypes.JOIN_ROOM}
            handleClose={handleClose}
            header='Join Room'
            handleAction={handleJoinRoom}
            isLoading={isLoading}
            actionName='Join'
        >
            <TextField
                label="Room ID"
                placeholder='Enter your Room ID'
                value={enteredRoomId}
                onChange={(event) => {
                    setEnteredRoomId(event.target.value)
                }}
                slotProps={{
                    inputLabel: {
                        shrink: true
                    }
                }}
                variant='filled'
                fullWidth
                sx={{
                    "& .MuiFilledInput-underline:after": {
                        borderBottomColor: "white"
                    },
                    "& label.Mui-focused": {
                        color: "white"
                    },
                    "& label.Mui-disabled": {
                        color: "#9a9a9a"
                    },
                    '& .MuiInputBase-root': {
                        color: 'white',
                    },
                    mb: 3,
                }}
            />
            <Typography color="red">{error}</Typography>
        </CustomModal>
    )
}

export default JoinRoomModal