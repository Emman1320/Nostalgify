import { Card, CardContent, CardMedia } from '@mui/material'
import React from 'react'
import {
    Login as LoginIcon,
    Add as AddIcon,
    PlayArrow as PlayArrowIcon
} from '@mui/icons-material';
import classes from "./GameCard.module.css";
import enumConstants from '../../../../../constants/enum';
import { useAppDispatch } from '../../../../../store/hook';
import { triggerModal } from '../../../../../store/ui-slice';

const GameCard: React.FC<GameCardProps> = ({ image, header, description }) => {
    const dispatch = useAppDispatch();
    const openActionModal = (modalType: enumConstants.ModalTypes) => {
        return () => dispatch(triggerModal(modalType));
    }
    return (
        <Card className={classes['card-container']}>
            <CardMedia
                component="img"
                height="140"
                image={image}
                alt="green iguana"
            />
            <CardContent sx={{ background: '#1e1e2f', color: 'white' }}>
                <div className={classes['card-header']}>
                    {header}
                </div>
                <div className={classes['card-description']}>
                    {description}
                </div>
                <div className={classes['card-action']}>
                    <button onClick={openActionModal(enumConstants.ModalTypes.JOIN_ROOM)} className={`${classes['card-button']} ${classes['join-button']}`}>
                        <div className={classes['card-button-text']}>Join</div>
                        <div className={classes['card-icon-container']}>
                            <LoginIcon fontSize='large' />
                        </div>
                    </button>
                    <button onClick={openActionModal(enumConstants.ModalTypes.CREATE_ROOM)} className={`${classes['card-button']} ${classes['create-button']}`}>
                        <div className={classes['card-icon-container']}>
                            <AddIcon fontSize='large' />
                        </div>
                        <div className={classes['card-button-text']}>Create</div>
                    </button>
                    <button onClick={() => { }} className={`${classes['card-button']} ${classes['play-button']}`}>
                        <div className={classes['card-button-text']}>Play</div>
                        <div className={classes['card-icon-container']}>
                            <PlayArrowIcon fontSize='large' />
                        </div>
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}

export default GameCard