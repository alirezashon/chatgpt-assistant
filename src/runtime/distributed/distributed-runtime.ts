import { DistributedEventBus } from './event-bus';
import { DistributedScheduler, JobRuntime } from './job-runtime';
import { RealtimeHub } from './realtime-hub';
import { MemoryDistributedStateStore } from './state-store';

/** Platform nervous-system runtime facade. */
export class DistributedRuntime {
  public readonly events: DistributedEventBus;
  public readonly jobs: JobRuntime;
  public readonly realtime: RealtimeHub;
  public readonly scheduler: DistributedScheduler;
  public readonly state: MemoryDistributedStateStore;

  public constructor() {
    this.state = new MemoryDistributedStateStore();
    this.events = new DistributedEventBus();
    this.jobs = new JobRuntime(this.state);
    this.scheduler = new DistributedScheduler(this.jobs);
    this.realtime = new RealtimeHub();
  }
}
