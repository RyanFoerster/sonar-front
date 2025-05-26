import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { AuthService } from '../shared/services/auth.service';

export interface ChatMessage {
  id: string;
  eventId: string;
  senderId: number;
  senderName: string;
  senderEmail: string;
  content: string;
  createdAt: Date;
}

export interface UserTyping {
  userId: number;
  userName: string;
  eventId: string;
}

export interface ChatPaginationState {
  messages: ChatMessage[];
  currentPage: number;
  totalMessages: number;
  hasMoreMessages: boolean;
  loading: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EventChatService {
  private socket: Socket;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private currentEventId: string | null = null;

  // Nouveaux sujets pour gérer les indicateurs de frappe
  private typingUsersSubject = new BehaviorSubject<UserTyping[]>([]);
  public typingUsers$ = this.typingUsersSubject.asObservable();

  // Nouvel état pour la pagination
  private paginationState: ChatPaginationState = {
    messages: [],
    currentPage: 1,
    totalMessages: 0,
    hasMoreMessages: false,
    loading: false,
  };

  private paginationStateSubject = new BehaviorSubject<ChatPaginationState>(
    this.paginationState
  );
  public paginationState$ = this.paginationStateSubject.asObservable();

  constructor(private authService: AuthService) {
    // Initialiser la connexion Socket.io
    this.socket = io(`${environment.API_URL}/event-chat`, {
      autoConnect: false,
      transports: ['websocket'],
    });

    // Écouteur pour les nouveaux messages
    this.socket.on('newChatMessage', (message: ChatMessage) => {
      // Ne traiter que les messages de l'événement actuel
      if (this.currentEventId && message.eventId === this.currentEventId) {
        // Ajouter le nouveau message à l'état de pagination
        const currentState = this.paginationStateSubject.getValue();
        const updatedMessages = [...currentState.messages, message];

        this.paginationState = {
          ...currentState,
          messages: updatedMessages,
          totalMessages: currentState.totalMessages + 1,
        };

        this.paginationStateSubject.next(this.paginationState);
        this.messagesSubject.next(updatedMessages);

        // Supprimer l'utilisateur des personnes en train d'écrire
        this.removeUserTyping(message.senderId);
      }
    });

    // Écouteur pour les indicateurs de frappe
    this.socket.on('userTyping', (typingInfo: UserTyping) => {
      if (this.currentEventId && typingInfo.eventId === this.currentEventId) {
        const currentTypingUsers = this.typingUsersSubject.getValue();
        // Vérifier si l'utilisateur n'est pas déjà dans la liste
        if (
          !currentTypingUsers.some((user) => user.userId === typingInfo.userId)
        ) {
          this.typingUsersSubject.next([...currentTypingUsers, typingInfo]);
        }
      }
    });

    // Écouteur pour les arrêts de frappe
    this.socket.on(
      'userStoppedTyping',
      (typingInfo: { userId: number; eventId: string }) => {
        if (this.currentEventId && typingInfo.eventId === this.currentEventId) {
          this.removeUserTyping(typingInfo.userId);
        }
      }
    );

    // Écouteur pour les erreurs
    this.socket.on('error', (error: Error) => {
      console.error('Erreur Socket.io:', error);
    });
  }

  // Se connecter au serveur WebSocket
  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  // Se déconnecter du serveur WebSocket
  disconnect(): void {
    if (this.socket.connected) {
      if (this.currentEventId) {
        this.leaveEventRoom(this.currentEventId);
      }
      this.socket.disconnect();
    }
  }

  // Rejoindre la room d'un événement
  joinEventRoom(eventId: string): void {
    this.connect();
    this.currentEventId = eventId;
    this.socket.emit(
      'joinEventRoom',
      eventId,
      (response: { event: string; room: string }) => {
        console.log('Rejoindre la room:', response);
      }
    );
    // Charger l'historique des messages
    this.getChatHistory(eventId);
  }

  // Quitter la room d'un événement
  leaveEventRoom(eventId: string): void {
    this.socket.emit(
      'leaveEventRoom',
      eventId,
      (response: { event: string; room: string }) => {
        console.log('Quitter la room:', response);
      }
    );
    this.currentEventId = null;
    this.messagesSubject.next([]);
    this.typingUsersSubject.next([]);

    // Réinitialiser l'état de pagination
    this.paginationState = {
      messages: [],
      currentPage: 1,
      totalMessages: 0,
      hasMoreMessages: false,
      loading: false,
    };
    this.paginationStateSubject.next(this.paginationState);
  }

  // Récupérer l'historique des messages avec pagination
  getChatHistory(eventId: string, page = 1, limit = 10): void {
    if (page === 1) {
      // Si c'est la première page, réinitialiser l'état
      this.paginationState = {
        ...this.paginationState,
        messages: [],
        currentPage: 1,
        loading: true,
      };
      this.paginationStateSubject.next(this.paginationState);
    } else {
      // Sinon, marquer le chargement pour les pages suivantes
      this.paginationState = {
        ...this.paginationState,
        loading: true,
      };
      this.paginationStateSubject.next(this.paginationState);
    }

    this.socket.emit(
      'getChatHistory',
      { eventId, page, limit },
      (response: {
        success: boolean;
        messages?: ChatMessage[];
        total?: number;
        hasMore?: boolean;
        error?: string;
      }) => {
        if (response.success && response.messages) {
          const currentState = this.paginationStateSubject.getValue();

          // Si c'est la première page, remplacer les messages
          // Sinon, ajouter les nouveaux messages au début (chargement vers le haut)
          const updatedMessages =
            page === 1
              ? response.messages
              : [...response.messages, ...currentState.messages];

          this.paginationState = {
            messages: updatedMessages,
            currentPage: page,
            totalMessages: response.total || 0,
            hasMoreMessages: response.hasMore || false,
            loading: false,
          };

          this.paginationStateSubject.next(this.paginationState);
          this.messagesSubject.next(updatedMessages);
        } else {
          console.error(
            "Erreur lors du chargement de l'historique du chat:",
            response.error
          );
          // Mettre fin au chargement même en cas d'erreur
          const currentState = this.paginationStateSubject.getValue();
          this.paginationState = {
            ...currentState,
            loading: false,
          };
          this.paginationStateSubject.next(this.paginationState);
        }
      }
    );
  }

  // Charger plus de messages (page précédente)
  loadMoreMessages(): void {
    if (!this.currentEventId) return;

    const currentState = this.paginationStateSubject.getValue();
    if (currentState.hasMoreMessages && !currentState.loading) {
      const nextPage = currentState.currentPage + 1;
      this.getChatHistory(this.currentEventId, nextPage);
    }
  }

  // Envoyer un message
  sendMessage(content: string): void {
    if (!this.currentEventId) {
      console.error('Aucun événement sélectionné');
      return;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser) {
      console.error('Utilisateur non connecté');
      return;
    }

    const message = {
      eventId: this.currentEventId,
      senderId: currentUser.id,
      senderName: `${currentUser.firstName} ${currentUser.name}`,
      senderEmail: currentUser.email,
      content,
    };

    this.socket.emit(
      'chatMessage',
      message,
      (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          console.error("Erreur lors de l'envoi du message:", response.error);
        }
      }
    );

    // Indiquer que l'utilisateur a arrêté d'écrire après envoi
    this.sendTypingStatus(false);
  }

  // Méthode pour envoyer l'état de frappe
  sendTypingStatus(isTyping: boolean): void {
    if (!this.currentEventId) {
      return;
    }

    const currentUser = this.authService.getUser();
    if (!currentUser) {
      return;
    }

    if (isTyping) {
      const typingInfo: UserTyping = {
        userId: currentUser.id,
        userName: `${currentUser.firstName} ${currentUser.name}`,
        eventId: this.currentEventId,
      };

      this.socket.emit('userTyping', typingInfo);
    } else {
      this.socket.emit('userStoppedTyping', {
        userId: currentUser.id,
        eventId: this.currentEventId,
      });

      // Aussi supprimer localement l'utilisateur de la liste des personnes qui écrivent
      this.removeUserTyping(currentUser.id);
    }
  }

  // Méthode privée pour supprimer un utilisateur de la liste des personnes qui écrivent
  private removeUserTyping(userId: number): void {
    const currentTypingUsers = this.typingUsersSubject.getValue();
    const filteredUsers = currentTypingUsers.filter(
      (user) => user.userId !== userId
    );
    if (currentTypingUsers.length !== filteredUsers.length) {
      this.typingUsersSubject.next(filteredUsers);
    }
  }
}
