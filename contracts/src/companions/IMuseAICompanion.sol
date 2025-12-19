// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title IMuseAICompanion
 * @notice Interface for individual AI Companion contracts
 * @dev Each MuseAI NFT holder can deploy their own companion with personality traits
 */
interface IMuseAICompanion {
    // ============ Structs ============

    /**
     * @notice Personality traits that define the AI companion's behavior
     * @param creativity 0-100: Creative thinking, imagination
     * @param wisdom 0-100: Knowledge, thoughtful analysis
     * @param humor 0-100: Joke-telling, playfulness
     * @param empathy 0-100: Emotional understanding, support
     * @param logic 0-100: Analytical reasoning, problem-solving
     */
    struct PersonalityTraits {
        uint8 creativity;
        uint8 wisdom;
        uint8 humor;
        uint8 empathy;
        uint8 logic;
    }

    // ============ Events ============

    event PersonalityUpdated(
        PersonalityTraits oldTraits,
        PersonalityTraits newTraits
    );

    event PluginInstalled(
        uint256 indexed pluginId,
        uint256 listingId
    );

    event PluginUninstalled(uint256 indexed pluginId);

    event NameUpdated(string oldName, string newName);

    event TrialStarted(uint256 indexed pluginId, uint256 listingId);

    event SubscriptionRenewed(uint256 indexed pluginId, uint256 listingId);

    event QuotaPurchased(uint256 indexed pluginId, uint256 listingId);

    event TipReceived(
        address indexed tipper,
        uint256 amount,
        string message
    );

    event TipsWithdrawn(address indexed owner, uint256 amount);

    // ============ Ownership ============

    /**
     * @notice Get the current owner (auto-follows MuseAI NFT ownership)
     * @return The address of the current owner
     */
    function owner() external view returns (address);

    /**
     * @notice Get the associated MuseAI token ID
     * @return The token ID
     */
    function tokenId() external view returns (uint256);

    // ============ Personality Management ============

    /**
     * @notice Update the companion's personality traits
     * @param _newTraits The new personality traits (each 0-100)
     */
    function updatePersonality(PersonalityTraits calldata _newTraits) external;

    /**
     * @notice Get the current personality traits
     * @return The personality traits struct
     */
    function getPersonality() external view returns (PersonalityTraits memory);

    /**
     * @notice Set a custom name for the companion
     * @param _name The new name
     */
    function setName(string calldata _name) external;

    // ============ Plugin Management ============

    /**
     * @notice Install a plugin from the marketplace
     * @param _pluginId The plugin ID to install
     * @param _listingId The listing ID (pricing option)
     */
    function installPlugin(uint256 _pluginId, uint256 _listingId) external payable;

    /**
     * @notice Start a free trial for a plugin
     * @param _pluginId The plugin ID
     * @param _listingId The listing ID with trial enabled
     */
    function startTrial(uint256 _pluginId, uint256 _listingId) external;

    /**
     * @notice Uninstall a plugin (local tracking only)
     * @param _pluginId The plugin ID to uninstall
     */
    function uninstallPlugin(uint256 _pluginId) external;

    /**
     * @notice Check if a plugin is installed and active
     * @param _pluginId The plugin ID to check
     * @return True if the plugin has active access
     */
    function hasPlugin(uint256 _pluginId) external view returns (bool);

    /**
     * @notice Get all installed plugin IDs
     * @return Array of plugin IDs
     */
    function getInstalledPlugins() external view returns (uint256[] memory);

    /**
     * @notice Renew a subscription-based plugin
     * @param _pluginId The plugin ID
     * @param _listingId The listing ID
     */
    function renewSubscription(uint256 _pluginId, uint256 _listingId) external payable;

    /**
     * @notice Purchase additional quota for usage-based plugin
     * @param _pluginId The plugin ID
     * @param _listingId The listing ID
     */
    function purchaseQuota(uint256 _pluginId, uint256 _listingId) external payable;

    // ============ Tipping ============

    /**
     * @notice Send a tip to the companion owner with a message
     * @param _message Optional message with the tip
     */
    function tip(string calldata _message) external payable;

    /**
     * @notice Withdraw all tips to the owner
     */
    function withdrawTips() external;

    /**
     * @notice Get total tips received by this companion
     * @return Total amount of tips received
     */
    function totalTipsReceived() external view returns (uint256);

    // ============ Utility ============

    /**
     * @notice Get comprehensive companion information
     * @return _tokenId The associated NFT token ID
     * @return _owner The current owner
     * @return _name The companion name
     * @return _personality The personality traits
     * @return _pluginCount Number of installed plugins
     * @return _createdAt Creation timestamp
     */
    function getInfo() external view returns (
        uint256 _tokenId,
        address _owner,
        string memory _name,
        PersonalityTraits memory _personality,
        uint256 _pluginCount,
        uint256 _createdAt
    );
}

/**
 * @title IMuseAICompanionFactory
 * @notice Interface for the companion factory contract
 */
interface IMuseAICompanionFactory {
    // ============ Events ============

    event CompanionCreated(
        uint256 indexed tokenId,
        address indexed owner,
        address companionContract,
        IMuseAICompanion.PersonalityTraits traits
    );

    event CompanionDeactivated(uint256 indexed tokenId);

    // ============ Functions ============

    /**
     * @notice Deploy a new companion for a MuseAI NFT
     * @param _tokenId The MuseAI token ID
     * @param _traits Initial personality traits
     * @return The deployed companion contract address
     */
    function deployCompanion(
        uint256 _tokenId,
        IMuseAICompanion.PersonalityTraits calldata _traits
    ) external returns (address);

    /**
     * @notice Get the companion contract address for a token
     * @param _tokenId The MuseAI token ID
     * @return The companion contract address (zero if none)
     */
    function getCompanion(uint256 _tokenId) external view returns (address);

    /**
     * @notice Check if a token has a deployed companion
     * @param _tokenId The MuseAI token ID
     * @return True if companion exists
     */
    function hasCompanion(uint256 _tokenId) external view returns (bool);

    /**
     * @notice Get the total number of deployed companions
     * @return The count
     */
    function totalCompanions() external view returns (uint256);
}
