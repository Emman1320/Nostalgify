import { useDispatch } from "react-redux";
import { showSnackbar } from "../store/ui-slice";

export const useSnackbar = () => {
  const dispatch = useDispatch();

  const triggerSnackbar = (message: string, type: SnackbarType = "info") => {
    dispatch(showSnackbar({ message, type }));
  };

  return { triggerSnackbar };
};
