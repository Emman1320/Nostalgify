import React from 'react';
import { DotLottie, DotLottieReact, DotLottieReactProps } from '@lottiefiles/dotlottie-react';

const MeditatingCrownedMan: React.FC<Omit<DotLottieReactProps, 'src'> & { delay?: number }> = (props) => {
    const dotLottieRefCallback = (dotlottie: DotLottie) => {
        if (props.delay) {
            setTimeout(() => {
                dotlottie.play();
            }, props.delay)
        } else {
            dotlottie.play();
        }
    }
    return (
        <DotLottieReact
            src="https://lottie.host/69af1361-3e5a-49be-a49b-aa8d84c66a1b/fMZW53Vh96.lottie"
            dotLottieRefCallback={dotLottieRefCallback}
            {...props}
            loop
        />
    );
};

export default MeditatingCrownedMan;