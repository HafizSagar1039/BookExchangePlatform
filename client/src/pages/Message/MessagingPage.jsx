import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useExchange } from "../../context/ExchangeContext";
import { useAuth } from "../../context/AuthContext";
import io from "socket.io-client";
import "./MessagePage.css";

const MessagingPage = () => {
  const { exchangeId } = useParams();
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const [exchange, setExchange] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [socketInstance, setSocketInstance] = useState(null);

  const { getExchangeById, getMessages, sendMessage } = useExchange();
  const { currentUser } = useAuth();

  const fetchExchange = useCallback(async () => {
    try {
      const data = await getExchangeById(exchangeId);
      setExchange(data);
    } catch (err) {
      setError("Failed to load exchange details");
      console.error(err);
    }
  }, [exchangeId, getExchangeById]);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await getMessages(exchangeId);
      setMessages(data);
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  }, [exchangeId, getMessages]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchExchange(), fetchMessages()]);
      setLoading(false);
    };
    loadData();
  }, [exchangeId, fetchExchange, fetchMessages]);

  useEffect(() => {
    if (!currentUser?.id) return;

    const newSocket = io("http://localhost:5000", {
      query: { userId: currentUser.id.toString() },
    });

    setSocketInstance(newSocket);

    newSocket.emit("join_room", exchangeId);

    newSocket.on("receive_message", (incomingMessage) => {
      setMessages((prev) => [...prev, incomingMessage]);
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      newSocket.emit("leave_room", exchangeId);
      newSocket.disconnect();
    };
  }, [currentUser?.id, exchangeId]);

  const scrollToBottomIfNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const threshold = 150;
    const scrollPositionFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (scrollPositionFromBottom < threshold) {
      container.scrollTop = container.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottomIfNearBottom();
  }, [messages]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date)) return "Invalid Date";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const sentMessage = await sendMessage(exchangeId, message);
      setMessage("");
      inputRef.current?.focus();

      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) container.scrollTop = container.scrollHeight;
      }, 50);
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  if (loading && !exchange) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading messages...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-3">
          <Button as={Link} to="/dashboard" variant="outline-primary">
            Back to Dashboard
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container className="my-4" style={{ maxWidth: "700px", paddingBottom: "80px" }}>
      <Row>
        <Col className="mx-auto">
          <Card className="shadow message-card">
            <Card.Header className="bg-primary text-white message-header">
              <h5 className="mb-0">
                <i className="fas fa-comment-alt me-2"></i>Exchange Messages
              </h5>
              <Button as={Link} to="/dashboard" variant="outline-light" size="sm">
                Back
              </Button>
            </Card.Header>

            <Card.Body className="p-0 d-flex flex-column message-body">
              {exchange && (
                <>
                  <div className="exchange-info d-flex align-items-center gap-3">
                    <img
                      src={`http://localhost:5000/uploads/profile_pictures/${currentUser.picture}`}
                      alt={exchange.Title}
                      className="book-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/fallback.jpg";
                      }}
                    />
                    <div className="flex-grow-1">
                      <Link
                        to={`/books/${exchange.BookID}`}
                        className="text-decoration-none fs-6 fw-semibold text-dark"
                      >
                        {exchange.Title}
                      </Link>
                      <p className="text-muted mb-1 small">by {exchange.Author}</p>
                      <div className="exchange-status">
                        <span
                          className={`badge ${
                            exchange.ExchangeStatus === "Approved"
                              ? "bg-success"
                              : exchange.ExchangeStatus === "Rejected"
                              ? "bg-danger"
                              : "bg-warning text-dark"
                          }`}
                        >
                          {exchange.ExchangeStatus || "Pending"}
                        </span>
                        <small className="text-muted ms-2">
                          Requested on {formatDate(exchange.created_at)}
                        </small>
                      </div>
                    </div>
                    <div className="user-role-info">
                      <div>
                        <strong>
                          {currentUser.id === exchange.requester_id ? "Owner :" : "Requester"}
                        </strong>
                      </div>
                      <div>
                        {currentUser.id === exchange.requester_id
                          ? exchange.owner_name + " " + exchange.last_name
                          : exchange.requester_name}
                      </div>
                    </div>
                  </div>

                  <div ref={messagesContainerRef} className="messages-container">
                    {messages.length === 0 ? (
                      <div className="text-center my-auto text-muted fst-italic" style={{ fontSize: "1.1rem" }}>
                        <i className="fas fa-comments fa-2x mb-3"></i>
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((msg, ind) => {
                        const isCurrentUser = msg.SenderID === currentUser.id;
                        return (
                          <div
                            key={msg.MessageID || ind}
                            className={`message-bubble ${isCurrentUser ? "sent" : "received"}`}
                          >
                            <div className="message-content">
                              {msg.MessageContent || msg.message || "No message content"}
                            </div>
                            <div
                              className="message-time"
                              title={new Date(msg.Timestamp || msg.created_at || msg.timestamp).toLocaleString()}
                            >
                              {formatTime(msg.Timestamp || msg.created_at || msg.timestamp)}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="p-3 bg-white" style={{ borderTop: "1px solid #ddd" }}>
                    <Form onSubmit={handleSendMessage} className="d-flex gap-2">
                      <Form.Control
                        ref={inputRef}
                        type="text"
                        placeholder="Type your message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        autoComplete="off"
                        aria-label="Message input"
                      />
                      <Button type="submit" variant="primary" disabled={!message.trim()} style={{ minWidth: "100px" }}>
                        Send
                      </Button>
                    </Form>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MessagingPage;
