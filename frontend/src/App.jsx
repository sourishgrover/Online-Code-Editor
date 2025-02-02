import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";

const socket = io("http://localhost:5000");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [userName, setUserName] = useState(" ");
  const [roomId, setRoomId] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start Code here");
  const [copySucess, setCopySucess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [output, setOutput] = useState("");
  const [version, setVersion] = useState("*");

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is Typing`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    socket.on("codeResponse", (response) => {
      if (response.success) {
        setOutput(response.output); 
      } else {
        setOutput(`Error: ${response.error}`); 
      }
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
    };
  }, []);

  useEffect(() => {
    const handelBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handelBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handelBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// start Code here");
    setLanguage("javascript");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySucess("Copied");
    setTimeout(() => setCopySucess(""), 2000);
  };

  const handelCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handelLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  const runCode = () => {
    socket.emit("compileCode", { code, roomId, language, version });
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Join the Code Room</h1>
          <input
            type="text"
            placeholder="Room Id"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />
          <input
            type="text"
            placeholder="Your  Name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <button onClick={joinRoom}> join the room </button>
        </div>
      </div>
    );
  } else {
    return (
      <div className="edit-container">
        <div className="sidebar">
          <div className="room-info">
            <h2>Code Room: {roomId}</h2>
            <button onClick={copyRoomId} className="copy-button">
              {" "}
              Copy Id
            </button>
            {copySucess && <span>{copySucess}</span>}
          </div>
          <h3>User in Room</h3>
          <ul>
            {users.map((users, index) => (
              <li key={index}>{users.slice(0, 8)}...</li>
            ))}
          </ul>
          <p className="typing-indicator">{typing}</p>

          <select
            className="language-selector"
            value={language}
            onChange={handelLanguageChange}
          >
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
          <button onClick={leaveRoom} className="leave-button">
            Leave Room
          </button>
        </div>

        <div className="editor-wrapper">
          <Editor
            height={"60%"}
            width={"100%"}
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={handelCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              suggest: {
                enabled: true,
              },
            }}
          />
          <button className="runBtn" onClick={runCode}>
            Execute
          </button>
          <textarea
            className="output-console"
            value={output}
            readOnly
            placeholder="Your output will appear here..."
          ></textarea>
        </div>
      </div>
    );
  }
};

export default App;
