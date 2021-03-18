import Joi from "joi";
import { tempData } from "./temp-data";

const schema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().max(10000).min(1).required(),
  content: Joi.string().max(20000).min(1).required(),
  creationTime: Joi.number().required(),
  userEmail: Joi.string().email().required(),
  labels: Joi.array().items(Joi.string().max(20).min(1)),
});

export const validateTicket = (ticket: Object) => {
  return schema.validate(ticket).error;
};

export const validateTicketId = (id: Object) => {
  return tempData.find((t) => t.id === id);
};

export default { validateTicket, validateTicketId };
