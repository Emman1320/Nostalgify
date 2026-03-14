import React from 'react';

export type CustomButtonProps = React.PropsWithChildren<{ onClick: () => void, color?: 'primary' | 'error' }>;

export type ConfirmationDialogProps = React.PropsWithChildren<{
    open?: boolean,
    handleClose: () => void,
    handleConfirm: () => void,
    title?: string,
    message?: string,
    confirmLabel?: string
}>;