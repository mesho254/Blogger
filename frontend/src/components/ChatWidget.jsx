import io from 'socket.io-client';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import SimplePeer from 'simple-peer';
import { useTheme, styles } from '../styles/theme';
import { FiSend, FiSmile, FiPhone, FiVideo, FiPaperclip, FiX, FiSearch, FiArrowLeft } from 'react-icons/fi';
import api from '../services/api';
import { uploadImage } from '../services/uploads';
import { toast } from 'react-toastify';

let socket;

const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(import.meta.env.VITE_SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
};

function ChatWidget() {
  const { data: user } = useAuth();
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [showChatList, setShowChatList] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [socketInstance, setSocketInstance] = useState(null);

  // Lightweight inline EmojiPicker to avoid external library incompatibilities
  const EmojiPicker = ({ onSelect }) => {
    const emojis = ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','😍','😘','😜','😎','🤩','🤔','😴','😢','😭','😡','👍','👎','🙏','👏','🎉','💯'];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px', padding: '8px' }}>
        {emojis.map((e) => (
          <button key={e} onClick={() => onSelect && onSelect(e)} style={{ fontSize: '18px', padding: '6px', cursor: 'pointer', background: 'transparent', border: 'none' }}>
            {e}
          </button>
        ))}
      </div>
    );
  };

  // Initialize socket when component mounts
  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (token) {
      const socket = initializeSocket(token);
      setSocketInstance(socket);

      socket.on('connect', () => {
        console.log('Socket connected');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        toast.error('Chat connection failed');
      });

      return () => {
        try {
          socket.disconnect();
        } catch (e) {
          console.warn('Socket disconnect failed', e);
        }
      };
    }
  }, []);

  // Listen for global logout event to cleanup socket
  useEffect(() => {
    const onLogout = () => {
      try {
        socketInstance && socketInstance.disconnect();
      } catch (e) {
        console.warn('Error disconnecting socket on logout', e);
      }
    };
    window.addEventListener('app:logout', onLogout);
    return () => window.removeEventListener('app:logout', onLogout);
  }, [socketInstance]);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [peer, setPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callActive, setCallActive] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [showReactions, setShowReactions] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const isWebRTCSupported = () => {
    return !!(window.RTCPeerConnection && navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  };

  useEffect(() => {
    if (!socketInstance) return;

    // Load conversations
    api.get('/messages/conversations').then((res) => setConversations(res.data));

    socketInstance.on('message:receive', (msg) => {
      setMessages((prev) => [...prev, msg]);
      scrollToBottom();
    });

    socketInstance.on('typing', ({ conversationId }) => {
      if (conversationId === currentConversation) {
        setTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTyping(false), 3000);
      }
    });

    socketInstance.on('presence:update', ({ userId, online }) => {
      setOnlineUsers((prev) => {
        const newSet = new Set(prev);
        online ? newSet.add(userId) : newSet.delete(userId);
        return newSet;
      });
    });

    socketInstance.on('call:signal', ({ from, signal, video }) => {
      setIncomingCall({ from, signal, video });
    });

    socketInstance.on('call:accept', ({ signal }) => {
      if (peer) {
        peer.signal(signal);
        setCallActive(true);
      }
    });

    socketInstance.on('call:decline', () => {
      endCall();
      toast.info('Call declined');
    });

    socketInstance.on('reaction:update', ({ messageId, emoji, userId }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId
            ? { ...msg, reactions: { ...msg.reactions, [emoji]: [...(msg.reactions[emoji] || []), userId] } }
            : msg
        )
      );
    });

    return () => {
      try {
        socketInstance.off && socketInstance.off('message:receive');
        socketInstance.off && socketInstance.off('typing');
        socketInstance.off && socketInstance.off('presence:update');
        socketInstance.off && socketInstance.off('call:signal');
        socketInstance.off && socketInstance.off('call:accept');
        socketInstance.off && socketInstance.off('call:decline');
        socketInstance.off && socketInstance.off('reaction:update');
      } catch (cleanupErr) {
        console.warn('Socket cleanup failed', cleanupErr);
      }
    };
  }, [currentConversation, socketInstance, peer]);

  useEffect(() => {
    if (currentConversation && socketInstance) {
      socketInstance.emit('join:conversation', currentConversation);
      api.get(`/messages/conversations/${currentConversation}/messages`).then((res) => setMessages(res.data));
      scrollToBottom();
    }
  }, [currentConversation, socketInstance]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!currentConversation || !socketInstance) return;
    try {
      let content = input.trim();
      if (!content && !selectedFile) return;

      let type = 'text';
      if (selectedFile) {
        const { url } = await uploadImage(selectedFile);
        content = url;
        type = 'image';
      }

      socketInstance.emit('message:send', {
        content,
        type,
        conversationId: currentConversation,
        replyTo: replyTo?._id
      });

      // Optimistically add message to UI
      setMessages(prev => [...prev, {
        _id: Date.now(),
        content,
        type,
        senderId: user?._id,
        conversationId: currentConversation,
        replyTo: replyTo,
        createdAt: new Date().toISOString()
      }]);

      setInput('');
      setSelectedFile(null);
      setReplyTo(null);
      scrollToBottom();
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    }
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (socketInstance) {
      socketInstance.emit('typing', { conversationId: currentConversation });
    }
  };

  const initiateCall = async (video = false) => {
    try {
      if (!isWebRTCSupported()) {
        toast.error('WebRTC is not supported in this browser');
        return;
      }

      const constraints = { audio: true, video };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream || !stream.getTracks || stream.getTracks().length === 0) {
        toast.error('No media tracks available');
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }

      console.log('Stream tracks:', stream.getTracks());
      console.log('WebRTC APIs:', {
        RTCPeerConnection: !!window.RTCPeerConnection,
        getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      });

      const newPeer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      newPeer.on('signal', (signal) => {
        if (socketInstance) {
          socketInstance.emit('call:signal', { to: currentConversation, signal, video });
        }
      });

      newPeer.on('stream', (remote) => setRemoteStream(remote));
      newPeer.on('close', endCall);
      newPeer.on('error', (err) => {
        console.error('SimplePeer error (initiator):', err);
        toast.error('Call failed: ' + (err.message || 'peer error'));
        endCall();
      });

      setPeer(newPeer);
      setLocalStream(stream);
    } catch (error) {
      console.error('initiateCall error:', error);
      toast.error('Failed to access media: ' + (error.message || 'unknown error'));
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
    }
  };

  const acceptCall = async () => {
    try {
      if (!isWebRTCSupported()) {
        toast.error('WebRTC is not supported in this browser');
        return;
      }

      const constraints = { audio: true, video: incomingCall.video };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream || !stream.getTracks || stream.getTracks().length === 0) {
        toast.error('No media tracks available');
        stream?.getTracks().forEach((track) => track.stop());
        return;
      }

      const newPeer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ],
        },
      });

      newPeer.on('signal', (signal) => {
        if (socketInstance) {
          socketInstance.emit('call:accept', { to: incomingCall.from, signal });
        }
      });

      newPeer.on('stream', (remote) => setRemoteStream(remote));
      newPeer.on('close', endCall);
      newPeer.on('error', (err) => {
        console.error('SimplePeer error (receiver):', err);
        toast.error('Call failed: ' + (err.message || 'peer error'));
        endCall();
      });

      newPeer.signal(incomingCall.signal);
      setPeer(newPeer);
      setLocalStream(stream);
      setCallActive(true);
      setIncomingCall(null);
    } catch (error) {
      console.error('acceptCall error:', error);
      toast.error('Failed to accept call: ' + (error.message || 'unknown error'));
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
        setLocalStream(null);
      }
    }
  };

  const declineCall = () => {
    if (socketInstance) socketInstance.emit('call:decline', { to: incomingCall.from });
    setIncomingCall(null);
  };

  const endCall = () => {
    if (peer) {
      peer.destroy();
    }
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => track.stop());
    }
    setPeer(null);
    setLocalStream(null);
    setRemoteStream(null);
    setCallActive(false);
    setIncomingCall(null);
  };

  const addReaction = (messageId, emoji) => {
    if (socketInstance) socketInstance.emit('reaction:add', { messageId, emoji, conversationId: currentConversation });
    setShowReactions(null);
  };

  const startChatbot = () => {
    if (!socketInstance) {
      toast.error('Chat not connected');
      return;
    }
    setCurrentConversation('chatbot');
    setShowChatList(false);
    socketInstance.emit('join:conversation', 'chatbot');
  };

  const sendToChatbot = () => {
    if (currentConversation === 'chatbot' && socketInstance) {
      socketInstance.emit('chatbot:message', { content: input });
      setInput('');
    }
  };

  const filteredMessages = messages.filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));

  const getParticipantName = (conv) => {
    // Assume conv.participants array, find other than user
    return conv.name || 'Chat';
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowChatList(true);
    setCurrentConversation(null);
  };

  return (
    <>
      {!isOpen ? (
        <div
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '50px',
            height: '50px',
            background: styles.primaryColor,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            transition: 'transform 0.2s ease',
            zIndex: 1000,
            ':hover': {
              transform: 'scale(1.1)',
            }
          }}
        >
          <FiSend />
        </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '500px',
            background: theme.cardBackground,
            borderRadius: '12px 12px 0 0',
            boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            zIndex: 1000,
          }}
        >
          {showChatList ? (
            <div style={{ width: '200px', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
              <div style={{ 
                padding: styles.padding, 
                borderBottom: '1px solid #ddd', 
                display: 'flex', 
                alignItems: 'center',
                justifyContent: 'space-between',
                background: theme.cardBackground,
                position: 'sticky',
                top: 0,
                zIndex: 2
              }}>
                <h3 style={{ margin: 0, color: theme.color }}>Chats</h3>
                <button
                  onClick={handleClose}
                  aria-label="Close chat"
                  style={{
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    padding: '6px',
                    borderRadius: '6px',
                    border: 'none',
                    background: 'transparent',
                    color: theme.color,
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'; }}
                  onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                >
                  <FiX />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setCurrentConversation(conv.id);
                      setShowChatList(false);
                    }}
                    style={{
                      padding: styles.padding,
                      cursor: 'pointer',
                      background: currentConversation === conv.id ? styles.secondaryColor : 'transparent',
                    }}
                  >
                    {getParticipantName(conv)}
                    <span style={{ fontSize: '0.8rem', color: styles.secondaryColor }}>
                      {onlineUsers.has(conv.otherUserId) ? 'Online' : 'Offline'}
                    </span>
                  </div>
                ))}
                <button onClick={startChatbot} style={styles.buttonStyle}>Chat with Bot</button>
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ 
                padding: styles.padding, 
                borderBottom: '1px solid #ddd', 
                display: 'flex', 
                alignItems: 'center',
                background: theme.cardBackground,
                position: 'sticky',
                top: 0,
                zIndex: 2
              }}>
                <FiArrowLeft 
                  onClick={() => setShowChatList(true)} 
                  style={{ 
                    cursor: 'pointer', 
                    marginRight: '1rem',
                    fontSize: '1.2rem',
                    color: theme.color
                  }} 
                />
                <h3 style={{ margin: 0, color: theme.color }}>
                  {currentConversation === 'chatbot' ? 'Chatbot' : getParticipantName({ id: currentConversation })}
                </h3>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
                  <span style={{ color: typing ? styles.primaryColor : theme.color }}>
                    {typing ? 'Typing...' : onlineUsers.has(currentConversation) ? 'Online' : 'Offline'}
                  </span>

                  {/* Close button: hides the opened message box */}
                  <button
                    onClick={handleClose}
                    aria-label="Close chat"
                    style={{
                      cursor: 'pointer',
                      fontSize: '1.2rem',
                      padding: '6px',
                      borderRadius: '6px',
                      border: 'none',
                      background: 'transparent',
                      color: theme.color,
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.target.style.backgroundColor = 'rgba(0,0,0,0.1)'; }}
                    onMouseLeave={(e) => { e.target.style.backgroundColor = 'transparent'; }}
                  >
                    <FiX />
                  </button>
                </div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: styles.padding }}>
                {incomingCall && (
                  <div style={{ textAlign: 'center', marginBottom: styles.margin }}>
                    <p>Incoming {incomingCall.video ? 'Video' : 'Voice'} Call from {incomingCall.from}</p>
                    <button onClick={acceptCall} style={styles.buttonStyle}>Accept</button>
                    <button onClick={declineCall} style={{ ...styles.buttonStyle, background: 'red' }}>Decline</button>
                  </div>
                )}
                {callActive && (
                  <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: styles.margin }}>
                    <video autoPlay playsInline muted style={{ width: '45%', borderRadius: styles.borderRadius }} ref={(ref) => ref && (ref.srcObject = localStream)} />
                    <video autoPlay playsInline style={{ width: '45%', borderRadius: styles.borderRadius }} ref={(ref) => ref && (ref.srcObject = remoteStream)} />
                    <button onClick={endCall} style={{ ...styles.buttonStyle, background: 'red' }}>End Call</button>
                  </div>
                )}
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search messages..." style={{ width: '100%', marginBottom: styles.margin }} />
                {(searchQuery ? filteredMessages : messages).map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: '0.5rem',
                      textAlign: msg.senderId === user._id ? 'right' : 'left',
                      position: 'relative',
                    }}
                    onClick={() => setShowReactions(showReactions === msg._id ? null : msg._id)}
                  >
                    {msg.replyTo && <p style={{ fontStyle: 'italic', color: styles.secondaryColor }}>Replying to: {msg.replyTo.content}</p>}
                    {/* Bot messages have a distinct label */}
                    {msg.senderId === 'bot' && <div style={{ fontSize: '0.85rem', color: styles.primaryColor, marginBottom: '4px' }}>Bot</div>}
                    {msg.type === 'image' ? <img src={msg.content} alt="Attachment" style={{ maxWidth: '200px' }} /> : <p style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</p>}
                    <div style={{ display: 'flex', gap: '0.2rem' }}>
                      {Object.entries(msg.reactions || {}).map(([emoji, users]) => (
                        <span key={emoji}>{emoji} {users.length}</span>
                      ))}
                    </div>
                        {showReactions === msg._id && (
                          <div style={{ position: 'absolute', zIndex: 10 }}>
                            <EmojiPicker onSelect={(emoji) => addReaction(msg._id, emoji)} />
                          </div>
                        )}
                    <button onClick={() => setReplyTo(msg)}>Reply</button>
                    {/* Forward button */}
                  </div>
                ))}
                {typing && <p>Typing...</p>}
                <div ref={messagesEndRef} />
              </div>
              {replyTo && (
                <div style={{ padding: styles.padding, background: '#f0f0f0', display: 'flex', alignItems: 'center' }}>
                  <p>Replying to: {replyTo.content}</p>
                  <FiX onClick={() => setReplyTo(null)} style={{ cursor: 'pointer', marginLeft: 'auto' }} />
                </div>
              )}
              <div style={{ display: 'flex', padding: styles.padding, borderTop: '1px solid #ddd' }}>
                <input
                  value={input}
                  onChange={handleTyping}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: styles.borderRadius }}
                />
                <label htmlFor="file-upload">
                  <FiPaperclip style={{ cursor: 'pointer' }} />
                </label>
                <input id="file-upload" type="file" style={{ display: 'none' }} onChange={(e) => setSelectedFile(e.target.files[0])} />
                <button onClick={() => setShowEmoji(!showEmoji)} style={styles.buttonStyle}>
                  <FiSmile />
                </button>
                {showEmoji && <div style={{ position: 'absolute', bottom: '70px', right: '20px', zIndex: 1001 }}><EmojiPicker onSelect={(emoji) => setInput((prev) => prev + emoji)} /></div>}
                <button onClick={currentConversation === 'chatbot' ? sendToChatbot : sendMessage} style={styles.buttonStyle}>
                  <FiSend />
                </button>
                <button onClick={() => initiateCall(false)} style={styles.buttonStyle}>
                  <FiPhone />
                </button>
                <button onClick={() => initiateCall(true)} style={styles.buttonStyle}>
                  <FiVideo />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default ChatWidget;