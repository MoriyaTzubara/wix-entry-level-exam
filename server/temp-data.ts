import {Ticket} from '../client/src/api';

const jsonfile = require('jsonfile')

const data = require('./data.json');

export const tempData = data as Ticket[];

