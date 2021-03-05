import React, { Component, ReactNode } from 'react';
import './App.scss';
import {createApiClient, Ticket} from './api';
import { type } from 'os';

export type AppState = {
	tickets?: TicketState[],
	search: string,
	page: number,
	darkMode: boolean
}

export type TicketState = {
	ticket: Ticket,
	seeMore: boolean,
	pin: number,
}

const api = createApiClient();

type TicketViewProps = {
	children:{
		ticket: Ticket,
		seeMore: boolean,
		pin: number,
		onClickPin: Function,
		onClickSeeMore: Function,
		onClickClone: Function,
	}
}

export class TicketView extends Component<TicketViewProps>{

	render(){
		const props = this.props.children;
		const ticket = props.ticket;
		const contentClass = props.seeMore ? 'content-more' : 'content-less';
		const lessOrMore = props.seeMore ? 'less' : 'more';
		const pinOrUnpin = props.pin ? '📌' : 'pin';

		return(
			<li key={ticket.id} className='ticket'>
				<a className='pin' onClick={() => {props.onClickPin(props.ticket.id)}}>{pinOrUnpin}</a>
				<h5 className='title'>{ticket.title}</h5>
				<div>
					<p className={contentClass}>{ticket.content}</p>
					<a className={'see-more'} onClick={() => {props.onClickSeeMore(props.ticket.id)}}>{'See ' + lessOrMore}</a>
				</div>
				<footer>
					<div className='meta-data'>By {ticket.userEmail} | { new Date(ticket.creationTime).toLocaleString()}</div>
					<a className='clone' onClick={() => {props.onClickClone(props.ticket.id)}}>clone</a>
				</footer>
			</li>
		);
	}
}

export class App extends React.PureComponent<{}, AppState> {

	state: AppState = {
		search: '',
		darkMode: false,
		page: 1,
	}

	searchDebounce: any = null;

	async componentDidMount() {
		this.updateTicketsState();
	}

	async updateTicketsState(){
		
		const tickets = await (await api.getTickets(this.state.page)).map((ticket) => {
			const ticketState : TicketState = {
				ticket: ticket,
				seeMore: false,
				pin: 0
			};
			return ticketState;
		});

		this.setState({
			tickets: tickets
		});
	}
	
	renderTickets = (tickets: TicketState[]) => {
		const filteredTickets = tickets
			.filter((t) => (t.ticket.title.toLowerCase() + t.ticket.content.toLowerCase()).includes(this.state.search.toLowerCase()));


		return (
		<ul className='tickets'>
			{filteredTickets.map((ticket, index) => {
				const props: TicketViewProps = {
					children: {
						ticket: ticket.ticket,
						seeMore: ticket.seeMore,
						pin: ticket.pin,
						onClickPin: (id:string) => this.onClickPin(id),
						onClickSeeMore: (id:string) => this.onClickSeeMore(id),
						onClickClone: (ticketId:string) => this.onClickClone(ticketId)
					}
				};
				return <TicketView children={props.children}/>
				})}
		</ul>);
	}

	onSearch = async (val: string, newPage?: number) => {
		
		clearTimeout(this.searchDebounce);

		this.searchDebounce = setTimeout(async () => {
			this.setState({
				search: val
			});
		}, 300);
	}

	onClickClone = async (ticketId: string) => {
		if (!this.state.tickets) return;

		const ticket = this.state.tickets.find((t) => { return t.ticket.id == ticketId; });
		
		if (!ticket) return;
		
		
		const clone: TicketState = {
			pin: ticket.pin,
			seeMore: ticket.seeMore,
			ticket: await api.cloneTicket(ticket.ticket.id)
		} 
		
		let tickets = this.state.tickets.slice();
		tickets.push(clone);
		tickets = tickets.sort((t) => t.pin).slice(0, 20);
		this.setState({
			tickets: tickets
		});
	}

	onClickSeeMore = async (id: string) => {

		//let tickets = this.state.tickets.slice();
		const ticket = this.getticketStateById(id);
		
		if (!ticket)
			return;
		ticket.seeMore = !ticket.seeMore;
		this.setState({
			tickets: this.state.tickets ? this.state.tickets.slice() : undefined
		});
	}

	onClickRestore = async () => {
		this.updateTicketsState();
	}

	onClickPin = async (id:string) => {

		const ticket = this.getticketStateById(id);

		if (!ticket)
			return;

		ticket.pin = ticket.pin ? 0 : -1; // 0 == unpin && -1 == pin
		
		this.setState({
			tickets: this.state.tickets ? this.state.tickets.slice().sort((a) => (a.pin)) : undefined
		});		
	}

	onClickMode = async () => {
		const darkMode = !this.state.darkMode;
		this.setState({
			darkMode: darkMode,
		});
	}
	
	onClickChangePage = async (i: number) => {
		this.setState({
			page: this.state.page + i
		});

		this.updateTicketsState();
	}

	getticketStateById = (id: string) => {
		if (!this.state.tickets)
			return;
		
		const tickets = this.state.tickets;
		const ticket = tickets.find((t) => {
			return t.ticket.id == id
		});
		return ticket;
	}

	render() {	
		const {tickets} = this.state;
		const mode = this.state.darkMode ? '🌞 light mode' : '🌜 dark mode' ;
		const currTheme =  this.state.darkMode ? 'dark' : 'light';
		const numPins = tickets ? tickets.filter((t: TicketState) => {return t.pin != 0 }).length : 0;

		return (<main className={currTheme + '-theme'}>
					<a className='mode-btn' onClick={this.onClickMode} >{mode}</a>
					<h1>Tickets List</h1>
					<header>
						<input type="search" placeholder="Search..." onChange={(e) => this.onSearch(e.target.value)}/>
					</header>
					{tickets ? 
						<div className='results'>
							Showing {tickets.length} results
							<i> ({numPins} pin tickets) <a onClick={() => {this.updateTicketsState()}}> restore</a></i>
						</div> 
					: null }
						<br/>
						<a className='prev-page' onClick={()=>this.onClickChangePage(-1)}>🡠 prev page</a>
						<a className='next-page'onClick={()=>this.onClickChangePage(1)}>next page 🡢</a>
						<br/>
					{tickets ? this.renderTickets(tickets) : <h2>Loading..</h2>}
				</main>)
	}
}

export default App;