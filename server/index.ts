import express from "express";
import bodyParser = require("body-parser");
import { tempData } from "./temp-data";
import { serverAPIPort, APIPath } from "@fed-exam/config";
import { Ticket } from "../client/src/api";

console.log("starting server", { serverAPIPort, APIPath });

const app = express();

const PAGE_SIZE = 20;

let idForInitialization = 0;

app.use(bodyParser.json());

app.use((_, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

app.get(`${APIPath}/:page`, (req, res) => {
  // @ts-ignore
  let page: number = req.params.page || 1;

  if (page < 1 || page > tempData.length / PAGE_SIZE) page = 1;

  const paginatedData = tempData.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  res.send({ page: page, tickets: paginatedData });
});

app.post(`${APIPath}/clone`, (req, res) => {
  const id = req.body.id;
  const ticket = tempData.find((t: Ticket) => {
    return t.id == id;
  });
  if (!ticket) return;

  // Clone the ticket
  const clone: Ticket = JSON.parse(JSON.stringify(ticket));

  idForInitialization += 1;
  clone.id = idForInitialization.toString();

  tempData.push(clone);

  res.send(clone);
});

app.delete(`${APIPath}/:id`, (req, res) => {
  const id = req.params.id;
  const i = tempData.findIndex((t: Ticket) => {
    return t.id == id;
  });

  if (i == -1) return;

  // Delete the ticket
  tempData.splice(i, 1);
  res.send();
});

app.put(APIPath, (req, res) => {
  const ticket = req.body.ticket;
  const i = tempData.findIndex((t: Ticket) => {
    return t.id == ticket.id;
  });

  if (i == -1) return;

  // Edit the ticket
  tempData[i].title = ticket.title;
  tempData[i].creationTime = ticket.creationTime;
  tempData[i].labels = ticket.labels;
  tempData[i].content = ticket.content;
  tempData[i].userEmail = ticket.userEmail;

  res.send(tempData[i]);
});

app.listen(serverAPIPort);
console.log("server running", serverAPIPort);
