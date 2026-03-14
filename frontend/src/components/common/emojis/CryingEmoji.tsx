import React from 'react';
import { DotLottie, DotLottieReact, DotLottieReactProps } from '@lottiefiles/dotlottie-react';

const CryingEmoji: React.FC<Omit<DotLottieReactProps, 'src'> & { delay?: number }> = (props) => {
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
      src="https://lottie.host/cbf7d885-8761-4058-9881-c71cbc83c4f6/5vi15D1n9m.lottie"
      dotLottieRefCallback={dotLottieRefCallback}
      {...props}
      loop
      autoplay
    />
  );
};

export default CryingEmoji;