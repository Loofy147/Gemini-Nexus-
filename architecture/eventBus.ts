// architecture/eventBus.ts
type EventHandler = (event: AgentEvent) => void;

interface AgentEvent {
  type: 'TASK_COMPLETED' | 'TASK_FAILED' | 'KNOWLEDGE_DISCOVERED' | 'HELP_NEEDED';
  source: string;
  payload: any;
  timestamp: number;
}

class AgentEventBus {
  private listeners: { [key: string]: EventHandler[] } = {};

  publish(event: AgentEvent): void {
    const { type } = event;
    if (this.listeners[type]) {
      this.listeners[type].forEach(handler => handler(event));
    }
    this.persistEvent(event);
  }

  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(handler);
  }

  unsubscribe(eventType: string, handler: EventHandler): void {
    if (this.listeners[eventType]) {
      this.listeners[eventType] = this.listeners[eventType].filter(h => h !== handler);
    }
  }

  async replay(fromTimestamp: number): Promise<AgentEvent[]> {
    // Reconstruct system state from event log
    return this.getEventsAfter(fromTimestamp);
  }

  private async persistEvent(event: AgentEvent): Promise<void> {
    // Store in append-only log (Event Sourcing pattern)
    // Placeholder for actual event store implementation
    console.log('Persisting event:', event);
  }

  private async getEventsAfter(fromTimestamp: number): Promise<AgentEvent[]> {
    // Retrieve events from the event store
    // Placeholder for actual event store implementation
    console.log('Replaying events from timestamp:', fromTimestamp);
    return [];
  }
}

export { AgentEventBus };
