// components/Chat.jsx - Chat component with real-time messaging
import React, { useState, useEffect, useRef } from 'react';
import { chatService } from '../services/chatService';
import './css/Chat.css';

const Chat = ({ serviceId, currentUser, onNewMessage }) => {
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [showPriceNegotiation, setShowPriceNegotiation] = useState(false);
  const [priceOffer, setPriceOffer] = useState('');
  const messagesEndRef = useRef(null);

  // Load chat data
  useEffect(() => {
    if (serviceId) {
      loadChat();
    }
  }, [serviceId]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChat = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await chatService.getChatByService(serviceId);
      if (result.success) {
        setChat(result.data);
        setMessages(result.data.messages || []);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải cuộc trò chuyện');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      setSending(true);
      
      const messageData = {
        content: newMessage.trim(),
        type: 'text'
      };
      
      const result = await chatService.sendMessage(chat._id, messageData);
      
      if (result.success) {
        setMessages(result.data.messages);
        setNewMessage('');
        
        // Mark as read
        await chatService.markAsRead(chat._id);
        
        // Callback for parent component
        if (onNewMessage) {
          onNewMessage(result.data);
        }
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const sendPriceNegotiation = async (e) => {
    e.preventDefault();
    
    if (!priceOffer || priceOffer <= 0) {
      setError('Giá đề nghị không hợp lệ');
      return;
    }
    
    try {
      setSending(true);
      
      const result = await chatService.negotiatePrice(chat._id, parseFloat(priceOffer));
      
      if (result.success) {
        // Reload chat to get new messages
        await loadChat();
        setShowPriceNegotiation(false);
        setPriceOffer('');
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi gửi đề nghị giá');
    } finally {
      setSending(false);
    }
  };

  const agreeToPrice = async () => {
    try {
      setSending(true);
      
      const result = await chatService.agreeToPrice(chat._id);
      
      if (result.success) {
        await loadChat();
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi đồng ý giá');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const isOwnMessage = (message) => {
    return message.sender._id === currentUser._id;
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">
          <div className="loading-spinner"></div>
          <p>Đang tải cuộc trò chuyện...</p>
        </div>
      </div>
    );
  }

  if (error && !chat) {
    return (
      <div className="chat-container">
        <div className="chat-error">
          <p>{error}</p>
          <button onClick={loadChat} className="btn-retry">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="chat-info">
          <h3>Chat về dịch vụ</h3>
          <p>{chat?.service?.TenDichVu || 'Dịch vụ'}</p>
        </div>
        
        {/* Price Negotiation Status */}
        {chat?.priceNegotiation?.status !== 'none' && (
          <div className="price-status">
            {chat.priceNegotiation.status === 'pending' && (
              <span className="price-pending">
                Đề nghị giá: {formatCurrency(chat.priceNegotiation.currentOffer)}
              </span>
            )}
            {chat.priceNegotiation.status === 'agreed' && (
              <span className="price-agreed">
                Đã đồng ý: {formatCurrency(chat.priceNegotiation.agreedPrice)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p>Chưa có tin nhắn nào. Bắt đầu cuộc trò chuyện!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`message ${isOwnMessage(message) ? 'message-own' : 'message-other'}`}
            >
              <div className="message-content">
                {!isOwnMessage(message) && (
                  <div className="message-sender">
                    {message.sender?.name || 'Người dùng'}
                  </div>
                )}
                
                {message.type === 'text' && (
                  <p className="message-text">{message.content}</p>
                )}
                
                {message.type === 'price_negotiation' && (
                  <div className="message-price">
                    <div className="price-content">
                      {message.metadata.agreed ? (
                        <span className="price-agreed-text">
                          ✅ {message.content}
                        </span>
                      ) : (
                        <span className="price-offer-text">
                          💰 {message.content}
                        </span>
                      )}
                    </div>
                    
                    {!message.metadata.agreed && 
                     !isOwnMessage(message) && 
                     chat.priceNegotiation?.status === 'pending' && (
                      <button 
                        onClick={agreeToPrice}
                        className="btn-agree-price"
                        disabled={sending}
                      >
                        Đồng ý giá
                      </button>
                    )}
                  </div>
                )}
                
                <div className="message-time">
                  {formatTime(message.createdAt)}
                  {message.readAt && isOwnMessage(message) && (
                    <span className="message-read">✓ Đã đọc</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="chat-error-message">
          <p>{error}</p>
          <button onClick={() => setError('')} className="btn-close">×</button>
        </div>
      )}

      {/* Message Input */}
      <div className="chat-input">
        {!showPriceNegotiation ? (
          <form onSubmit={sendMessage} className="message-form">
            <div className="input-group">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Nhập tin nhắn..."
                className="message-input-field"
                disabled={sending}
              />
              <button 
                type="submit" 
                className="btn-send"
                disabled={sending || !newMessage.trim()}
              >
                {sending ? '...' : 'Gửi'}
              </button>
            </div>
            
            {/* Price Negotiation Button */}
            {chat?.priceNegotiation?.status !== 'agreed' && (
              <button
                type="button"
                onClick={() => setShowPriceNegotiation(true)}
                className="btn-negotiate-price"
              >
                💰 Đề nghị giá
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={sendPriceNegotiation} className="price-form">
            <div className="price-input-group">
              <input
                type="number"
                value={priceOffer}
                onChange={(e) => setPriceOffer(e.target.value)}
                placeholder="Nhập giá đề nghị (VND)"
                className="price-input-field"
                min="1000"
                step="1000"
                disabled={sending}
              />
              <button 
                type="submit" 
                className="btn-send-price"
                disabled={sending || !priceOffer}
              >
                {sending ? '...' : 'Gửi đề nghị'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPriceNegotiation(false);
                  setPriceOffer('');
                  setError('');
                }}
                className="btn-cancel-price"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Chat;
