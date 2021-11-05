import { Component } from "react";
import {
  BrowserRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import io from "socket.io-client";
import "./App.css";
import Chat from "./components/Chat";
import Msg from "./components/Msg";
import scroll from "./scroll.png";
import Loading from "./subcomponents/Loading";

const socket = io("http://127.0.0.1:5000/");

class App extends Component {
  constructor() {
    super();
    this.login = this.login.bind(this);
    this.sendMsg = this.sendMsg.bind(this);
    this.messageChange = this.messageChange.bind(this);
    this.scrollToEnd = this.scrollToEnd.bind(this);
    this.state = {
      loggedIn: false,
      loggedInUser: "",
      selectedChatId: "",
      messages: [],
      selectedChatName: "",
      chatsList: [],
      chats: [],
      InputMessage: "",
      loggedInUserId: "",
      loading: true,
    };
    this.select = this.select.bind(this);
    fetch("/login", {
      method: "POST",
      headers: {
        username: localStorage.getItem("username"),
        token: localStorage.getItem("token"),
        client_id: localStorage.getItem("client_id"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) {
          this.setState({
            loggedIn: true,
            loggedInUser: data.cre.name,
            loggedInUserId: data.cre.id,
          });
        }
      })
      .finally(() => {
        this.setState({ loading: false });
      });
    socket.on("disconnect", () => {
      socket.emit("userDisconnected", { id: socket.id });
    });
    socket.on("connect", () => {
      socket.emit("connected", {
        id: socket.id,
        username: localStorage.getItem("username"),
      });
    });
    socket.on("msg_sent", (msg) => {
      if (msg.sender_id === this.state.selectedChatId) {
        this.setState({ messages: [...this.state.messages, msg] }, () => {
          document.getElementById(msg.id).scrollIntoView();
        });
      }
      if (msg.sender_id === this.state.loggedInUserId) {
        this.setState({ messages: [...this.state.messages, msg] }, () => {
          document.getElementById(msg.id).scrollIntoView();
        });
      }
      if (this.state.chatsList.includes(msg.sender_id)) {
        this.state.chats.forEach((element, index) => {
          if (element.id === msg.sender_id) {
            element.unReadMessages++;
            this.setState(this.state);
          }
        });
      }
    });
  }
  getChats() {
    fetch("/chats", {
      method: "GET",
      headers: {
        username: localStorage.getItem("username"),
        token: localStorage.getItem("token"),
        client_id: localStorage.getItem("client_id"),
      },
    })
      .then((res) => res.json())
      .then((data) => {
        this.setState({ chats: data.chats, chatsList: data.chatsList });
      });
  }
  componentDidMount() {
    if (localStorage.getItem("username")) {
      this.getChats();
    }
  }
  getMsgs() {
    fetch("/msgs", {
      method: "POST",
      headers: {
        username: localStorage.getItem("username"),
        token: localStorage.getItem("token"),
        client_id: localStorage.getItem("client_id"),
        chat_id: this.state.selectedChatId,
      },
      body: {
        chat_id: this.state.selectedChatId,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        this.setState(
          {
            messages: data.msg,
            selectedChatName: data.name,
          },
          () => {
            if (data.msg.length !== 0) {
              console.log(data);
              document
                .getElementById(data.msg[data.msg.length - 1].id)
                .scrollIntoView();
            }
          }
        );
      });
  }
  select(id) {
    this.setState({ selectedChatId: id }, () => {
      this.getMsgs();
    });
  }
  messageChange(event) {
    this.setState({ InputMessage: event.target.value });
  }
  scrollBtn() {
    if (this.state.selectedChatId !== "" && this.state.InputMessage === "") {
      return true;
    } else {
      return false;
    }
  }
  sendMsg() {
    if (this.state.InputMessage) {
      socket.emit("send_msg", {
        sender_id: this.state.loggedInUserId,
        receiver_id: this.state.selectedChatId,
        msg: this.state.InputMessage,
      });
    }
  }
  scrollToEnd() {
    document
      .getElementById(this.state.messages[this.state.messages.length - 1].id)
      .scrollIntoView();
  }
  login() {
    fetch("/loginAuth", {
      headers: {
        username: document.getElementById("username").value,
        password: document.getElementById("password").value,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.status && data.token && data.client_id) {
          localStorage.clear();
          localStorage.setItem("token", data.token);
          localStorage.setItem("client_id", data.client_id);
          localStorage.setItem(
            "username",
            document.getElementById("username").value
          );
          this.setState({
            loggedInUserId: document.getElementById("username").value,
            loggedIn: true,
          });
          window.location = "/";
        }
      });
  }
  render() {
    return (
      <>
        <Router>
          <Switch>
            <Route exact path="/">
              {!this.state.loading && !this.state.loggedIn ? (
                <Redirect to="/login" />
              ) : (
                <>
                  {this.state.loading ? (
                    <Loading />
                  ) : (
                    <>
                      <div className="info">
                        <h5 className="selectedChatName">
                          {this.state.selectedChatName
                            ? this.state.selectedChatName
                            : "Click On Chat to Display Chat History"}
                        </h5>
                      </div>
                      <div className="messages">
                        {this.state.loggedIn
                          ? this.state.messages.map((msg) => (
                              <Msg
                                key={msg.id}
                                msg={msg}
                                user={this.state.loggedInUserId}
                              />
                            ))
                          : null}
                      </div>
                      <div className="container">
                        <div className="collection">
                          <li className="collection-item avatar">
                            <img alt="" className="circle" />
                            <span className="title">
                              {this.state.loggedInUser}
                            </span>
                          </li>
                          <ul className="list-group">
                            {this.state.chats.map((chat) => (
                              <Chat
                                key={chat.id}
                                chat={chat}
                                select={this.select}
                                selected={
                                  this.state.selectedChatId === chat.id
                                    ? true
                                    : false
                                }
                              />
                            ))}
                          </ul>
                        </div>
                      </div>
                      {this.state.selectedChatId ? (
                        <input
                          className="msgInput"
                          onChange={(e) => this.messageChange(e)}
                          value={this.state.InputMessage}
                          placeholder="Send Message"
                        ></input>
                      ) : null}
                      {this.state.InputMessage ? (
                        <button className="msgSendBtn" onClick={this.sendMsg}>
                          Send
                        </button>
                      ) : null}
                      {this.scrollBtn() ? (
                        <img
                          className="scrollToEndImg"
                          onClick={this.scrollToEnd}
                          src={scroll}
                          alt="Scroll"
                        ></img>
                      ) : null}
                    </>
                  )}
                </>
              )}
            </Route>
            <Route exact path="/login">
              {this.state.loggedIn ? <Redirect to="/" /> : null}
              <div className="loginDiv">
                <h2>Login To Whatsapp Account</h2>
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  className="inputForLogin"
                ></input>
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  className="inputForLogin"
                ></input>
                <button className="loginBtn" onClick={this.login}>
                  Login
                </button>
              </div>
            </Route>
          </Switch>
        </Router>
      </>
    );
  }
}

export default App;
