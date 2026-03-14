import React, { useEffect, useRef, useState } from "react";
import anime from "animejs";
import { Box, Grid2 as Grid } from "@mui/material";
import classes from "./BingoLetter.module.css";

const BingoLetter: React.FC<React.PropsWithChildren<BingoLetterProps>> = ({ children, isStriked, isGameOver, isWinner, letterIndex }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const letterRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef<boolean>(true);
    const [toggleBurst, setToggleBurst] = useState(false);

    const applyLetterStyle = (color: string, opacity = '1') => {
        if (!mountedRef.current) {
            return;
        }

        if (containerRef.current) {
            containerRef.current.style.color = color;
        }
        if (letterRef.current) {
            letterRef.current.style.opacity = opacity;
        }
    };

    useEffect(() => {
        return () => {
            mountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (toggleBurst) {
            // Vibrate the letter for 1 second
            const vibrationAnimation = anime({
                targets: letterRef.current,
                translateX: [
                    { value: 5, duration: 50 },
                    { value: -5, duration: 50 },
                    { value: 0, duration: 50 }
                ],
                translateY: [
                    { value: 5, duration: 50 },
                    { value: -5, duration: 50 },
                    { value: 0, duration: 50 }
                ],
                loop: 7, // Vibrate for 1 second (10 loops * 100ms per loop)
                easing: 'easeInOutSine',
                complete: () => {
                    // Reset the letter's position after vibration
                    if (letterRef.current) {
                        anime.set(letterRef.current, { translateX: 0, translateY: 0 });
                    }
                }
            });
            if (letterRef.current) {
                letterRef.current.style.opacity = '0.2';
            }
            // After vibration, burst into particles
            const particles = Array.from({ length: 50 }).map((_, i) => {
                const div = document.createElement("div");
                div.classList.add("particle");

                // Randomize size
                const size = anime.random(6, 12);
                div.style.width = `${size}px`;
                div.style.height = `${size}px`;

                // Randomize color
                // const colors = ["#FF6B6B", "#FFE66D", "#4ECDC4", "#FF9F1C", "#2EC4B6"];
                // div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                div.style.backgroundColor = "white"
                // Physics parameters
                const angle = Math.random() * Math.PI * 2;
                const initialVelocity = anime.random(200, 400);
                const gravity = 980;
                const startTime = Date.now();

                // Initial velocities
                const velocityX = Math.cos(angle) * initialVelocity;
                const velocityY = Math.sin(angle) * initialVelocity;

                // Store physics parameters
                div.dataset.velocityX = velocityX.toString();
                div.dataset.velocityY = velocityY.toString();
                div.dataset.gravity = gravity.toString();
                div.dataset.startTime = startTime.toString();

                containerRef.current?.appendChild(div);
                return div;
            });

            const particleAnimation = anime({
                targets: ".particle",
                duration: 1600,
                easing: "linear",
                update: function (anim) {
                    const currentTime = Date.now();

                    anim.animatables.forEach((animatable) => {
                        const el = animatable.target as HTMLElement | null;
                        if (!el || !("style" in el)) {
                            return;
                        }
                        const startTime = parseInt(el.dataset.startTime!);
                        const timeElapsed = (currentTime - startTime) / 1000; // In seconds

                        const velocityX = parseFloat(el.dataset.velocityX!);
                        const velocityY = parseFloat(el.dataset.velocityY!);
                        const gravity = parseFloat(el.dataset.gravity!);

                        // Calculate horizontal position (no air resistance)
                        const x = velocityX * timeElapsed;

                        // Calculate vertical position with gravity: y = v0y*t + 0.5*g*t²
                        const y = velocityY * timeElapsed + 0.5 * gravity * Math.pow(timeElapsed, 2);
                        // Calculate scale and opacity
                        const scale = 1 - Math.min(timeElapsed / 1.6, 1);
                        // Apply transformations
                        el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
                    });
                },
                complete: () => {
                    particles.forEach((p) => p.remove());
                    setToggleBurst(false);
                },
            });
            return () => {
                vibrationAnimation.pause();
                particleAnimation.pause();
            };
        }
    }, [toggleBurst]);

    useEffect(() => {
        if (isGameOver || isWinner) {
            const timeoutHandles: ReturnType<typeof setTimeout>[] = [];
            const bingoContainerOffsetLeft = document.getElementById("bingo-container")?.offsetLeft ?? 0;
            const viewportWidth = window.innerWidth - bingoContainerOffsetLeft;
            const viewportHeight = window.innerHeight;

            const position = (50 + (letterIndex - 2) * 7);

            const letterOffsetX =
                letterIndex > 2
                    ? (containerRef.current?.clientWidth ?? 0) * (2.5 / 2) * (letterIndex - 2) / 3
                    : letterIndex ? -2 : 0;

            // Define the target position (e.g., center of the viewport)
            const targetX = viewportWidth * position / 100 + bingoContainerOffsetLeft - (containerRef.current?.clientWidth ?? 0) + letterOffsetX;

            const targetY = viewportHeight / 2 - (containerRef.current?.clientHeight ?? 0);

            const timeline = anime.timeline({
                targets: containerRef.current,
            });

            const positionToBeMoved = {
                x: targetX - (containerRef.current?.offsetLeft ?? 0),
                y: targetY - (containerRef.current?.offsetTop ?? 0)
            }

            timeline.add({
                translateX: positionToBeMoved.x,
                translateY: positionToBeMoved.y,
                delay: 1500 + 150 * letterIndex,
                duration: 1000, // Animation duration in milliseconds
                // easing: 'easeInOutQuad',
                scale: 2.5,
            }).add(isStriked ? {
                scale: [2.5, 3, 2.5],
                duration: 1000,
                begin: () => {
                    applyLetterStyle("#70ff70");
                },
                easing: "easeInOutSine"
            } : {
                begin: () => {
                    applyLetterStyle("#ff2a2a");
                },
                translateX: [
                    { value: positionToBeMoved.x + 10, duration: 50 },
                    { value: positionToBeMoved.x - 10, duration: 50 },
                    { value: positionToBeMoved.x, duration: 50 }
                ],
                translateY: [
                    { value: positionToBeMoved.y + 10, duration: 50 },
                    { value: positionToBeMoved.y - 10, duration: 50 },
                    { value: positionToBeMoved.y, duration: 50 }
                ],
                loop: 7,
                easing: 'easeInOutQuad',
                duration: 1100,
                delay: 700
            });
            if (isGameOver) {
                let rotationAngles = [-90, -61.5, -60, -45, -40];
                anime({
                    targets: letterRef.current,
                    begin: () => {
                        const timeoutHandle = setTimeout(() => {
                            applyLetterStyle("#ff2a2a");
                        }, 3000 + (5 - letterIndex) * 150);
                        timeoutHandles.push(timeoutHandle);
                    },
                    rotate: rotationAngles[letterIndex],
                    easing: 'easeInOutQuint',
                    duration: 3000,
                    translateX: "-=20px",
                    delay: 3000 + (5 - letterIndex) * 150,

                });
            }

            return () => {
                timeline.pause();
                timeoutHandles.forEach((handle) => clearTimeout(handle));
            };
        }
    }, [isGameOver, isWinner]);

    useEffect(() => {
        if (isStriked && !toggleBurst) {
            setToggleBurst(true);
        }
    }, [isStriked]);

    return (
        <Grid
            position='relative'
            width="100%"
            display="flex"
            alignItems="center"
            justifyContent="center"
            ref={containerRef}
            className={classes["bingo-letter-container"]}
        >
            <Box
                ref={letterRef}
                className={classes["bingo-letter"]}
            >
                {children}
            </Box>
            <style>
                {`
                .particle {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background-color: white;
                    border-radius: 50%;
                }
            `}
            </style>
        </Grid>
    );
};

export default BingoLetter;