import type {
  DeveloperAccount,
  MarketplaceListing,
  MarketplaceSearchQuery,
  MarketplaceUserReview,
} from './marketplace-types';

/** Searchable marketplace catalog with trust ranking, discovery, ratings, and private listings. */
export class MarketplaceCatalog {
  private readonly listings = new Map<string, MarketplaceListing>();
  private readonly reviews: MarketplaceUserReview[] = [];

  /** Upserts a listing. */
  public upsert(listing: MarketplaceListing): void {
    this.listings.set(listing.applicationId, listing);
  }

  /** Reads listing. */
  public get(applicationId: string): MarketplaceListing | undefined {
    return this.listings.get(applicationId);
  }

  /** Searches listings. */
  public search(query: MarketplaceSearchQuery): readonly MarketplaceListing[] {
    const text = query.text?.toLowerCase();
    return [...this.listings.values()]
      .filter((listing) => query.type === undefined || listing.type === query.type)
      .filter((listing) => query.category === undefined || listing.category === query.category)
      .filter((listing) => isVisible(listing, query.organizationId, query.includePrivate ?? false))
      .filter(
        (listing) =>
          text === undefined ||
          `${listing.displayName} ${listing.summary} ${listing.packageName} ${listing.tags.join(' ')}`.toLowerCase().includes(text),
      )
      .sort((left, right) => right.trustScore - left.trustScore || right.installCount - left.installCount)
      .slice(0, query.limit ?? 20);
  }

  /** Adds user review and updates rating. */
  public addReview(input: Omit<MarketplaceUserReview, 'createdAt' | 'id'>): MarketplaceUserReview {
    const review: MarketplaceUserReview = {
      ...input,
      createdAt: Date.now(),
      id: crypto.randomUUID(),
    };
    this.reviews.push(review);
    const listing = this.listings.get(input.applicationId);

    if (listing !== undefined) {
      const reviews = this.reviews.filter((item) => item.applicationId === input.applicationId);
      const ratingAverage = reviews.reduce((sum, item) => sum + item.rating, 0) / reviews.length;
      this.listings.set(input.applicationId, {
        ...listing,
        ratingAverage,
        reviewCount: reviews.length,
        trustScore: computeTrustScore({
          developerVerified: true,
          installCount: listing.installCount,
          ratingAverage,
          reviewCount: reviews.length,
          securityScore: listing.securityScore,
        }),
      });
    }

    return review;
  }

  /** Returns trending listings. */
  public trending(organizationId?: string): readonly MarketplaceListing[] {
    return [
      ...this.search({
        includePrivate: true,
        limit: 10,
        ...(organizationId === undefined ? {} : { organizationId }),
      }),
    ].sort(
      (left, right) => right.installCount - left.installCount || right.ratingAverage - left.ratingAverage,
    );
  }
}

/** Computes trust ranking from identity, scan, popularity, and feedback. */
export function computeTrustScore(input: {
  readonly developerVerified: boolean;
  readonly installCount: number;
  readonly ratingAverage: number;
  readonly reviewCount: number;
  readonly securityScore: number;
}): number {
  const developer = input.developerVerified ? 15 : 0;
  const popularity = Math.min(20, Math.log10(input.installCount + 1) * 8);
  const feedback = input.reviewCount === 0 ? 0 : Math.min(20, input.ratingAverage * 4);
  return Math.round(Math.min(100, input.securityScore * 0.45 + developer + popularity + feedback));
}

export function createListing(input: {
  readonly applicationId: string;
  readonly approvedVersionId: string;
  readonly category: MarketplaceListing['category'];
  readonly developer: DeveloperAccount;
  readonly displayName: string;
  readonly distribution: MarketplaceListing['distribution'];
  readonly organizationId?: string;
  readonly packageName: string;
  readonly pricing: MarketplaceListing['pricing'];
  readonly securityScore: number;
  readonly summary: string;
  readonly tags?: readonly string[];
  readonly type: MarketplaceListing['type'];
}): MarketplaceListing {
  const trustScore = computeTrustScore({
    developerVerified: input.developer.verified,
    installCount: 0,
    ratingAverage: 0,
    reviewCount: 0,
    securityScore: input.securityScore,
  });

  return {
    applicationId: input.applicationId,
    approvedVersionId: input.approvedVersionId,
    category: input.category,
    developerId: input.developer.id,
    displayName: input.displayName,
    distribution: input.distribution,
    installCount: 0,
    packageName: input.packageName,
    pricing: input.pricing,
    ratingAverage: 0,
    reviewCount: 0,
    securityScore: input.securityScore,
    summary: input.summary,
    tags: input.tags ?? [],
    trustScore,
    type: input.type,
    updatedAt: Date.now(),
    ...(input.organizationId === undefined ? {} : { organizationId: input.organizationId }),
  };
}

function isVisible(
  listing: MarketplaceListing,
  organizationId: string | undefined,
  includePrivate: boolean,
): boolean {
  if (listing.distribution === 'public' || listing.distribution === 'unlisted') {
    return true;
  }

  return includePrivate && listing.organizationId !== undefined && listing.organizationId === organizationId;
}
