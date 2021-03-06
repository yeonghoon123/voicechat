import React, {useEffect, useRef, useState} from "react"
import Peer from "simple-peer"
import io from "socket.io-client"

const socket = io.connect("http://localhost:5000")

function App() {
  const [me ,setMe] = useState("")
  const [stream ,setStream] = useState()
  const [RecevingCall ,setRecevingCall] = useState(false)
  const [caller ,setCaller] = useState("")
  const [callerSignal ,setCallerSignal] = useState()
  const [callAccepted ,setCallAccepted] = useState(false)
  const [idToCall ,setIdToCall] = useState("")
  const [callEnded ,setCallEnded] = useState(false)
  const [name ,setName] = useState("")

  const myVideo = useRef()
  const userVideo =useRef()
  const connectionRef = useRef()

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({video: true}).then((stream)=> {
      setStream(stream)
      myVideo.current.srcObject = stream
    })

    socket.on('me', (id) => {
      setMe(id)
    })

    socket.on("callUser", (data) => {
      setRecevingCall(true)
      setCaller(data.from)
      setName(data.name)
      setCallerSignal(data.signal)
    })
  }, [])

  const callUser = (id) =>{
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream : stream
    })

    peer.on("signal",(data) =>{
      socket.emit("callUser",{
        userToCall:id,
        signalData: data,
        from: me,
        name : name
      })
    })

    peer.on("stream", (stream) =>{
      userVideo.current.srcObject = stream
    })

    socket.on("callAccepted", (signal) => {
      setCallAccepted(true)
      peer.signal(signal)
    })

    connectionRef.current = peer

  }

  const answerCall = () =>{
    setCallAccepted(true)
    const peer = new Peer({
      initiator: false,
        trickle:false,
        stream: stream
    })

    peer.on("signal", (data) =>{
      socket.emit("answerCall", {signal: data, to: caller})
    })

    peer.on("stream",(strea) => {
      userVideo.current.srcObject = stream
    })

    peer.signal(callerSignal)
    connectionRef.current = peer
  }

const leaveCall  = () => {
  setCallEnded(true)
  connectionRef.current.destroy()
}

  return (
    <>
    <h1>Zoomish</h1>
    <div>
      <div>
        <div>{stream && <video playsInline muted ref={myVideo} autoPlay />}</div>
        <div>{callAccepted && !callEnded ? <video playsInline ref={userVideo} autoPlay /> : null }</div>
      </div>
    </div>
    </>
  );
}

export default App;
