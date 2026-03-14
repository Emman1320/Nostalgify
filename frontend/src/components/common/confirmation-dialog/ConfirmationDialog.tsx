import { ThemeProvider } from '@emotion/react';
import { Box, Button, createTheme, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Slide, SlideProps } from '@mui/material';
import React from 'react';
import { ConfirmationDialogProps, CustomButtonProps } from './ConfirmationDialogTypes';

const buttonTheme = createTheme({
    palette: {
        primary: {
            main: "#ffffff"
        }
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    fontFamily: '"Kode Mono", sans-serif',
                    borderRadius: "25px",
                    fontWeight: "bold",
                    color: "#1e1e2f"
                }
            }
        }
    }
});

const theme = createTheme({
    typography: {
        fontFamily: '"Kode Mono", sans-serif',
        allVariants: {
            color: "white"
        }
    },
});

const CustomButton: React.FC<CustomButtonProps> = ({ children, onClick, color = 'primary' }) => (
    <ThemeProvider theme={buttonTheme}>
        <Button variant='contained' onClick={onClick} color={color}>{children}</Button>
    </ThemeProvider>
);

const Transition = React.forwardRef(function Transition(props: SlideProps, ref) {
    return <Slide direction="up" ref={ref} {...props} unmountOnExit mountOnEnter />;
});

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
    open = false,
    handleClose,
    handleConfirm,
    title = "Exit room",
    message = "Are you sure you want to exit from the room?",
    confirmLabel = "Exit"
}) => {
    return (
        <Dialog
            open={open}
            onClose={handleClose}
            TransitionComponent={Transition}
            PaperProps={{
                style: { backgroundColor: '#1e1e2f', padding: '8px', color: "white" }
            }}
        >
            <ThemeProvider theme={theme}>

                <DialogTitle>{title}</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ color: "white" }}>
                        {message}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Box display="flex" justifyContent="end" gap={2}>
                        <CustomButton onClick={handleClose}>Cancel</CustomButton>
                        <CustomButton onClick={handleConfirm} color='error'>{confirmLabel}</CustomButton>
                    </Box>
                </DialogActions>
            </ThemeProvider>
        </Dialog>
    )
};

export default ConfirmationDialog;