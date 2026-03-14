import React, { useRef, useState } from "react";
import wings from "../../../assets/wing.svg";
import bingoImage from "../../../assets/bingo.avif";
import classes from "./Home.module.css";
import { createTheme, ThemeProvider, Tooltip } from "@mui/material";
import { constants } from "../../../constants/constants";
import GameCard from "./components/game-card/GameCard";
import { useAppDispatch, useAppSelector } from "../../../store/hook";
import { selectPlayerName, setPlayerName } from "../../../store/player-slice";
import { selectModalType } from "../../../store/ui-slice";
import CreateRoomModal from "./components/create-room-modal/CreateRoomModal";
import JoinRoomModal from "./components/join-room-modal/JoinRoomModal";
import enumConstants from "../../../constants/enum";
const theme = createTheme({
  typography: {
    fontFamily: '"Kode Mono", sans-serif',
    allVariants: {
      color: "white",
    },
  },
});

const CustomTooltip = ({ title, placement, children }: {
  title: string;
  placement: any;
  children: React.ReactElement<unknown, any>;
}) => {
  return (
    <ThemeProvider theme={theme}>
      <Tooltip title={title} placement={placement}>
        {children}
      </Tooltip>
    </ThemeProvider>
  );
};

const PlayerNameInputField = () => {
  const [isPlayerNameFocused, setIsPlayerNameFocused] = useState(false);
  const playerNameLeftRef = useRef<HTMLDivElement>(null);
  const playerNameRightRef = useRef<HTMLDivElement>(null);
  const playerName = useAppSelector(selectPlayerName);
  const dispatch = useAppDispatch();

  const playerNameFocusHandler = () => {
    setIsPlayerNameFocused(true);
    if (
      playerNameRightRef?.current?.innerText &&
      playerNameLeftRef?.current?.innerText !== undefined
    ) {
      const playerName = playerNameLeftRef.current.innerText + playerNameRightRef.current.innerText;
      playerNameLeftRef.current.innerText = playerName;
      playerNameRightRef.current.innerText = "";
    }
  };

  const playerNameBlurHandler = () => {
    setIsPlayerNameFocused(false);
    if (
      playerNameRightRef?.current?.innerText !== undefined &&
      playerNameLeftRef?.current?.innerText !== undefined
    ) {
      let enteredPlayerName = playerNameLeftRef.current.innerText + playerNameRightRef.current.innerText;
      enteredPlayerName = enteredPlayerName.slice(0, constants.MaxPlayerNameCharacterLength);
      if (enteredPlayerName?.trim() === "") {
        playerNameLeftRef.current.innerText = playerName;
      } else {
        dispatch(setPlayerName(enteredPlayerName));
        localStorage.setItem("playerName", enteredPlayerName);
      }
    }
  };

  const popLastWord = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current === null) {
      return "";
    }
    const lastWord = ref.current.innerText.slice(-1);
    ref.current.innerText = ref.current.innerText.slice(0, -1);
    return lastWord;
  };

  const popFirstWord = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current === null) {
      return "";
    }
    const firstWord = ref.current.innerText.slice(0, 1);
    ref.current.innerText = ref.current.innerText.slice(1);
    return firstWord;
  };

  const pushWord = (ref: React.RefObject<HTMLDivElement | null>, word: string) => {
    if (ref.current === null) {
      return "";
    }
    ref.current.innerText = word + ref.current.innerText;
  };

  const appendWord = (ref: React.RefObject<HTMLDivElement | null>, word: string) => {
    if (ref.current === null) {
      return "";
    }
    ref.current.innerText += word;
  };

  const playerNameInputHandler = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (
      playerNameRightRef?.current === null ||
      playerNameLeftRef?.current === null
    ) {
      return;
    }
    const letterInput = event.key;
    if (constants.playerNameAllowedCharactersPattern.test(letterInput)) {
      const currentEnteredText = playerNameLeftRef?.current?.innerText + playerNameRightRef?.current?.innerText;
      if (currentEnteredText?.length < constants.MaxPlayerNameCharacterLength) {
        appendWord(playerNameLeftRef, letterInput);
      }
    } else if (letterInput === "Backspace") {
      popLastWord(playerNameLeftRef);
    } else if (letterInput === "ArrowLeft") {
      const letterToBeMoved = popLastWord(playerNameLeftRef);
      pushWord(playerNameRightRef, letterToBeMoved);
    } else if (letterInput === "ArrowRight") {
      const letterToBeMoved = popFirstWord(playerNameRightRef);
      appendWord(playerNameLeftRef, letterToBeMoved);
    }
  };

  return <CustomTooltip
    placement="right"
    title={
      isPlayerNameFocused
        ? `Enter player name (max ${constants.MaxPlayerNameCharacterLength} characters)`
        : "Click to edit"
    }
  >
    <div className={classes["home-player-tag"]}>
      <div
        className={classes["player-name-container"]}
        onFocus={playerNameFocusHandler}
        onBlur={playerNameBlurHandler}
        tabIndex={0}
        onKeyDown={playerNameInputHandler}
      >
        <div ref={playerNameLeftRef}>
          {playerName}
        </div>
        <div className={classes["caret-container"]}>
          <div className={classes["caret"]}></div>
        </div>
        <div ref={playerNameRightRef}></div>
      </div>
      <div className={classes["player-tag-border"]}></div>

    </div>
  </CustomTooltip>
}

const Home = () => {
  return (
    <>
      <CreateRoomModal game={enumConstants.GameTypes.BINGO} />
      <JoinRoomModal game={enumConstants.GameTypes.BINGO} />
      <div className={classes["home-container"]}>
        <div className={classes["header-container"]}>
          <div className={classes["header"]}>NOSTALGIFY</div>
          <div className={classes["graphiti-container"]}>
            <div>
              <div className={classes["graphiti-top"]}></div>
              <div className={classes["graphiti-down"]}></div>
            </div>
            <div className={classes["wings-container"]}>
              <img src={wings} alt="" />
              <div className={classes["wings"]}>
                <img src={wings} alt="" />
              </div>
            </div>
            <div className={classes["graphiti-right-container"]}>
              <div className={classes["graphiti-top"]}></div>
              <div className={classes["graphiti-down"]}></div>
            </div>
          </div>
        </div>
        <div className={classes["home-player-tag-container"]}>
          Welcome
          <PlayerNameInputField />
        </div>
        <div>
          <GameCard
            image={bingoImage}
            header="Bingo"
            description="A game of chance with 25 numbers and the players with most number of strikes win."
          />
        </div>
      </div>
    </>
  );
};

export default Home;
