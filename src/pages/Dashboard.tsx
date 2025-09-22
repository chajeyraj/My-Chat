import React, { useState, useEffect, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Send, Search, Settings, User, MessageSquare, Edit2, Trash2, X, Menu, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  display_name?: string;
  country?: string;
  phone_number?: string;
  profile_picture?: string;
  profession?: string;
  status?: string;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  message_text: string;
  is_deleted: boolean;
  edited_at?: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [activeChat, setActiveChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [recentChats, setRecentChats] = useState<User[]>([]);
  const [showProfile, setShowProfile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Common emojis for quick access
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😊', '😍', '🤩', '😘', '😗', '☺️',
    '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤔', '🤐', '🤨',
    '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔',
    '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵',
    '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕',
    '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧',
    '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓',
    '😩', '😫', '🥱', '😤', '😡', '🤬', '😠', '🤯', '😈', '👿',
    '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖',
    '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
    '👈', '👉', '👆', '🖕', '👇', '☝️', '👏', '🙌', '👐', '🤲',
    '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  // Redirect if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const fetchRecentChats = async () => {
    if (!user) return;

    // Get unique conversations from messages
    const { data: conversationData, error } = await supabase
      .from('messages')
      .select(`
        sender_id,
        receiver_id,
        created_at,
        users!messages_sender_id_fkey(id, email, display_name, profile_picture, profession),
        receiver:users!messages_receiver_id_fkey(id, email, display_name, profile_picture, profession)
      `)
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent chats:', error);
      return;
    }

    // Extract unique users (excluding current user)
    const uniqueUsers = new Map<string, User>();
    
    conversationData?.forEach((msg: any) => {
      const otherUser = msg.sender_id === user.id ? msg.receiver : msg.users;
      if (otherUser && otherUser.id !== user.id) {
        uniqueUsers.set(otherUser.id, otherUser);
      }
    });

    setRecentChats(Array.from(uniqueUsers.values()));
  };

  // Fetch recent chats on component mount
  useEffect(() => {
    if (user) {
      fetchRecentChats();
    }
  }, [user]);

  // Real-time subscription for messages
  useEffect(() => {
    if (!activeChat || !user) return;

    console.log('Setting up realtime subscription for:', { activeChat: activeChat.id, user: user.id });
    
    const channel = supabase
      .channel(`messages-${activeChat.id}-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const row = payload.new as Message;
          if (
            (row.sender_id === user.id && row.receiver_id === activeChat.id) ||
            (row.sender_id === activeChat.id && row.receiver_id === user.id)
          ) {
            console.log('Realtime INSERT received for active chat:', row);
            setMessages((prev) => [...prev, row]);
            fetchRecentChats();
            scrollToBottom();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const row = payload.new as Message;
          if (
            (row.sender_id === user.id && row.receiver_id === activeChat.id) ||
            (row.sender_id === activeChat.id && row.receiver_id === user.id)
          ) {
            console.log('Realtime UPDATE received for active chat:', row);
            setMessages((prev) => prev.map((m) => (m.id === row.id ? row : m)));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const oldRow = payload.old as Message;
          console.log('Realtime DELETE received:', oldRow);
          setMessages((prev) => prev.filter((m) => m.id !== oldRow.id));
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Removing realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [activeChat, user]);

  const fetchMessages = async () => {
    if (!activeChat || !user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch messages"
      });
      return;
    }

    setMessages(data || []);
  };

  const searchUser = async () => {
    if (!searchEmail.trim()) return;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.eq.${searchEmail},display_name.ilike.%${searchEmail}%`)
      .single();

    if (error || !data) {
      setSearchResult(null);
      toast({
        title: "User not found",
        description: "No user found with that email or display name"
      });
      return;
    }

    setSearchResult(data);
  };

  const startChat = (chatUser: User) => {
    setActiveChat(chatUser);
    setSearchResult(null);
    setSearchEmail('');
    fetchMessages();
    fetchRecentChats(); // Refresh recent chats when starting a new conversation
  };

  const sendMessage = async () => {
    console.log('sendMessage called', { newMessage, activeChat, user });
    if (!newMessage.trim() || !activeChat || !user) {
      console.log('sendMessage early return', { 
        hasMessage: !!newMessage.trim(), 
        hasActiveChat: !!activeChat, 
        hasUser: !!user 
      });
      return;
    }

    console.log('Sending message to Supabase...');
    const { error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: activeChat.id,
        message_text: newMessage.trim()
      });

    if (error) {
      console.error('Message send error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send message"
      });
      return;
    }

    console.log('Message sent successfully');
    setNewMessage('');
    fetchMessages(); // Immediately show the sent message
    fetchRecentChats(); // Refresh recent chats after sending a message
  };

  const editMessage = async (messageId: string) => {
    if (!editText.trim()) return;

    const { error } = await supabase
      .from('messages')
      .update({
        message_text: editText.trim(),
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to edit message"
      });
      return;
    }

    setEditingMessage(null);
    setEditText('');
  };

  const deleteMessage = async (messageId: string, isHardDelete = false) => {
    if (isHardDelete) {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to unsend message"
        });
      }
    } else {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete message"
        });
      }
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Overlay */}
      {showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setShowSidebar(false)}
        />
      )}

      {/* Left Sidebar */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
        fixed left-0 top-0 z-50 w-80 h-full transition-transform duration-300 ease-in-out
        md:translate-x-0 md:relative md:z-auto
        border-r border-border bg-card
      `}>
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">MyTolk</h1>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                className="md:hidden"
                onClick={() => setShowSidebar(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card border border-border z-50">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* User Search */}
        <div className="p-4 space-y-3">
          <div className="flex space-x-2">
            <Input
              placeholder="Search by email or name"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && searchUser()}
            />
            <Button onClick={searchUser} size="sm">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {searchResult && (
            <Card className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={searchResult.profile_picture || ''} />
                    <AvatarFallback>
                      {searchResult.display_name?.[0] || searchResult.email[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{searchResult.display_name || searchResult.email}</p>
                    <p className="text-sm text-muted-foreground">{searchResult.profession}</p>
                  </div>
                </div>
                <Button onClick={() => startChat(searchResult)} size="sm">
                  Chat
                </Button>
              </div>
            </Card>
          )}
        </div>

        <Separator />

        {/* Chat List */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Recent Chats</h3>
          {recentChats.length > 0 ? (
            <div className="space-y-2">
              {recentChats.map((chat) => (
                <Card 
                  key={chat.id}
                  className={`p-3 cursor-pointer hover:bg-accent/50 ${
                    activeChat?.id === chat.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => startChat(chat)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={chat.profile_picture || ''} />
                      <AvatarFallback>
                        {chat.display_name?.[0] || chat.email[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{chat.display_name || chat.email}</p>
                      <p className="text-sm text-muted-foreground">{chat.profession}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No recent conversations</p>
          )}
        </div>
      </div>

      {/* Right Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header - only visible on mobile */}
        <div className="md:hidden p-4 border-b border-border bg-card flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSidebar(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">
            {activeChat ? (activeChat.display_name || activeChat.email) : 'MyTolk'}
          </h1>
          <div className="w-8" /> {/* Spacer for balance */}
        </div>

        {activeChat ? (
          <>
            {/* Chat Header - hidden on mobile when there's a mobile header */}
            <div className="hidden md:block p-4 border-b border-border bg-card">
              <div 
                className="flex items-center space-x-3 cursor-pointer hover:bg-accent/50 p-2 rounded-lg"
                onClick={() => setShowProfile(true)}
              >
                <Avatar>
                  <AvatarImage src={activeChat.profile_picture || ''} />
                  <AvatarFallback>
                    {activeChat.display_name?.[0] || activeChat.email[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">{activeChat.display_name || activeChat.email}</h2>
                  <p className="text-sm text-muted-foreground">
                    {activeChat.status === 'online' ? '🟢 Online' : '🔴 Offline'}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Modal */}
            {showProfile && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="w-full max-w-sm md:max-w-md mx-4">
                  <div className="p-4 md:p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Profile Details</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProfile(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-3 md:space-y-4">
                      <Avatar className="w-16 h-16 md:w-20 md:h-20">
                        <AvatarImage src={activeChat.profile_picture || ''} />
                        <AvatarFallback className="text-xl md:text-2xl">
                          {activeChat.display_name?.[0] || activeChat.email[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="text-center space-y-2 w-full">
                        <h4 className="text-lg md:text-xl font-medium break-words">
                          {activeChat.display_name || 'No name provided'}
                        </h4>
                        <p className="text-muted-foreground text-sm break-all">{activeChat.email}</p>
                        {activeChat.profession && (
                          <p className="text-sm bg-accent px-3 py-1 rounded-full inline-block">
                            {activeChat.profession}
                          </p>
                        )}
                        {activeChat.country && (
                          <p className="text-sm text-muted-foreground">
                            📍 {activeChat.country}
                          </p>
                        )}
                        {activeChat.phone_number && (
                          <p className="text-sm text-muted-foreground break-all">
                            📞 {activeChat.phone_number}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-end gap-2 ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Avatar for received messages */}
                  {message.sender_id !== user?.id && (
                    <Avatar className="w-8 h-8 mb-1">
                      <AvatarImage src={activeChat?.profile_picture || ''} />
                      <AvatarFallback className="text-xs">
                        {activeChat?.display_name?.[0] || activeChat?.email[0]}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`group relative max-w-[80%] sm:max-w-sm lg:max-w-md`}>
                    {editingMessage === message.id ? (
                      <div className={`rounded-2xl p-4 shadow-sm border ${
                        message.sender_id === user?.id
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-secondary/50 border-border'
                      }`}>
                        <div className="space-y-3">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && editMessage(message.id)}
                            className="border-0 bg-background/50 focus:bg-background"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => editMessage(message.id)} className="h-8 px-3">
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingMessage(null)}
                              className="h-8 px-3"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className={`rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 ${
                            message.sender_id === user?.id
                              ? 'bg-primary text-primary-foreground ml-auto rounded-br-md'
                              : 'bg-card border border-border rounded-bl-md'
                          } ${message.is_deleted ? 'opacity-70' : 'hover:shadow-md'}`}
                        >
                          <p className={`text-sm leading-relaxed break-words ${
                            message.is_deleted ? 'italic text-muted-foreground' : ''
                          }`}>
                            {message.is_deleted ? 'This message was deleted' : message.message_text}
                          </p>
                          
                          <div className="flex items-center justify-between mt-2 gap-2">
                            <p className={`text-xs ${
                              message.sender_id === user?.id 
                                ? 'text-primary-foreground/70' 
                                : 'text-muted-foreground'
                            }`}>
                              {formatTime(message.created_at)}
                              {message.edited_at && ' (edited)'}
                            </p>
                          </div>
                        </div>
                        
                        {/* Action buttons - show on hover for sent messages */}
                        {message.sender_id === user?.id && !message.is_deleted && (
                          <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 justify-end">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingMessage(message.id);
                                setEditText(message.message_text);
                              }}
                              className="h-7 w-7 p-0 hover:bg-primary/10"
                              title="Edit message"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMessage(message.id, false)}
                              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                              title="Delete message"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMessage(message.id, true)}
                              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                              title="Unsend message"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  {/* Avatar for sent messages */}
                  {message.sender_id === user?.id && (
                    <Avatar className="w-8 h-8 mb-1">
                      <AvatarImage src={user.user_metadata?.avatar_url || ''} />
                      <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                        {user.user_metadata?.display_name?.[0] || user.email?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 md:p-6 border-t border-border bg-card/50 backdrop-blur-sm">
              <div className="flex items-end gap-3 max-w-4xl mx-auto">
                <div className="flex-1 relative">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    className="min-h-[44px] pr-12 rounded-xl border-border/50 bg-background/50 focus:bg-background focus:border-primary/50 resize-none"
                    disabled={!activeChat}
                  />
                </div>
                
                {/* Emoji Picker */}
                <Popover open={emojiPickerOpen} onOpenChange={setEmojiPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-[44px] px-3 rounded-xl hover:bg-muted"
                      disabled={!activeChat}
                    >
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="end">
                    <div className="grid grid-cols-10 gap-1 max-h-48 overflow-y-auto">
                      {commonEmojis.map((emoji, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setEmojiPickerOpen(false);
                          }}
                          className="text-lg hover:bg-muted rounded p-1 transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Button 
                  onClick={sendMessage} 
                  size="sm" 
                  className="h-[44px] px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200" 
                  disabled={!newMessage.trim() || !activeChat}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-base md:text-lg font-medium">Select a chat to start messaging</h3>
              <p className="text-sm text-muted-foreground">
                <span className="md:hidden">Tap the menu to search for users</span>
                <span className="hidden md:inline">Search for users to start a conversation</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}