import { User, Conversation, Message } from '../types';

export const INITIAL_CURRENT_USER: User = {
  id: 'usr_me',
  username: 'roman_v',
  name: 'Roman Vanyn',
  avatar: '',
  bio: 'Product architect & interface designer. Building Vesper.',
  online: true,
  statusMessage: 'Deep in flow state ✦',
  isContact: false,
  phone: '+1 (555) 019-2834',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_elena',
    username: 'elena_v',
    name: 'Elena Rostova',
    avatar: '',
    bio: 'Lead Interface Designer. Obsessed with micro-interactions & typography.',
    online: true,
    statusMessage: 'Refining new canvas layout ✨',
    isContact: true,
    phone: '+1 (555) 482-1920',
  },
  {
    id: 'usr_marcus',
    username: 'm_thorne',
    name: 'Marcus Thorne',
    avatar: '',
    bio: 'Distributed systems & WebSockets engineer. Audio synth geek.',
    online: true,
    statusMessage: 'Compiling core binary ⚡',
    isContact: true,
    phone: '+1 (555) 391-7724',
  },
  {
    id: 'usr_sofia',
    username: 'sofia_chen',
    name: 'Sofia Chen',
    avatar: '',
    bio: 'Product Director. Keeping the scope tight and craftsmanship high.',
    online: false,
    lastSeen: '14 min ago',
    statusMessage: 'Reviewing quarterly specs',
    isContact: true,
    phone: '+1 (555) 732-9011',
  },
  {
    id: 'usr_alex',
    username: 'arivera',
    name: 'Alex Rivera',
    avatar: '',
    bio: 'Creative Technologist. Shaders, 3D typography & generative experiments.',
    online: true,
    statusMessage: 'Testing WebGPU canvas',
    isContact: true,
    phone: '+1 (555) 883-4921',
  },
  {
    id: 'usr_nora',
    username: 'norawest',
    name: 'Nora West',
    avatar: '',
    bio: 'Brand & Editorial stylist. Type foundry enthusiast.',
    online: false,
    lastSeen: '2 hours ago',
    statusMessage: 'Offline until Tokyo time',
    isContact: false,
    phone: '+1 (555) 604-3388',
  },
  {
    id: 'usr_liam',
    username: 'lmiller',
    name: 'Liam Miller',
    avatar: '',
    bio: 'Infrastructure & SecOps. Keeping messages sealed and tamper-proof.',
    online: false,
    lastSeen: 'Yesterday',
    statusMessage: 'Auditing cryptographic hashes',
    isContact: false,
    phone: '+1 (555) 219-5830',
  }
];

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_elena',
    type: 'direct',
    participantIds: ['usr_me', 'usr_elena'],
    participants: [],
    updatedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(), // 3 mins ago
    unreadCount: 1,
    isPinned: true,
    pinnedMessageId: 'msg_elena_pinned',
  },
  {
    id: 'conv_group_protocol',
    type: 'group',
    name: 'Core Architecture Guild',
    description: 'Internal engineering guild for protocol contracts, client reactivity and zero-latency UX.',
    avatar: '',
    participantIds: ['usr_me', 'usr_elena', 'usr_marcus', 'usr_sofia'],
    participants: [],
    updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    unreadCount: 0,
    isPinned: true,
    createdBy: 'usr_marcus',
  },
  {
    id: 'conv_marcus',
    type: 'direct',
    participantIds: ['usr_me', 'usr_marcus'],
    participants: [],
    updatedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    unreadCount: 0,
    isPinned: false,
  },
  {
    id: 'conv_sofia',
    type: 'direct',
    participantIds: ['usr_me', 'usr_sofia'],
    participants: [],
    updatedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    unreadCount: 0,
    isPinned: false,
  },
  {
    id: 'conv_alex',
    type: 'direct',
    participantIds: ['usr_me', 'usr_alex'],
    participants: [],
    updatedAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
    unreadCount: 0,
    isPinned: false,
  }
];

export const INITIAL_MESSAGES: Record<string, Message[]> = {
  conv_elena: [
    {
      id: 'msg_elena_1',
      conversationId: 'conv_elena',
      senderId: 'usr_elena',
      text: 'Hey Roman! I just finished the editorial typography audit for the messenger surfaces.',
      createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      readBy: ['usr_me', 'usr_elena'],
      reactions: [{ emoji: '✨', userIds: ['usr_me'] }],
      status: 'read',
    },
    {
      id: 'msg_elena_pinned',
      conversationId: 'conv_elena',
      senderId: 'usr_elena',
      text: 'The core rule: "Less decoration, more character." We stripped away 100% of artificial drop shadows and purple gradients. The graphite contrast ratio is sitting at a crisp 11.2:1.',
      createdAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
      readBy: ['usr_me', 'usr_elena'],
      reactions: [{ emoji: '🔥', userIds: ['usr_me', 'usr_elena'] }],
      status: 'read',
      isPinned: true,
    },
    {
      id: 'msg_elena_2',
      conversationId: 'conv_elena',
      senderId: 'usr_me',
      text: 'Spot on Elena. Take a look at the attached visual study for our dark elevation scale:',
      attachments: [
        {
          id: 'att_doc_1',
          type: 'file',
          url: '#',
          name: 'vesper-charcoal-spec.pdf',
          size: '1.8 MB',
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      readBy: ['usr_elena'],
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg_elena_3',
      conversationId: 'conv_elena',
      senderId: 'usr_me',
      text: 'Also added the interactive command menu (Cmd+K) and full keyboard navigation for chats.',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      readBy: ['usr_elena'],
      reactions: [{ emoji: '⚡', userIds: ['usr_elena'] }],
      status: 'read',
    },
    {
      id: 'msg_elena_4',
      conversationId: 'conv_elena',
      senderId: 'usr_elena',
      text: 'Incredible execution. The spring micro-interactions feel like an actual tactile Swiss watch. Check the latest design guidelines token export whenever you have a minute!',
      attachments: [
        {
          id: 'att_file_tokens',
          type: 'file',
          url: '#',
          name: 'vesper_design_tokens_v2.json',
          size: '42 KB',
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      readBy: [],
      reactions: [],
      status: 'delivered',
    }
  ],
  conv_group_protocol: [
    {
      id: 'msg_grp_1',
      conversationId: 'conv_group_protocol',
      senderId: 'usr_marcus',
      text: 'Benchmarked the WebSocket dispatcher yesterday: average round-trip latency is 18ms on edge nodes.',
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      readBy: ['usr_me', 'usr_marcus', 'usr_sofia'],
      reactions: [{ emoji: '🚀', userIds: ['usr_sofia', 'usr_me'] }],
      status: 'read',
    },
    {
      id: 'msg_grp_2',
      conversationId: 'conv_group_protocol',
      senderId: 'usr_sofia',
      text: 'Remember we need optimistic UI updates on the client so sending never feels blocked, even in spotty tunnel connections.',
      replyTo: {
        id: 'msg_grp_1',
        senderName: 'Marcus Thorne',
        text: 'Benchmarked the WebSocket dispatcher yesterday: average round-trip latency is 18ms...',
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      readBy: ['usr_me'],
      reactions: [{ emoji: '👍', userIds: ['usr_marcus'] }],
      status: 'read',
    },
    {
      id: 'msg_grp_3',
      conversationId: 'conv_group_protocol',
      senderId: 'usr_me',
      text: 'Optimistic queue is fully wired up! Immediate visual dispatch, background sync, and discrete audio acknowledgment.',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      readBy: ['usr_marcus'],
      reactions: [{ emoji: '🙌', userIds: ['usr_marcus', 'usr_sofia'] }],
      status: 'read',
    }
  ],
  conv_marcus: [
    {
      id: 'msg_m_1',
      conversationId: 'conv_marcus',
      senderId: 'usr_marcus',
      text: 'Roman, do you want me to tune the Web Audio synthesized pops? Made sure they only trigger if user has sound turned on.',
      createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      readBy: ['usr_me'],
      reactions: [],
      status: 'read',
    },
    {
      id: 'msg_m_2',
      conversationId: 'conv_marcus',
      senderId: 'usr_me',
      text: 'The 420Hz to 780Hz sine sweep sounds exceptionally satisfying. Keep it subtle!',
      createdAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
      readBy: ['usr_marcus'],
      reactions: [{ emoji: '🎯', userIds: ['usr_marcus'] }],
      status: 'read',
    }
  ],
  conv_sofia: [
    {
      id: 'msg_s_1',
      conversationId: 'conv_sofia',
      senderId: 'usr_sofia',
      text: 'Great work on the desktop and mobile responsive layout transitions. The right sidebar collapses neatly.',
      createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      readBy: ['usr_me'],
      reactions: [{ emoji: '❤️', userIds: ['usr_me'] }],
      status: 'read',
    }
  ],
  conv_alex: [
    {
      id: 'msg_a_1',
      conversationId: 'conv_alex',
      senderId: 'usr_alex',
      text: 'Sending over the brand visual monograph specification for reference:',
      attachments: [
        {
          id: 'att_doc_monograph',
          type: 'file',
          url: '#',
          name: 'monograph_specs.pdf',
          size: '3.4 MB',
        }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 1440).toISOString(),
      readBy: ['usr_me'],
      reactions: [],
      status: 'read',
    }
  ]
};
