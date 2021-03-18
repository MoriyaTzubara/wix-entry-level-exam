import express from "express";
import bodyParser = require("body-parser");
import { tempData } from "./temp-data";
import { serverAPIPort, APIPath } from "@fed-exam/config";
import { Ticket } from "../client/src/api";
import { validateTicket, validateTicketId } from "./validation";

console.log("starting server", { serverAPIPort, APIPath });

const NOT_FOUNT_MESSAGE = "The ticket with the given ID was not found.";

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
  const ticket = validateTicketId(req.body.id);
  if (!ticket) return res.status(404).send(NOT_FOUNT_MESSAGE);

  const clone: Ticket = JSON.parse(JSON.stringify(ticket));

  idForInitialization += 1;
  clone.id = idForInitialization.toString();

  tempData.push(clone);

  res.send(clone);
});

app.delete(`${APIPath}/:id`, (req, res) => {
  const ticket = validateTicketId(req.params.id);
  if (!ticket) return res.status(404).send(NOT_FOUNT_MESSAGE);

  const i = tempData.findIndex((t) => t.id === req.params.id);

  // Delete the ticket
  tempData.splice(i, 1);
  res.send(ticket);
});

app.put(APIPath, (req, res) => {
  const { ticket } = req.body;

  const error = validateTicket(ticket);
  if (error) return res.status(400).send(error.message);

  if (!validateTicketId(ticket.id))
    return res.status(404).send(NOT_FOUNT_MESSAGE);

  const i = tempData.findIndex((t) => t.id === ticket.id);

  tempData[i].title = ticket.title;
  tempData[i].creationTime = ticket.creationTime;
  tempData[i].labels = ticket.labels;
  tempData[i].content = ticket.content;
  tempData[i].userEmail = ticket.userEmail;

  res.send(tempData[i]);
});

app.listen(serverAPIPort);
console.log("server running", serverAPIPort);
