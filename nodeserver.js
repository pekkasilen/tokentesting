const express = require("express");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const app = express();
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool, Client } = require("pg");
const pool = new Pool({
  user: 'admin',
  host: 'localhost',
  port: 5432,
  database: 'Tenttitietokanta',
  password: 'SalainenSana1!',
});

const exec = require("child_process").exec;
let child = exec(
  "json-server --watch c:/programming/json-server/testailua.json"
);
app.use(express.static("nodePalvelin/build"));

const serverSecret = "TosiSalainenSanaTassaOnkinKukaanEiVarmastiArvaa";

const registeredUsers = [
  { username: "pekka", password: bcrypt.hash("kissa", 5), balance: 3265 },
  { username: "jaakko", password: bcrypt.hash("kala", 5), balance: 455 },
  { username: "anne", password: bcrypt.hash("hessuhopo", 5), balance: 10998 },
];

const port = 8000;

app.use(cors());

app.use(express.json());

const handleTransactions = async (queries) => {
  const client = await pool.connect();
  responses = [];
  try {
    for (let query of queries) {
      console.log('query:');
      console.log(query);
      let res = await client.query(query);
      responses.push(res);
      console.log(res);
    }
  } finally {
    client.release();
  }
  return responses;
};

app.post("/login/", async (req, res) => {
  let dbq = await handleTransactions([`SELECT * FROM public.account WHERE name='${req.body.username}'`])
  console.log('dbq');
  console.log(dbq[0].rows[0]);
  let result = dbq[0].rows[0];

  if (
    bcrypt.compareSync(req.body.password, result["password"])
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
      balance: 0,
    });
    handleTransactions([
      `INSERT INTO public.account (name,email,password,isadmin,salt) VALUES ('${req.body.username}','p@p.fi','${encryptedPassword}',false,'abcd')`,
    ]);
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

const getUsernameFromToken = (req, res) => {
  return jwt.verify(req.headers["authorization"].split(" ")[1], serverSecret);
};
//Ei lähetä vielä saldoa
app.get("/balance", (req, res) => {
  if (checkToken(req, res)) {
    console.log("checktoken ok");
    let userNameFromToken = getUsernameFromToken(req, res);
    console.log(userNameFromToken);
    let user = registeredUsers.filter((u) => u.username === userNameFromToken);
    console.log(user);
    res.send("" + user[0].balance);
  }
});

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
