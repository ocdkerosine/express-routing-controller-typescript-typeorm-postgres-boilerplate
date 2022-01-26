import { Service } from 'typedi';
import { Server as IOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Logger, LoggerService } from '@utils/logger';

@Service()
export class SocketService {
  constructor(@Logger(__filename) private logger: LoggerService) {}

  private static io: IOServer;

  connect(server: HttpServer) {
    if (!SocketService.io) SocketService.io = new IOServer(server);
    SocketService.io.on('connection', socket => {
      this.logger.info(`Connected to socket ${socket.id}`);
      socket.on('disconnect', () => {
        this.logger.info(`Disconnected from socket ${socket.id}`);
      });
    });
    return SocketService.io;
  }

  emit(eventName: string, data: any) {
    if (!SocketService.io) return;
    SocketService.io.emit(eventName, data);
  }
}
