import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import VideoIcon from "@material-ui/icons/Videocam";
import MicIcon from "@material-ui/icons/Mic";
import VideoOffIcon from "@material-ui/icons/VideocamOff";
import MicOffIcon from "@material-ui/icons/MicOff";
import ScreenShareIcon from "@material-ui/icons/ScreenShare"

import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"


const socket = io.connect('http://16.171.181.156:5000')
function App() {
	console.log("Priyanka");

	const [ me, setMe ] = useState("")
	const [ stream, setStream ] = useState()
	const [ receivingCall, setReceivingCall ] = useState(false)
	const [ caller, setCaller ] = useState("")
	const [ callerSignal, setCallerSignal ] = useState()
	const [ callAccepted, setCallAccepted ] = useState(false)
	const [ idToCall, setIdToCall ] = useState("")
	const [ callEnded, setCallEnded] = useState(false)
	const [ name, setName ] = useState("")
	const [ videoEnabled, setVideoEnabled ] = useState(true)
	const [ audioEnabled, setAudioEnabled ] = useState(true)
	const [isRecording, setisRecording] = useState(true);
	const [note, setNote] = useState(null);
	const [notesStore, setnotesStore] = useState([]);

	const handleScreenShare = async () => {
		try {
			const stream = await navigator.mediaDevices.getDisplayMedia({
				cursor: true
			})
			const screenTrack = stream.getTracks()[0]

			connectionRef.current.replaceTrack(
				stream.getTracks()[0],
				stream.getTracks()[0],
				stream.getTracks()[0]
			)

			screenTrack.onended = () => {
				connectionRef.current.replaceTrack(
					stream.getTracks()[0],
					screenTrack,
					stream.getTracks()[1]
				)
			}
		} catch (error) {
			console.error("Error sharing screen: ", error)
		}
	}
	const myVideo = useRef()
	const userVideo = useRef()
	const connectionRef= useRef()

	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

	socket.on("me", (id) => {
			setMe(id);
			console.log(id);
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})

		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {

				userVideo.current.srcObject = stream

		})
		socket.on("callAccepted", (signal) => {
			setCallAccepted(true)
			peer.signal(signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}

	const leaveCall = () => {
		setCallEnded(true)
		connectionRef.current.destroy()
	}
	const handleVideoEnabled = () => {
		setVideoEnabled(!videoEnabled);
		if (stream) {
		  stream.getVideoTracks()[0].enabled = !videoEnabled;
		}
	  };

	  const handleAudioEnabled = () => {
		setAudioEnabled(!audioEnabled);
		if (stream) {
		  stream.getAudioTracks()[0].enabled = audioEnabled;
		}
	  }
	  const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const microphone = new SpeechRecognition();

microphone.continuous = true;
microphone.interimResults = true;
microphone.lang = "en-US";
const startRecordController = () => {
	if (isRecording) {
	  microphone.start();
	  microphone.onend = () => {
		console.log("continue..");
		microphone.start();
	  };
	} else {
	  microphone.stop();
	  microphone.onend = () => {
		console.log("Stopped microphone on Click");
	  };
	}
	microphone.onstart = () => {
	  console.log("microphones on");
	};

	microphone.onresult = (event) => {
	  const recordingResult = Array.from(event.results)
		.map((result) => result[0])
		.map((result) => result.transcript)
		.join("");
	  console.log(recordingResult);
	  setNote(recordingResult);
	  microphone.onerror = (event) => {
		console.log(event.error);
	  };
	};

  }
  useEffect(() => {
	startRecordController();
  }, [isRecording]);;
	return (
		<>
			<h1 style={{ textAlign: "center", color: '#fff' }}>Zoomish</h1>
		<div className="container">
			<div className="video-container">
			<div className="noteContainer">
          <h2>Record Note Here</h2>
          <button className="button">
            Save
          </button>
          <button onClick={() => setisRecording((prevState) => !prevState)}>
            Start/Stop
          </button>
        </div>
        <div className="noteContainer">
          <h2>Notes Store</h2>
		  <p>{note}</p>
        </div>
				<div className="video">
					{stream &&  <video playsInline muted ref={myVideo} autoPlay style={{ width: "300px" }} />}
				</div>
				<div className="video">
					{callAccepted && !callEnded ?
					<video playsInline ref={userVideo} autoPlay style={{ width: "300px"}} />:
					null}
				</div>
			</div>
			<div className="myId">
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
				/>
				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }} onCopy={() => window.alert("Copied to Clipboard")}>
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
					{idToCall}
				</div>
			</div>
			<div>
				{receivingCall && !callAccepted ? (
						<div className="caller">
						<h1 >{name} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
						 {/* Video on/off button */}
						 <Button
        variant="contained"
        color="primary"
        startIcon={videoEnabled ? <VideoIcon /> : <VideoOffIcon />}
        onClick={handleVideoEnabled}
      >
        {videoEnabled ? "Turn off video" : "Turn on video"}
      </Button>

      {/* Audio on/off button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={audioEnabled ? <MicIcon /> : <MicOffIcon />}
        onClick={handleAudioEnabled}
      >
        {audioEnabled ? "Turn off audio" : "Turn on audio"}
      </Button>
	  <IconButton color="primary" onClick={handleScreenShare}>
    <ScreenShareIcon />
</IconButton>
					</div>
				) : null}
			</div>
		</div>
		</>
	)
}

export default App
