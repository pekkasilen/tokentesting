import axios from "axios";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import { FormGroup } from "react-bootstrap";
import { FormLabel } from "react-bootstrap";
import { FormControl } from "react-bootstrap";
import Button from "react-bootstrap/Button";
function App() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [regUserName, setRegUserName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [token, setToken] = useState("");
  const [examData, setExamData] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("");
  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("username:", userName);
    console.log("password:", password);
    let response = await axios.post("http://localhost:8000/login", {
      username: userName,
      password: password,
    });
    localStorage.setItem("jwtToken", response.data);
    setToken(response.data);
    console.log(response.data);
  };

  const handleRegistrationSubmit = async (event) => {
    event.preventDefault();
    let response = await axios.post("http://localhost:8000/register", {
      username: regUserName,
      password: regPassword,
    });
    setRegistrationStatus(response.data);
  };

  const requestExamData = async () => {
    let getToken = localStorage.getItem("jwtToken");
    let response = await axios.get("http://localhost:8000/examnames", {
      headers: {
        authorization: "bearer " + getToken,
      },
    });
    setExamData(JSON.stringify(response.data));
  };

  return (
    <div>
      <h2>Login</h2>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <FormLabel>username</FormLabel>
          <FormControl
            autoFocus
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel>password</FormLabel>
          <FormControl
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormGroup>
        <Button type="submit">Login</Button>
      </Form>
      <p>Token data will be visible here after successful login</p>
      <p>{token}</p>
      <p>After succesfull login, You can request for exam data:</p>
      <Button onClick={() => requestExamData()}>request exam names</Button>
      <p>{examData}</p>

      <h2>Or maybe try registration?</h2>
      <Form onSubmit={handleRegistrationSubmit}>
        <FormGroup>
          <FormLabel>username</FormLabel>
          <FormControl
            autoFocus
            type="text"
            value={regUserName}
            onChange={(e) => setRegUserName(e.target.value)}
          />
        </FormGroup>
        <FormGroup>
          <FormLabel>password</FormLabel>
          <FormControl
            type="password"
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
          />
        </FormGroup>
        <Button type="submit">Register</Button>
      </Form>
      <p>Registration status will pop here:</p>
      <p>{registrationStatus}</p>
    </div>
  );
}

export default App;
