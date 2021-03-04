import React, { Component, ReactNode } from 'react';
import './App.scss';
import {createApiClient, Ticket} from './api';
import { type } from 'os';

export type AppState = {
	tickets?: TicketState[],
	search: string;
	darkMode: boolean
}

export type TicketState = {
	ticket: Ticket,
	seeMore: boolean,
	pin: number,
}

const api = createApiClient();

type Props = {
	children:{
		ticket: Ticket,
		seeMore: boolean,
		pin: number,
		onClickPin: Function,
		onClickSeeMore: Function,
		index: number
	}
}

export class TicketView extends Component<Props>{

	render(){
		const props = this.props.children;
		const ticket = props.ticket;
		const contentClass = props.seeMore ? 'content-more' : 'content-less';
		const LessOrMore = props.seeMore ? 'less' : 'more';
		const pinOrUnpin = props.pin ? '📌' : 'pin';

		return(
			<li key={ticket.id} className='ticket'>
				<a className='pin' onClick={() => {props.onClickPin(props.index)}}>{pinOrUnpin}</a>
				<h5 className='title'>{ticket.title}</h5>
				<div>
					<p className={contentClass}>{ticket.content}</p>
					<a className={'see-more'} onClick={() => {props.onClickSeeMore(props.index)}}>{'See ' + LessOrMore}</a>
				</div>
				<footer>
					<div className='meta-data'>By {ticket.userEmail} | { new Date(ticket.creationTime).toLocaleString()}</div>
				</footer>
			</li>
		);
	}
}

export class App extends React.PureComponent<{}, AppState> {

	state: AppState = {
		search: '',
		darkMode: false
	}

	searchDebounce: any = null;

	async componentDidMount() {
		const tickets = await (await api.getTickets()).map((ticket) => {
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
				const props: Props = {
					children: {
						ticket: ticket.ticket,
						seeMore: ticket.seeMore,
						pin: ticket.pin,
						index: index,
						onClickPin: (i:number) => this.onClickPin(i),
						onClickSeeMore: (i:number) => this.onClickSeeMore(i)
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
	onClickSeeMore = async (i:number) => {
		if (!this.state.tickets)
			return;
		let tickets = this.state.tickets.slice();
		tickets[i].seeMore = !tickets[i].seeMore;
		this.setState({
			tickets: tickets
		});
	}

	onClickPin = async (i:number) => {
		if (!this.state.tickets)
			return;
		let tickets = this.state.tickets.slice();
		tickets[i].pin = tickets[i].pin == 0 ? tickets[0].pin - 1 : 0;
		tickets = tickets.sort((a) => (a.pin))
		this.setState({
			tickets: tickets
		});		
	}

	onClickMode = async () => {
		const darkMode = !this.state.darkMode;
		this.setState({
			darkMode: darkMode,
		});
	}
	
	render() {	
		const {tickets} = this.state;
		const mode = this.state.darkMode ? '🌞 light' : '🌜 dark' ;
		const currTheme =  this.state.darkMode ? 'dark' : 'light';
		return (<main className={currTheme + '-theme'}>
					<a className='mode-btn' onClick={this.onClickMode} >{mode}</a>
					<h1>Tickets List</h1>
					<header>
						<input type="search" placeholder="Search..." onChange={(e) => this.onSearch(e.target.value)}/>
					</header>
					{tickets ? <div className='results'>Showing {tickets.length} results</div> : null }	
					{tickets ? this.renderTickets(tickets) : <h2>Loading..</h2>}
				</main>)
	}
}

export default App;