import React, {
	useState,
	useEffect,
	useContext,
	useImperativeHandle,
	useRef,
  } from "react";
  import axios from "axios";
  import Heartbeat from "react-heartbeat";
  
  import ProgressBar from "./ProgressBar";
  import NowPlaying from "./NowPlaying";
  import ConnectDevices from "./ConnectDevices";
  import ControlButton from "./ControlButton";
  
  import reqWithToken from "../../utilities/reqWithToken";
  import msTimeFormat from "../../utilities/utils";
  import putWithToken from "../../utilities/putWithToken";
  import { MessageContext } from "../../utilities/context";
  
  const Player = React.forwardRef(({ token }, ref) => {
	const setMessage = useContext(MessageContext);
	const [playbackState, setPlaybackState] = useState({
	  play: false,
	  shuffle: false,
	  repeat: false,
	  progress: 0,
	  total_time: 0,
	});
  
	const [scrubPb, setScrubPb] = useState(null);
	const [playback, setPlayback] = useState(0);
	const [volume, setVolume] = useState(1);
	const [connectTip, setConnectTip] = useState(false);
	const [playInfo, setPlayInfo] = useState({
	  album: {},
	  artists: [],
	  name: "",
	  id: "",
	});
  
	const timerRef = useRef(null);
	let player = useRef(null);
	const source = axios.CancelToken.source();
  
	useEffect(() => {
	  loadScript();
	  apiUpdate();
  
	  window.onSpotifyWebPlaybackSDKReady = () => playerInit();
  
	  return () => {
		source.cancel();
		clearTimeout(timerRef.current);
		player.disconnect();
	  };
	  // eslint-disable-next-line
	}, []);
  
	const loadScript = () => {
	  const script = document.createElement("script");
	  script.id = "spotify-player";
	  script.type = "text/javascript";
	  script.async = "async";
	  script.defer = "defer";
	  script.src = "https://sdk.scdn.co/spotify-player.js";
	  document.body.appendChild(script);
	};
  
	const playerInit = () => {
	  player = new window.Spotify.Player({
		name: "Harmonia",
		getOAuthToken: (cb) => cb(token),
	  });
  
	  // Error handlers
	  player.addListener("initialization_error", ({ message }) => setMessage(message));
	  player.addListener("authentication_error", ({ message }) => setMessage(message));
	  player.addListener("account_error", ({ message }) => setMessage(message));
	  player.addListener("playback_error", ({ message }) => setMessage(message));
  
	  // Playback state
	  player.addListener("player_state_changed", (state) => {
		try {
		  if (!state) return;
		  const { duration, position, paused, shuffle, repeat_mode, track_window } = state;
		  const { current_track } = track_window;
  
		  setPlayInfo(current_track);
		  setPlayback(position / duration);
		  setPlaybackState(prev => ({
			...prev,
			play: !paused,
			shuffle,
			repeat: repeat_mode !== 0,
			progress: position,
			total_time: duration,
		  }));
		} catch (error) {
		  console.error(error);
		}
	  });
  
	  // Ready listener - removed automatic connectTip trigger
	  player.addListener("ready", ({ device_id }) => {
		console.log("Ready with Device ID", device_id);
	  });
  
	  player.addListener("not_ready", ({ device_id }) => {
		console.log("Device offline", device_id);
	  });
  
	  player.connect();
	};
  
	useImperativeHandle(ref, () => ({
	  updateState: () => {
		setPlaybackState(prev => ({ ...prev, play: true }));
		updateState();
	  },
	}));
  
	const updateState = () => {
	  if (!player.current) apiUpdate();
	};
  
	const apiUpdate = () => {
	  clearTimeout(timerRef.current);
	  const requestInfo = reqWithToken(
		"https://api.spotify.com/v1/me/player",
		token,
		source
	  );
  
	  requestInfo()
		.then((response) => {
		  if (response.status === 200) {
			const { repeat_state, shuffle_state, is_playing, progress_ms, item, device } = response.data;
			setPlayback(progress_ms / item.duration_ms);
			
			timerRef.current = setTimeout(
			  () => updateState(),
			  item.duration_ms - progress_ms + 10
			);
  
			setVolume(device.volume_percent / 100);
			setPlaybackState(prev => ({
			  ...prev,
			  play: is_playing,
			  shuffle: shuffle_state,
			  repeat: repeat_state !== "off",
			  progress: progress_ms,
			  total_time: item.duration_ms,
			}));
			setPlayInfo(item);
		  } else if (response.status === 204) {
			setMessage("No active device - select one to start listening");
			setConnectTip(true);
		  }
		})
		.catch(console.error);
	};
  
	const updatePlayback = () => {
	  const interval = 500 / playbackState.total_time;
	  setPlayback(prev => prev + interval);
	  setPlaybackState(prev => ({ ...prev, progress: prev.progress + 500 }));
	};
  
	const togglePlay = () => {
	  const url = playbackState.play ? "/pause" : "/play";
	  putWithToken(`https://api.spotify.com/v1/me/player${url}`, token, source)()
		.then(() => {
		  setPlaybackState(prev => ({ ...prev, play: !prev.play }));
		  updateState();
		})
		.catch(error => setMessage(`Error: ${error}`));
	};
  
	const toggleShuffle = () => {
	  putWithToken(
		`https://api.spotify.com/v1/me/player/shuffle?state=${!playbackState.shuffle}`,
		token,
		source
	  )()
		.then(() => {
		  setMessage(`Shuffle ${playbackState.shuffle ? "Off" : "On"}`);
		  setPlaybackState(prev => ({ ...prev, shuffle: !prev.shuffle }));
		  updateState();
		})
		.catch(error => setMessage(`Error: ${error}`));
	};
  
	const toggleRepeat = () => {
	  const url = playbackState.repeat ? "repeat?state=off" : "repeat?state=track";
	  putWithToken(`https://api.spotify.com/v1/me/player/${url}`, token, source)()
		.then(() => {
		  setMessage(`Repeat ${playbackState.repeat ? "Off" : "On"}`);
		  setPlaybackState(prev => ({ ...prev, repeat: !prev.repeat }));
		  updateState();
		})
		.catch(error => setMessage(`Error: ${error}`));
	};
  
	const skipTrack = (direction) => {
	  putWithToken(
		`https://api.spotify.com/v1/me/player/${direction}`,
		token,
		source,
		{},
		"POST"
	  )()
		.then(() => updateState())
		.catch(error => setMessage(`Error: ${error}`));
	};
  
	const seekPlayback = (ratio) => {
	  const time = Math.round(ratio * playbackState.total_time);
	  putWithToken(
		`https://api.spotify.com/v1/me/player/seek?position_ms=${time}`,
		token,
		source
	  )()
		.then(() => {
		  setPlayback(ratio);
		  setPlaybackState(prev => ({ ...prev, progress: time }));
		  updateState();
		})
		.catch(error => setMessage(`Error: ${error}`));
	  setScrubPb(null);
	};
  
	const scrubPlayback = (ratio) => setScrubPb(ratio * playbackState.total_time);
  
	const seekVolume = (ratio) => {
	  const integer = Math.round(ratio * 100);
	  putWithToken(
		`https://api.spotify.com/v1/me/player/volume?volume_percent=${integer}`,
		token,
		source
	  )()
		.then(() => setVolume(ratio))
		.catch(error => setMessage(`Error: ${error}`));
	};
  
	return (
	  <>
		{playbackState.play && (
		  <Heartbeat heartbeatFunction={updatePlayback} heartbeatInterval={500} />
		)}
		<div className="player">
		  <div className="player-left">
			<NowPlaying playInfo={playInfo} />
		  </div>
  
		  <div className="player-center">
			<div className="player-control-buttons">
			  <ControlButton
				title="Toggle Shuffle"
				icon="Shuffle"
				active={playbackState.shuffle}
				onClick={toggleShuffle}
			  />
			  <ControlButton
				title="Previous"
				icon="TrackBack"
				size="x-smaller"
				onClick={() => skipTrack("previous")}
			  />
			  <ControlButton
				title={playbackState.play ? "Pause" : "Play"}
				icon={playbackState.play ? "Pause" : "Play"}
				size={playbackState.play ? "smaller" : "larger"}
				extraClass="circle-border"
				onClick={togglePlay}
			  />
			  <ControlButton
				title="Next"
				icon="TrackNext"
				size="x-smaller"
				onClick={() => skipTrack("next")}
			  />
			  <ControlButton
				title="Toggle Repeat"
				icon="Repeat"
				active={playbackState.repeat}
				onClick={toggleRepeat}
			  />
			</div>
  
			<div className="player-playback" draggable="false">
			  <div className="playback-time">
				{scrubPb ? msTimeFormat(scrubPb) : msTimeFormat(playbackState.progress)}
			  </div>
			  <ProgressBar
				extraClass="playback"
				value={playback}
				engageClass="engage"
				setValue={seekPlayback}
				scrubFunction={scrubPlayback}
			  />
			  <div className="playback-time">
				{msTimeFormat(playbackState.total_time)}
			  </div>
			</div>
		  </div>
  
		  <div className="player-right">
			<div className="extra-controls">
			  <span className="connect-devices-wrapper">
				{connectTip && (
				  <ConnectDevices
					token={token}
					closeTip={() => setConnectTip(false)}
				  />
				)}
				<ControlButton
				  title="Devices"
				  icon="Speaker"
				  size="x-larger"
				  onClick={() => setConnectTip(!connectTip)}
				  active={playbackState.play}
				/>
			  </span>
			  <div className="volume-control">
				<ControlButton
				  title="Volume"
				  icon="Volume"
				  size="x-larger"
				  extraClass="volume"
				/>
				<div style={{ width: "100%" }}>
				  <ProgressBar
					extraClass="volume"
					value={volume}
					engageClass="engage"
					setValue={seekVolume}
				  />
				</div>
			  </div>
			</div>
		  </div>
		</div>
	  </>
	);
  });
  
  export default Player;