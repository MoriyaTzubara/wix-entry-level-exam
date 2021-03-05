import React, { Component } from 'react';
import './App.scss';
import {createApiClient, Ticket} from './api';

export type AppState = {
	tickets?: TicketState[],
	search: string,
	page: number,
	darkMode: boolean
}

// State for TicketView component
export type TicketState = {
	ticket: Ticket,
	seeMore: boolean,
	pin: number,
}

const api = createApiClient();

// Props that App component sent to TicketView component
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
		// Get tickets from server
		this.updateTicketsState();
	}

	async updateTicketsState(){
		// Get tickets for this page
		const res = await api.getTickets(this.state.page);
		
		// Convert TIcket to TicketState
		const tickets = (res.tickets).map((ticket) => {
			return {
				ticket: ticket,
				seeMore: false,
				pin: 0
			};
		});

		this.setState({
			tickets: tickets,
			page: res.page
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
		tickets.unshift(clone);
		tickets = tickets.sort((t) => t.pin).slice(0, 20);
		
		this.setState({
			tickets: tickets
		});
	}

	onClickSeeMore = async (id: string) => {
		const ticket = this.getticketStateById(id);
		if (!ticket) return;
		ticket.seeMore = !ticket.seeMore;
		
		this.setState({
			tickets: this.state.tickets ? this.state.tickets.slice() : undefined
		});
	}

	onClickRestore = async () => {
		// Restore tickets form server
		this.updateTicketsState();
	}

	onClickPin = async (id:string) => {

		const ticket = this.getticketStateById(id);

		if (!ticket) return;

		// pin => -1, unpin => 0
		ticket.pin = ticket.pin ? 0 : -1;
		
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
		await this.setState({
			page: +this.state.page +i
		});

		this.updateTicketsState();
	}

	getticketStateById = (id: string) => {		
		const tickets = this.state.tickets;
		if (!tickets) return;
		
		return tickets.find((t) => {
			return t.ticket.id == id
		});
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
					{tickets ? <div className='results'>Showing {tickets.length} results <i> ({numPins} pin tickets) <a onClick={() => {this.updateTicketsState()}}> restore</a></i></div> : null }
						<a className='prev-page' onClick={()=>this.onClickChangePage(-1)}>🡠 prev page</a>
						<a className='next-page'onClick={()=>this.onClickChangePage(1)}>next page 🡢</a>	
						<p className='curr-page'>page {this.state.page}</p>
					{tickets ? this.renderTickets(tickets) : <h2>Loading...</h2>}
				</main>)
	}
}

export default App;