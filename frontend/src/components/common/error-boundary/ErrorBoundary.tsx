import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Paper, Typography, Button, Box } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        backgroundColor: '#1e1e2f',
                        padding: 3
                    }}
                >
                    <Paper
                        elevation={3}
                        sx={{
                            padding: 4,
                            maxWidth: 600,
                            textAlign: 'center',
                            backgroundColor: '#2a2a3f'
                        }}
                    >
                        <ErrorOutline
                            sx={{
                                fontSize: 80,
                                color: '#ff3636',
                                marginBottom: 2
                            }}
                        />
                        <Typography variant="h4" gutterBottom sx={{ color: 'white' }}>
                            Oops! Something went wrong
                        </Typography>
                        <Typography variant="body1" sx={{ color: '#b0b0b0', marginBottom: 3 }}>
                            We're sorry, but something unexpected happened. Please try refreshing the page or return to the home screen.
                        </Typography>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <Box
                                sx={{
                                    textAlign: 'left',
                                    backgroundColor: '#1a1a2e',
                                    padding: 2,
                                    borderRadius: 1,
                                    marginBottom: 2,
                                    maxHeight: 200,
                                    overflow: 'auto'
                                }}
                            >
                                <Typography
                                    variant="caption"
                                    component="pre"
                                    sx={{ color: '#ff6b6b', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                                >
                                    {this.state.error.toString()}
                                    {this.state.errorInfo && `\n${this.state.errorInfo.componentStack}`}
                                </Typography>
                            </Box>
                        )}
                        <Button
                            variant="contained"
                            onClick={this.handleReset}
                            sx={{
                                backgroundColor: '#6060ffdb',
                                '&:hover': {
                                    backgroundColor: '#5050eecc'
                                }
                            }}
                        >
                            Return to Home
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
