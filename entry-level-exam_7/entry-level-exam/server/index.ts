import express from 'express';
import bodyParser = require('body-parser');
import { tempData } from './temp-data';
import { serverAPIPort, APIPath } from '@fed-exam/config';
import { Ticket } from '../client/src/api';

console.log('starting server', { serverAPIPort, APIPath });

const app = express();

const PAGE_SIZE = 20;

let idForInitialization = 0;

app.use(bodyParser.json());

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

app.get(APIPath, (req, res) => {

  // @ts-ignore
  let page: number = req.query.page || 1;

  if ((page < 1) || (page > tempData.length / PAGE_SIZE))
    page = 1

  const paginatedData = tempData.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  res.send(paginatedData);
});

app.post(APIPath + '/clone', (req, res) => {
  // clone ticket
  const ticketId = req.body.id;
  const ticket = tempData.find((t:Ticket) => { return t.id == ticketId});
  if (!ticket)
    return;
  
  const clone:Ticket = JSON.parse(JSON.stringify(ticket))
    
  idForInitialization += 1;
  clone.id = idForInitialization.toString();

  tempData.push(clone);
  
  res.send(clone);
});

app.listen(serverAPIPort);
console.log('server running', serverAPIPort)

