import React, { Component } from "react";
import "./App.scss";
import { createApiClient, Ticket } from "./api";

export type AppState = {
  tickets?: TicketState[];
  search: string;
  page: number;
  darkMode: boolean;
};

// State for TicketView component
export type TicketState = {
  ticket: Ticket;
  seeMore: boolean;
  pin: number;
};

const api = createApiClient();

// Props that App component sent to TicketView component
type TicketViewProps = {
  ticket: Ticket;
  seeMore: boolean;
  pin: number;
  onClickPin: Function;
  onClickSeeMore: Function;
  onClickClone: Function;
  onClickDelete: Function;
  onClickHide: Function;
};

export class TicketView extends Component<TicketViewProps> {
  state = {
    editTitle: false,
    editContent: false,
  };

  renderLabels = (labels: string[]) => {
    return (
      <div className="labels">
        {labels.map((label) => {
          return <div className="label">{label}</div>;
        })}
      </div>
    );
  };

  onClickEditTitle = async () => {
    this.setState({
      editTitle: true,
    });
  };
  onClickEditContent = async () => {
    this.setState({
      editContent: true,
    });
  };

  saveTitle = async (e: any) => {
    let ticket = this.props.ticket;
    ticket.title = e.target.value;
    ticket = await api.editTicket(ticket);
    this.setState({
      editTitle: false,
      ticket: ticket,
    });
  };

  saveContent = async (e: any) => {
    let ticket = this.props.ticket;
    ticket.content = e.target.value;
    ticket = await api.editTicket(ticket);
    this.setState({
      editContent: false,
      ticket: ticket,
    });
  };

  render() {
    const props = this.props;
    const ticket = props.ticket;
    const labels = ticket.labels;
    const contentClass = props.seeMore ? "content-more" : "content-less";
    const lessOrMore = props.seeMore ? "less" : "more";
    return (
      <li key={ticket.id} className="ticket">
        <a
          className="pin"
          onClick={() => {
            props.onClickPin(ticket.id);
          }}
        >
          <img
            src={
              props.pin
                ? require("./icon/push-pin.svg")
                : require("./icon/paper-pin.svg")
            }
          />{" "}
        </a>
        {this.state.editTitle ? (
          <input
            className="title-input"
            type="text"
            autoFocus
            defaultValue={ticket.title}
            onBlur={this.saveTitle}
          />
        ) : (
          <h5 className="title" onClick={this.onClickEditTitle}>
            {ticket.title}
          </h5>
        )}

        <div>
          {this.state.editContent ? (
            <textarea
              className="content-input"
              autoFocus
              defaultValue={ticket.content}
              onBlur={this.saveContent}
            />
          ) : (
            <p onClick={this.onClickEditContent} className={contentClass}>
              {ticket.content}
            </p>
          )}
          <a
            className={"see-more"}
            onClick={() => {
              props.onClickSeeMore(ticket.id);
            }}
          >
            {"See " + lessOrMore}
          </a>
        </div>
        <footer>
          {labels ? this.renderLabels(labels) : ""}
          <div className="meta-data">
            By {ticket.userEmail} |{" "}
            {new Date(ticket.creationTime).toLocaleString()}
          </div>
          <a
            className="hide"
            onClick={() => {
              props.onClickHide(ticket.id);
            }}
          >
            <img src={require("./icon/restriction.svg")} />
          </a>
          <a
            className="clone"
            onClick={() => {
              props.onClickClone(ticket.id);
            }}
          >
            <img src={require("./icon/copy.svg")} />
          </a>
          <a
            className="delete"
            onClick={() => {
              props.onClickDelete(ticket.id);
            }}
          >
            <img src={require("./icon/delete.svg")} />
          </a>
        </footer>
      </li>
    );
  }
}

export class App extends React.PureComponent<{}, AppState> {
  state: AppState = {
    search: "",
    darkMode: false,
    page: 1,
  };

  searchDebounce: any = null;

  async componentDidMount() {
    // Get tickets from server
    this.updateTicketsState();
  }

  async updateTicketsState() {
    // Get tickets for this page
    const res = await api.getTickets(this.state.page);

    // Convert TIcket to TicketState
    const tickets = res.tickets.map((ticket) => {
      return {
        ticket: ticket,
        seeMore: false,
        pin: 0,
      };
    });

    this.setState({
      tickets: tickets,
      page: res.page,
    });
  }

  renderTickets = (tickets: TicketState[]) => {
    const filteredTickets = tickets.filter((t) =>
      (t.ticket.title.toLowerCase() + t.ticket.content.toLowerCase()).includes(
        this.state.search.toLowerCase()
      )
    );

    return (
      <ul className="tickets">
        {filteredTickets.map((ticket, index) => (
          <TicketView
            ticket={ticket.ticket}
            seeMore={ticket.seeMore}
            pin={ticket.pin}
            onClickPin={(id: string) => this.onClickPin(id)}
            onClickSeeMore={(id: string) => this.onClickSeeMore(id)}
            onClickClone={(id: string) => this.onClickClone(id)}
            onClickDelete={(id: string) => this.onClickDelete(id)}
            onClickHide={(id: string) => this.onClickHide(id)}
          />
        ))}
      </ul>
    );
  };

  onSearch = async (val: string, newPage?: number) => {
    clearTimeout(this.searchDebounce);

    this.searchDebounce = setTimeout(async () => {
      this.setState({
        search: val,
      });
    }, 300);
  };

  onClickDelete = async (id: string) => {
    await api.deleteTicket(id);
    this.updateTicketsState();
  };

  onClickClone = async (id: string) => {
    if (!this.state.tickets) return;

    const ticket = this.state.tickets.find((t) => {
      return t.ticket.id == id;
    });

    if (!ticket) return;

    const clone: TicketState = {
      pin: ticket.pin,
      seeMore: ticket.seeMore,
      ticket: await api.cloneTicket(ticket.ticket.id),
    };

    let tickets = this.state.tickets.slice();
    tickets.unshift(clone);
    tickets = tickets.sort((t) => t.pin).slice(0, 20);

    this.setState({
      tickets: tickets,
    });
  };

  onClickHide = async (id: string) => {
    if (!this.state.tickets) return;

    const tickets = this.state.tickets.filter((t) => {
      return t.ticket.id != id;
    });

    this.setState({
      tickets: tickets,
    });
  };

  onClickSeeMore = async (id: string) => {
    const ticket = this.getticketStateById(id);
    if (!ticket) return;
    ticket.seeMore = !ticket.seeMore;

    this.setState({
      tickets: this.state.tickets ? this.state.tickets.slice() : undefined,
    });
  };

  onClickRestore = async () => {
    // Restore tickets form server
    this.updateTicketsState();
  };

  onClickPin = async (id: string) => {
    const ticket = this.getticketStateById(id);

    if (!ticket) return;

    // pin => -1, unpin => 0
    ticket.pin = ticket.pin ? 0 : -1;

    this.setState({
      tickets: this.state.tickets
        ? this.state.tickets.slice().sort((a) => a.pin)
        : undefined,
    });
  };

  onClickMode = async () => {
    const darkMode = !this.state.darkMode;

    this.setState({
      darkMode: darkMode,
    });
  };

  onClickChangePage = async (i: number) => {
    await this.setState({
      page: +this.state.page + i,
    });

    this.updateTicketsState();
  };

  getticketStateById = (id: string) => {
    const tickets = this.state.tickets;
    if (!tickets) return;

    return tickets.find((t) => {
      return t.ticket.id == id;
    });
  };

  render() {
    const { tickets } = this.state;
    const mode = this.state.darkMode ? "🌞 light mode" : "🌜 dark mode";
    const currTheme = this.state.darkMode ? "dark" : "light";
    const numPins = tickets
      ? tickets.filter((t: TicketState) => {
          return t.pin != 0;
        }).length
      : 0;

    return (
      <main className={currTheme + "-theme"}>
        <a className="mode-btn" onClick={this.onClickMode}>
          {mode}
        </a>
        <h1>Tickets List</h1>
        <header>
          <input
            type="search"
            placeholder="Search..."
            onChange={(e) => this.onSearch(e.target.value)}
          />
        </header>
        {tickets ? (
          <div className="results">
            Showing {tickets.length} results{" "}
            <i>
              {" "}
              ({numPins} pin, {20 - tickets.length} hide){" "}
              <a
                onClick={() => {
                  this.updateTicketsState();
                }}
              >
                {" "}
                restore
              </a>
            </i>
          </div>
        ) : null}
        <a className="prev-page" onClick={() => this.onClickChangePage(-1)}>
          🡠 prev page
        </a>
        <a className="next-page" onClick={() => this.onClickChangePage(1)}>
          next page 🡢
        </a>
        <p className="curr-page">page {this.state.page}</p>
        {tickets ? this.renderTickets(tickets) : <h2>Loading...</h2>}
      </main>
    );
  }
}

export default App;
