import axios from 'axios';
import {APIRootPath} from '@fed-exam/config';

export type Ticket = {
    id: string,
    title: string;
    content: string;
    creationTime: number;
    userEmail: string;
    labels?: string[];
}

export type ApiClient = {
    getTickets: (page: number) => Promise<{page: number,tickets:Ticket[]}>;
    cloneTicket: (id:string) => Promise<Ticket>;
}

export const createApiClient = (): ApiClient => {
    return {
        getTickets: (page: number) => {
            return axios.get(`${APIRootPath}?page=${page}`).then((res) => res.data);
        },
        cloneTicket: (id:string) => {
            return axios.post(APIRootPath + '/clone', { id: id }).then((res) => res.data);
        }
    }
}
