import React from 'react'
import classes from "./CustomButton.module.css";

const CustomButton: React.FC<CustomButtonProps> = ({ icon, position = 'left', sx = {}, children, onClick, disabled = false }) => {
    return (
        <button disabled={disabled} className={classes['button']} style={sx} onClick={onClick}>
            {position === 'left' && <div className={classes['button-text']}>{children}</div>}
            <div className={classes['button-icon-container']}>
                {icon}
            </div>
            {position === 'right' && <div className={classes['button-text']}>{children}</div>}
        </button>
    )
}

export default CustomButton;