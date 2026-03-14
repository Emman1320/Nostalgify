import { Box, Button, CircularProgress, createTheme, Modal, ThemeProvider } from '@mui/material';
import React from 'react'
import classes from "./CustomModal.module.css";

const theme = createTheme({
    typography: {
        fontFamily: '"Kode Mono", sans-serif',
        allVariants: {
            color: "white"
        }
    },
    components: {
        MuiSelect: {
            styleOverrides: {
                root: {
                    color: "white",
                    "&.MuiDisabled": {
                        "color": "#9a9a9a"
                    }
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    background: "#1e1e2f"
                }
            }
        }

    }
});



const buttonTheme = createTheme({
    palette: {
        primary: {
            main: theme.palette.common.white
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
})

const CustomModal: React.FC<CustomModalProps> = ({ open, handleClose, actionName, handleAction, isLoading, header, children }) => {
    return (
        <div>
            <Modal open={open} onClose={handleClose}>
                <div className={classes['modal-container']}>
                    <h2 className={classes['header']}>{header}</h2>
                    <ThemeProvider theme={theme}>
                        {children}
                    </ThemeProvider>
                    <Box display="flex" justifyContent="flex-end">
                        <ThemeProvider theme={buttonTheme}>
                            <Button variant='contained' onClick={handleAction} >
                                {isLoading ? <CircularProgress size="30px" color='error' /> : actionName}
                            </Button>
                        </ThemeProvider>
                    </Box>
                </div>
            </Modal>
        </div>
    )
}

export default CustomModal;