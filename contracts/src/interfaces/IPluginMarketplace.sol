// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title IPluginMarketplace
 * @notice Interface for the Plugin Marketplace - on-chain marketplace for AI Companion plugins
 */
interface IPluginMarketplace {
    // ============ Enums ============

    enum AccessType {
        PERMANENT,      // Buy once, own forever
        SUBSCRIPTION,   // Time-based access (monthly/yearly)
        USAGE_BASED     // Pay per inference/use
    }

    enum Category {
        KNOWLEDGE,      // Language Tutor, Research Assistant
        SKILLS,         // Code Assistant Pro, Math Solver
        PERSONALITY,    // Emotional Intelligence, Social Coach
        TOOLS,          // Health Coach, Productivity, Task Manager
        ENTERTAINMENT   // Games, Creative Writing, Storytelling
    }

    // ============ Structs ============

    struct Plugin {
        uint256 id;
        string name;
        string metadataURI;
        string wasmHash;
        address creator;
        Category category;
        uint256 currentVersion;
        uint256 createdAt;
        bool active;
        uint256 totalInstalls;
        uint256 totalRevenue;
        uint256 rating;
        uint256 ratingCount;
    }

    struct PluginVersion {
        uint256 version;
        string wasmHash;
        string changelog;
        uint256 releaseDate;
        bool deprecated;
    }

    struct PluginListing {
        uint256 pluginId;
        AccessType accessType;
        uint256 price;
        uint256 usageQuota;
        uint256 duration;
        uint256 trialDuration;
        bool active;
    }

    struct Installation {
        uint256 museId;
        uint256 pluginId;
        uint256 listingId;
        AccessType accessType;
        uint256 version;
        uint256 remainingQuota;
        uint256 expiresAt;
        uint256 trialEndsAt;
        uint256 installedAt;
        bool active;
    }

    // ============ Events ============

    event PluginRegistered(
        uint256 indexed pluginId,
        address indexed creator,
        string name,
        Category category
    );

    event ListingCreated(
        uint256 indexed pluginId,
        uint256 indexed listingId,
        AccessType accessType,
        uint256 price
    );

    event ListingUpdated(
        uint256 indexed pluginId,
        uint256 indexed listingId,
        uint256 price,
        bool active
    );

    event VersionPublished(
        uint256 indexed pluginId,
        uint256 version,
        string wasmHash
    );

    event PluginInstalled(
        uint256 indexed museId,
        uint256 indexed pluginId,
        uint256 indexed listingId,
        AccessType accessType,
        uint256 price
    );

    event TrialStarted(
        uint256 indexed museId,
        uint256 indexed pluginId,
        uint256 trialEndsAt
    );

    event PluginUpgraded(
        uint256 indexed museId,
        uint256 indexed pluginId,
        uint256 fromVersion,
        uint256 toVersion
    );

    event PluginUninstalled(
        uint256 indexed museId,
        uint256 indexed pluginId
    );

    event SubscriptionRenewed(
        uint256 indexed museId,
        uint256 indexed pluginId,
        uint256 newExpiresAt
    );

    event QuotaPurchased(
        uint256 indexed museId,
        uint256 indexed pluginId,
        uint256 quotaAdded,
        uint256 newTotal
    );

    event UsageRecorded(
        uint256 indexed museId,
        uint256 indexed pluginId,
        uint256 remainingQuota
    );

    event PluginRated(
        uint256 indexed pluginId,
        address indexed rater,
        uint8 rating
    );

    event EarningsWithdrawn(
        address indexed creator,
        uint256 amount
    );

    event PlatformFeeUpdated(uint256 newFee);

    // ============ Plugin Management ============

    function registerPlugin(
        string memory _name,
        string memory _metadataURI,
        string memory _wasmHash,
        Category _category
    ) external returns (uint256 pluginId);

    function createListing(
        uint256 _pluginId,
        AccessType _accessType,
        uint256 _price,
        uint256 _usageQuota,
        uint256 _duration,
        uint256 _trialDuration
    ) external returns (uint256 listingId);

    function updateListing(
        uint256 _pluginId,
        uint256 _listingId,
        uint256 _price,
        bool _active
    ) external;

    function publishVersion(
        uint256 _pluginId,
        string memory _wasmHash,
        string memory _changelog
    ) external returns (uint256 version);

    function deprecateVersion(uint256 _pluginId, uint256 _version) external;

    // ============ Installation ============

    function installPlugin(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId
    ) external payable;

    function startTrial(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId
    ) external;

    function upgradePlugin(
        uint256 _museId,
        uint256 _pluginId
    ) external;

    function uninstallPlugin(
        uint256 _museId,
        uint256 _pluginId
    ) external;

    function renewSubscription(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId
    ) external payable;

    function purchaseQuota(
        uint256 _museId,
        uint256 _pluginId,
        uint256 _listingId
    ) external payable;

    // ============ Usage Tracking ============

    function recordUsage(uint256 _museId, uint256 _pluginId) external;

    function hasAccess(uint256 _museId, uint256 _pluginId) external view returns (bool);

    function getInstallation(uint256 _museId, uint256 _pluginId) external view returns (Installation memory);

    // ============ Rating & Discovery ============

    function ratePlugin(uint256 _pluginId, uint8 _rating) external;

    function getPluginsByCategory(Category _category) external view returns (uint256[] memory);

    function getTopPlugins(uint256 _limit) external view returns (uint256[] memory);

    function getCreatorPlugins(address _creator) external view returns (uint256[] memory);

    // ============ Getters ============

    function getPlugin(uint256 _pluginId) external view returns (Plugin memory);

    function getPluginVersion(uint256 _pluginId, uint256 _version) external view returns (PluginVersion memory);

    function getPluginListings(uint256 _pluginId) external view returns (PluginListing[] memory);

    function getMusePlugins(uint256 _museId) external view returns (uint256[] memory);

    // ============ Earnings ============

    function withdrawEarnings() external;

    function getCreatorEarnings(address _creator) external view returns (uint256);
}
