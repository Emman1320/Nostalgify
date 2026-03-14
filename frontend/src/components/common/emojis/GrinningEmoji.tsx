import React from 'react'

const GrinningEmoji = () => {
    return (
        <picture>
            <source srcSet="https://fonts.gstatic.com/s/e/notoemoji/latest/1f601/512.webp" type="image/webp" />
            <img src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f601/512.gif" alt="😁" width="32" height="32" />
        </picture>
    )
}

export default GrinningEmoji