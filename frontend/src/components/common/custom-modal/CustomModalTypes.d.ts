type CustomModalProps = React.PropsWithChildren<{
    open: boolean;
    handleClose: () => void;
    actionName: string;
    handleAction: () => any;
    isLoading: boolean;
    header: string;
}>;

type CustomModalStyles = Record<
    "modal-container"
    | "header"
    , string
>;

declare module "*/CustomModal.module.css" {
    const content: CustomModalStyles;
    export default content;
}
