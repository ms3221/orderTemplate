import { Button, Snackbar } from "@mui/material";
import { Dispatch, SetStateAction, useState } from "react";
import Alert from "../../node_modules/@mui/material/Alert/Alert";
import { Open } from "../types/muiSnakBar";

export const MuiSnackBar = ({
  open,
  setOpen,
}: {
  open: Open;
  setOpen: Dispatch<SetStateAction<Open>>;
}) => {
  //const [open, setOpen] = useState(false);
  const handleClose = (
    event: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen({ result: "", open: false, reason: "" });
  };
  return (
    <>
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={4000}
        open={open.open}
        onClose={handleClose}
        key={"top" + "right"}
      >
        <Alert
          onClose={handleClose}
          severity={open.result === "success" ? "success" : "error"}
          sx={{ width: "100%" }}
        >
          {open.reason} {open.result === "success" ? "success" : "error"}
        </Alert>
      </Snackbar>
    </>
  );
};
