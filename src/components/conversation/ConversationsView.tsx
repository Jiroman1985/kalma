import React, { useState } from 'react';
import ConversationList from './ConversationList';
import ConversationPanel from './ConversationPanel';
import { Message } from '@/lib/messageService';

const ConversationsView: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Message | null>(null);

  return (
    <div className="flex h-full border rounded-lg overflow-hidden">
      {/* Lista de conversaciones (1/3 del ancho) */}
      <div className="w-1/3 border-r">
        <ConversationList 
          onSelectConversation={setSelectedConversation}
          selectedConversationId={selectedConversation?.threadId || selectedConversation?.id}
        />
      </div>
      
      {/* Panel de conversación (2/3 del ancho) */}
      <div className="w-2/3">
        <ConversationPanel conversation={selectedConversation} />
      </div>
    </div>
  );
};

export default ConversationsView; 