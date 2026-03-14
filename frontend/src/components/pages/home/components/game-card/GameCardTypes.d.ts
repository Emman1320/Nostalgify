type GameCardStyles = Record<
    'card-container'
    | 'card-header'
    | 'card-description'
    | 'card-action'
    | 'card-button'
    | 'card-button-text'
    | 'play-button'
    | 'card-icon-container'
    | 'create-button'
    | 'join-button'
    , string
>

declare module "*/GameCard.module.css" {
    const content: GameCardStyles;
    export default content;
}

type GameCardProps = {
    image: string;
    header: string;
    description: string;
};