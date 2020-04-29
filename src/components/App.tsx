// vendor imports
import axios from "axios";
import { Heading, Grommet, Button } from "grommet";
import React from "react";

// local imports
import useInterval from "../hooks/useInterval";
import { customTheme } from "../config/theme";
import { IStatusData } from "../types/api";

function App() {
  // State vars
  const [isBusy, setBusy] = React.useState<boolean>(true);
  const [status, setStatus] = React.useState<IStatusData | null>(null);
  const [apiError, setApiError] = React.useState<boolean>(false);

  const pollStatus = React.useCallback(async () => {
    try {
      const response = await axios.get("/api/status");
      setStatus(response.data);
      setApiError(false);
    } catch {
      setApiError(true);
    }
  }, []);

  const pollStatusSynchronous = React.useCallback(() => {
    pollStatus();
  }, [pollStatus]);

  // On first mount, load status and remove busy marker
  React.useEffect(() => {
    (async () => {
      await pollStatus();
      setBusy(false);
    })();
  }, [pollStatus]);

  // Poll the status on an interval
  useInterval(pollStatusSynchronous, 5000);

  const onClickLoad = React.useCallback(async () => {
    setBusy(true);
    await axios.put("/api/load");
    await pollStatus();
    setBusy(false);
  }, [pollStatus]);

  const onClickEject = React.useCallback(async () => {
    setBusy(true);
    await axios.put("/api/eject");
    await pollStatus();
    setBusy(false);
  }, [pollStatus]);

  const onClickMount = React.useCallback(async () => {
    setBusy(true);
    await axios.put("/api/mount");
    await pollStatus();
    setBusy(false);
  }, [pollStatus]);

  const onClickUnmount = React.useCallback(async () => {
    setBusy(true);
    await axios.put("/api/unmount");
    await pollStatus();
    setBusy(false);
  }, [pollStatus]);

  return (
    <Grommet theme={customTheme}>
      {apiError ? (
        <Heading>API Error. Check docker container log.</Heading>
      ) : status === null ? (
        <Heading>Loading...</Heading>
      ) : (
        <>
          {status.device === null ? (
            <Heading>
              No device detected. Make sure the tape drive is on and try
              restarting this docker container.
            </Heading>
          ) : (
            <>
              <Heading>
                {status.device.manufacturer} {status.device.model} at{" "}
                {status.device.device}
                {isBusy
                  ? " is busy"
                  : status.mount
                  ? ` is mounted at ${status.mount.location} with volume serial ${status.mount.serial}`
                  : ""}
              </Heading>
              <br />
              {status.mount === null ? (
                <>
                  <Button
                    margin="small"
                    label="Load"
                    disabled={isBusy || status.tape}
                    onClick={onClickLoad}
                  />
                  <Button
                    margin="small"
                    label="Eject"
                    disabled={isBusy || !status.tape}
                    onClick={onClickEject}
                  />
                  <Button
                    margin="small"
                    label="Mount"
                    disabled={isBusy || !status.tape}
                    onClick={onClickMount}
                  />
                </>
              ) : (
                <>
                  <Button
                    margin="small"
                    label="Unmount"
                    disabled={isBusy}
                    onClick={onClickUnmount}
                  />
                </>
              )}
            </>
          )}
        </>
      )}
    </Grommet>
  );
}

export default App;
