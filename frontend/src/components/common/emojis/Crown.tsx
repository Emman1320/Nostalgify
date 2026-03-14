import React from 'react';
import { DotLottie, DotLottieReact, DotLottieReactProps } from '@lottiefiles/dotlottie-react';

const Crown: React.FC<Omit<DotLottieReactProps, 'src'> & { delay?: number }> = (props) => {
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
      src="https://lottie.host/f30873c8-b561-4ae1-b823-938ae1be5b24/oYw6nttLXT.lottie"
      // loop
      // autoplay
      dotLottieRefCallback={dotLottieRefCallback}
      {...props}
    />
  );
};

export default Crown;