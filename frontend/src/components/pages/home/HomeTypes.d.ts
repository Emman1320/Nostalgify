type HomeStyles = Record<
    'header'
    | 'header-container'
    | 'home-container'
    | 'home-player-tag-container'
    | 'home-player-tag'
    | 'player-tag-border'
    | 'graphiti-container'
    | 'design-element'
    | 'graphiti-right-container'
    | 'player-name-container'
    | 'caret-container'
    | 'caret'
    | 'graphiti-top'
    | 'graphiti-down'
    | 'wings-container'
    | 'wings'
    | 'game-room-action'
    | 'caretAppear'
    , string>;

declare module "*/Home.module.css" {
    const content: HomeStyles;
    export default content;
}
    