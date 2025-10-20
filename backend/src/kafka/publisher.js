export class KafkaPublisher {
  constructor() {
    this.enabled = process.env.KAFKA_BROKERS ? true : false;
    this.events = [];
  }

  async publishEvent(eventType, eventData) {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: new Date().toISOString()
    };

    console.log('[Kafka Event]', event);
    this.events.push(event);

    if (this.enabled) {
      console.log('[Kafka] Would publish to Kafka:', event);
    }

    return event;
  }

  async publishGameStarted(gameId, player1, player2) {
    return this.publishEvent('game_started', {
      gameId,
      player1,
      player2
    });
  }

  async publishMoveMade(gameId, player, column, row) {
    return this.publishEvent('move_made', {
      gameId,
      player,
      column,
      row
    });
  }

  async publishGameWon(gameId, winner, loser, duration) {
    return this.publishEvent('game_won', {
      gameId,
      winner,
      loser,
      duration
    });
  }

  async publishGameDrawn(gameId, player1, player2, duration) {
    return this.publishEvent('game_drawn', {
      gameId,
      player1,
      player2,
      duration
    });
  }

  async publishPlayerDisconnected(gameId, player) {
    return this.publishEvent('player_disconnected', {
      gameId,
      player
    });
  }

  getEvents() {
    return this.events;
  }
}

export const kafkaPublisher = new KafkaPublisher();
