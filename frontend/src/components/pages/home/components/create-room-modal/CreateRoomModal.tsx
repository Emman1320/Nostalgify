import { FormControl, InputLabel, MenuItem, Select, Typography } from '@mui/material';
import { } from "@mui/material/colors"
import React, { useState } from 'react';
import { apiService } from '../../../../../utils/axios';
import CustomModal from '../../../../common/custom-modal/CustomModal';
import { constants } from '../../../../../constants/constants';
import { CreateRoomModalProps } from './CreateRoomModalTypes';
import { useAppDispatch, useAppSelector } from '../../../../../store/hook';
import { changeGameStatus, closeModal, selectModalType } from '../../../../../store/ui-slice';
import enumConstants from '../../../../../constants/enum';
import { createRoom, selectPlayerDetails } from '../../../../../store/player-slice';

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ game }) => {
  const [roundTime, setRoundTime] = useState(20);
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const modalType = useAppSelector(selectModalType);
  const playerDetails = useAppSelector(selectPlayerDetails);

  const dispatch = useAppDispatch();

  const handleCreateRoom = async () => {
    try {
      setIsLoading(true);
      const playerId = playerDetails.id;
      const playerName = playerDetails.name;
      const response = await apiService.createRoom({
        playerInfo: {
          id: playerId,
          name: playerName
        },
        maxPlayers: maxPlayers,
        roundTime: roundTime,
        game: game
      });
      const roomId = response.data.roomId;
      dispatch(createRoom({ game: game, roomId: roomId }));
      dispatch(changeGameStatus(enumConstants.GameStatus.WAITING));
      handleClose();
    } catch (error) {
      setError("Couldn't reach the server");
    }
    setIsLoading(false);
  }

  const handleClose = () => {
    dispatch(closeModal());
  }

  return (
    <CustomModal
      open={modalType === enumConstants.ModalTypes.CREATE_ROOM}
      header='Create Room'
      handleClose={handleClose}
      handleAction={handleCreateRoom}
      isLoading={isLoading}
      actionName='Create'
    >
      <FormControl variant="filled" fullWidth sx={{
        "& .MuiFilledInput-underline:after": {
          borderBottomColor: "white"
        },
        "& label.Mui-focused": {
          color: "white"
        },
        "& label.Mui-disabled": {
          color: "#9a9a9a"
        },
        mb: 3
      }}
      >
        <InputLabel id="round-time">Round Time</InputLabel>
        <Select
          label="Round Time"
          labelId='round-time'
          value={roundTime}
          defaultValue={20}
          onChange={(event) => {
            setRoundTime(event.target.value as number)
          }}
          style={{
            fontFamily: '"Kode Mono", sans-serif'
          }}
        >
          {constants.RoundTimings.map((round_timing, index) => <MenuItem key={index} value={round_timing}>{round_timing}</MenuItem>)}
        </Select>
      </FormControl>

      <FormControl variant="filled" fullWidth sx={{
        "& .MuiFilledInput-underline:after": {
          borderBottomColor: "white"
        },
        "& label.Mui-focused": {
          color: "white"
        },
        mb: 3
      }}
      >
        <InputLabel id="max-players">Max Players</InputLabel>
        <Select
          label="Max Players"
          labelId='max-players'
          value={maxPlayers}
          defaultValue={2}
          onChange={(event) => {
            // deleteExistingRoom();
            setMaxPlayers(event.target.value as number);
          }}
          style={{
            fontFamily: '"Kode Mono", sans-serif'
          }}
          sx={{
            "&.MuiDisabled": {
              color: "#9a9a9a"
            }
          }}
        >
          {constants.MaxPlayerCountOptions.map((max_player_count, index) => <MenuItem key={index} value={max_player_count}>{max_player_count}</MenuItem>)}
        </Select>
      </FormControl>
      {/* <Collapse in={!!roomId}>
              <div className='roomId-response'>
              <h3>Room ID: </h3>
              <div className='roomId'>
              <div>{roomId}</div>
              <Tooltip placement='top' title={isContentCopied ? "Copied to clipboard" : "Copy ID"}>
              <div className='content-copy'>
              <ContentCopyIcon onClick={handleContentCopy} />
              </div>
              </Tooltip>
              </div>
              </div>
              </Collapse> */}
      <Typography color="red">{error}</Typography>
    </CustomModal>
  )
}

export default CreateRoomModal