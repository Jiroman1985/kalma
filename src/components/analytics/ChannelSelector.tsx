import React from 'react';
import { motion } from 'framer-motion';
import { 
  Instagram, 
  MessageSquare, 
  MessageSquareDashed, 
  Mail, 
  Globe,
  BarChart4
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Iconos personalizados
function TelegramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 2L11 13"></path>
      <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
    </svg>
  );
}

export type Channel = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  isConnected: boolean;
};

interface ChannelSelectorProps {
  channels: Channel[];
  selectedChannel: string;
  onSelectChannel: (channelId: string) => void;
}

const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  channels,
  selectedChannel,
  onSelectChannel
}) => {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <button
        onClick={() => onSelectChannel("all")}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
          selectedChannel === "all"
            ? "bg-gray-900 text-white shadow-lg scale-105"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        )}
      >
        <BarChart4 className="h-4 w-4" />
        <span>Todos los canales</span>
      </button>
      
      {channels.map((channel) => (
        <motion.button
          key={channel.id}
          onClick={() => onSelectChannel(channel.id)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
            selectedChannel === channel.id
              ? `${channel.color} text-white shadow-md scale-105`
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
            !channel.isConnected && "opacity-60"
          )}
          whileHover={{ scale: channel.isConnected ? 1.05 : 1 }}
          whileTap={{ scale: channel.isConnected ? 0.95 : 1 }}
          disabled={!channel.isConnected}
        >
          {channel.icon}
          <span>{channel.name}</span>
          {!channel.isConnected && (
            <span className="text-xs ml-1 opacity-80">(No conectado)</span>
          )}
        </motion.button>
      ))}
    </div>
  );
};

export default ChannelSelector; 