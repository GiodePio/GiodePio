/**
 * Central configuration for Pro benefits.
 * When a user is granted Pro status, they automatically receive all these benefits.
 */

export function getProBenefits(isPro) {
  if (isPro) {
    return {
      hasUnlimitedGrabs: true,
      hasLiveCaptures: true,
      hasRemoteControl: true,
      hasProBadge: true,
      prioritySupport: true,
      // You can add more pro-exclusive feature flags here, and they will automatically evaluate to true for pro users!
      accessBetaFeatures: true,
      customProfileUrl: true,
    };
  }
  
  // Default for non-pro users
  return {
    hasUnlimitedGrabs: false,
    hasLiveCaptures: false,
    hasRemoteControl: false,
    hasProBadge: false,
    prioritySupport: false,
    accessBetaFeatures: false,
    customProfileUrl: false,
  };
}
