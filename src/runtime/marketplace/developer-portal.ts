import type {
  DeveloperAccount,
  DeveloperApiKey,
  DeveloperProfile,
  DeveloperProject,
} from './marketplace-types';

/** Developer portal account, profile, API key, and project manager. */
export class DeveloperPortal {
  private readonly apiKeys = new Map<string, DeveloperApiKey>();
  private readonly developers = new Map<string, DeveloperAccount>();
  private readonly profiles = new Map<string, DeveloperProfile>();
  private readonly projects = new Map<string, DeveloperProject>();

  /** Creates a developer account. */
  public createDeveloper(input: {
    readonly displayName: string;
    readonly email: string;
    readonly verified?: boolean;
  }): DeveloperAccount {
    const developer: DeveloperAccount = {
      createdAt: Date.now(),
      displayName: input.displayName,
      email: input.email.toLowerCase(),
      id: crypto.randomUUID(),
      verified: input.verified ?? false,
    };
    this.developers.set(developer.id, developer);
    this.profiles.set(developer.id, {
      badges: developer.verified ? ['verified-developer'] : [],
      bio: '',
      developerId: developer.id,
      followers: [],
    });
    return developer;
  }

  /** Updates profile. */
  public updateProfile(input: {
    readonly badges?: readonly string[];
    readonly bio?: string;
    readonly developerId: string;
    readonly website?: string;
  }): DeveloperProfile {
    const existing = this.requireProfile(input.developerId);
    const next: DeveloperProfile = {
      ...existing,
      ...(input.badges === undefined ? {} : { badges: input.badges }),
      ...(input.bio === undefined ? {} : { bio: input.bio }),
      ...(input.website === undefined ? {} : { website: input.website }),
    };
    this.profiles.set(next.developerId, next);
    return next;
  }

  /** Creates an API key metadata record. */
  public createApiKey(input: {
    readonly developerId: string;
    readonly name: string;
    readonly scopes: readonly string[];
  }): DeveloperApiKey {
    this.requireDeveloper(input.developerId);
    const key: DeveloperApiKey = {
      createdAt: Date.now(),
      developerId: input.developerId,
      id: crypto.randomUUID(),
      keyPrefix: `mk_${crypto.randomUUID().slice(0, 8)}`,
      name: input.name,
      scopes: input.scopes,
    };
    this.apiKeys.set(key.id, key);
    return key;
  }

  /** Revokes an API key. */
  public revokeApiKey(apiKeyId: string): DeveloperApiKey | undefined {
    const key = this.apiKeys.get(apiKeyId);

    if (key === undefined) {
      return undefined;
    }

    const next = { ...key, revokedAt: Date.now() };
    this.apiKeys.set(apiKeyId, next);
    return next;
  }

  /** Creates a developer project. */
  public createProject(input: {
    readonly description: string;
    readonly developerId: string;
    readonly name: string;
  }): DeveloperProject {
    this.requireDeveloper(input.developerId);
    const project: DeveloperProject = {
      createdAt: Date.now(),
      description: input.description,
      developerId: input.developerId,
      id: crypto.randomUUID(),
      name: input.name,
    };
    this.projects.set(project.id, project);
    return project;
  }

  /** Reads developer. */
  public requireDeveloper(developerId: string): DeveloperAccount {
    const developer = this.developers.get(developerId);

    if (developer === undefined) {
      throw new Error(`Developer not found: ${developerId}`);
    }

    return developer;
  }

  /** Reads project. */
  public requireProject(projectId: string): DeveloperProject {
    const project = this.projects.get(projectId);

    if (project === undefined) {
      throw new Error(`Developer project not found: ${projectId}`);
    }

    return project;
  }

  /** Reads profile. */
  public requireProfile(developerId: string): DeveloperProfile {
    const profile = this.profiles.get(developerId);

    if (profile === undefined) {
      throw new Error(`Developer profile not found: ${developerId}`);
    }

    return profile;
  }
}
