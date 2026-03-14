import React from 'react'

const HeartBreak: React.FC<React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>> = (props) => {
    return (
        <picture>
            <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f494/512.webp" type="image/webp" />
            <img
                src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f494/512.gif"
                alt="💔"
                {...props}
            />
        </picture>
    )
}

export default HeartBreak