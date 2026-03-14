type CustomButtonStyles = Record<
    "button"
    | "button-icon-container"
    | "button-text"
    , string
>;

type CustomButtonProps = React.PropsWithChildren<{
    position?: "left" | "right";
    icon: React.ReactNode;
    onClick: () => void;
    sx?: React.CSSProperties;
    disabled?: boolean;
}>

declare module "*/CustomButton.module.css" {
    const content: CustomButtonStyles;
    export default content;
}