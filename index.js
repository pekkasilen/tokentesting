const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const exec = require("child_process").exec;
let child = exec(
  "json-server --watch c:/programming/json-server/testailua.json"
);

const serverSecret = "TosiSalainenSanaTassaOnkinKukaanEiVarmastiArvaa";

const registeredUsers = [
  { username: "pekka", password: bcrypt.hash("kissa", 5) },
  { username: "jaakko", password: bcrypt.hash("kala", 5) },
  { username: "anne", password: bcrypt.hash("hessuhopo", 5) },
];

const port = 8000;

app.use(cors());

app.use(express.json());

app.post("/login/", async (req, res) => {
  let user = registeredUsers.filter((u) => u.username === req.body.username);
  if (
    user.length === 1 &&
    bcrypt.compareSync(req.body.password, await user[0].password)
  ) {
    console.log("login successfull");
    res.status(200).send(generateAccessToken(req, res));
  } else {
    console.log("login failed");
    res.status(401).send("login failed");
  }
});

app.post("/register", (req, res) => {
  if (registeredUsers.some((x) => x.username === req.body.username)) {
    res.status(409).send("User already exists");
  } else {
    let encryptedPassword = bcrypt.hashSync(req.body.password, 5);
    registeredUsers.push({
      username: req.body.username,
      password: encryptedPassword,
    });
    res.status(200).send("User created");
  }
});

const generateAccessToken = (req, res) => {
  return jwt.sign(req.body.username, serverSecret);
};

const checkToken = (req, res) => {
  let reqToken = req.headers["authorization"].split(" ")[1];
  return registeredUsers.some(
    (x) => x.username === jwt.verify(reqToken, serverSecret)
  );
};

//returns names and ids of currently available exams. GET: http://localhost:8000/examnames
app.get("/examnames", async (req, res) => {
  if (checkToken(req, res)) {
    console.log("token ok");
    let exams = await axios.get("http://localhost:3000/exams");
    let examNames = await exams.data.map((x) => {
      return { title: x.title, id: x.id };
    });
    res.send(examNames);
  } else {
    res.status(401).send("Not authorized");
  }
});

//returns a spesific exam with ?-query parameter "id". GET-example: http://localhost:8000/getbyid?id=1
app.get("/getbyid", async (req, res) => {
  let exam = await axios.get(`http://localhost:3000/exams/${req.query.id}`);
  let retValue = await exam.data;
  res.send(retValue);
});

//Accepts new exam as JSON, stores it into json-db and returns stored object back.
//POST: http://localhost:8000/exams , body including json.
app.post("/exams", async (req, res) => {
  let exam = await axios.post("http://localhost:3000/exams", req.body);
  console.log(req.body);
  res.send("jou");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
